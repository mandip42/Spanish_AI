import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function useGemini(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

async function geminiSessionSummary(summaryPrompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(summaryPrompt);
  return result.response.text()?.trim() ?? "";
}

type MistakeCategory =
  | "ser_estar"
  | "gender_agreement"
  | "verb_conjugation"
  | "word_order"
  | "articles"
  | "prepositions"
  | "other";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { session_id: string; minutes: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id, minutes } = body;
  if (!session_id) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, user_id, week")
    .eq("id", session_id)
    .single();
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from("session_messages")
    .select("role, content")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true });

  let takeaway = "Great session! Review your phrases in Progress.";
  let memoryUpdate: string | null = null;
  const phrasesToInsert: { phrase_es: string; phrase_en: string | null }[] = [];
  const mistakesToInsert: { category: MistakeCategory; example_before: string; example_after: string }[] = [];

  const hasAi = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (hasAi && messages && messages.length >= 2) {
    const { buildSessionSummaryPrompt } = await import("@/lib/ai-prompts");
    const summaryPrompt = buildSessionSummaryPrompt(messages);
    try {
      let text: string;
      if (useGemini()) {
        text = await geminiSessionSummary(summaryPrompt);
      } else {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: summaryPrompt }],
          max_tokens: 600,
          temperature: 0.3,
        });
        text = completion.choices[0]?.message?.content?.trim() || "";
      }
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]) as {
          takeaway?: string;
          phrases?: { es: string; en?: string }[];
          mistakes?: { category: string; before: string; after: string }[];
          memory?: string;
        };
        if (data.takeaway) takeaway = data.takeaway;
        if (data.memory) memoryUpdate = data.memory;
        if (Array.isArray(data.phrases)) {
          data.phrases.forEach((p) => {
            if (p?.es) phrasesToInsert.push({ phrase_es: p.es, phrase_en: p.en || null });
          });
        }
        if (Array.isArray(data.mistakes)) {
          const allowed: MistakeCategory[] = [
            "ser_estar",
            "gender_agreement",
            "verb_conjugation",
            "word_order",
            "articles",
            "prepositions",
            "other",
          ];
          data.mistakes.forEach((m) => {
            if (m?.category && allowed.includes(m.category as MistakeCategory) && m.before && m.after) {
              mistakesToInsert.push({
                category: m.category as MistakeCategory,
                example_before: m.before,
                example_after: m.after,
              });
            }
          });
        }
      }
    } catch (err) {
      console.error("Session summary error:", err);
    }
  }

  const summaryForDb = takeaway + (memoryUpdate ? ` | Memory: ${memoryUpdate}` : "");

  await supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
      minutes: minutes || 1,
      summary: summaryForDb,
    })
    .eq("id", session_id);

  const today = new Date().toISOString().slice(0, 10);
  const { data: existingStat } = await supabase
    .from("user_stats_daily")
    .select("minutes, streak_count, sessions_count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const prevDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: prevStat } = await supabase
    .from("user_stats_daily")
    .select("streak_count, sessions_count")
    .eq("user_id", user.id)
    .eq("date", prevDay)
    .single();

  const newMinutes = (existingStat?.minutes ?? 0) + (minutes || 1);
  const newSessions = (existingStat?.sessions_count ?? 0) + 1;
  const hadActivityYesterday = prevStat && (prevStat.sessions_count ?? 0) > 0;
  const newStreak = hadActivityYesterday && prevStat?.streak_count != null
    ? prevStat.streak_count + 1
    : 1;

  await supabase.from("user_stats_daily").upsert(
    {
      user_id: user.id,
      date: today,
      minutes: newMinutes,
      streak_count: newStreak,
      sessions_count: newSessions,
    },
    { onConflict: "user_id,date" }
  );

  for (const m of mistakesToInsert) {
    await supabase.from("mistake_events").insert({
      user_id: user.id,
      session_id,
      category: m.category,
      example_before: m.example_before,
      example_after: m.example_after,
    });
  }

  const todayDate = new Date(today);
  for (const p of phrasesToInsert.slice(0, 5)) {
    const nextReview = new Date(todayDate);
    nextReview.setDate(nextReview.getDate() + 1);
    await supabase.from("vocab_items").insert({
      user_id: user.id,
      phrase_es: p.phrase_es,
      phrase_en: p.phrase_en,
      context: "Session",
      next_review_date: nextReview.toISOString().slice(0, 10),
      interval_days: 1,
    });
  }

  if (memoryUpdate) {
    await supabase
      .from("profiles")
      .update({ learner_memory: memoryUpdate })
      .eq("id", user.id);
  }

  return NextResponse.json({ takeaway });
}
