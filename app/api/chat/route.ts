import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { buildTutorSystemPrompt } from "@/lib/ai-prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    session_id: string;
    user_message: string;
    first_message?: boolean;
    mode?: string;
    week?: number;
    accent?: string;
    learner_memory?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id, user_message, first_message, mode, week, accent, learner_memory } = body;
  if (!session_id) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }
  if (!first_message && typeof user_message !== "string") {
    return NextResponse.json({ error: "user_message required" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("user_id")
    .eq("id", session_id)
    .single();
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: recentMessages } = await supabase
    .from("session_messages")
    .select("role, content")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true })
    .limit(20);

  const weekNum = week ?? 1;

  if (first_message) {
    const openingPrompt = weekNum === 1
      ? `The learner has just started their first practice session. They may have zero Spanish. Your job: greet them warmly in Spanish, then tell them exactly what to type to begin. Give ONE simple phrase, e.g. "Hola" or "¿Cómo estás?" and say they can type it in the box. You may add the meaning in English in parentheses. Keep your message to 2-3 short sentences. Be encouraging.`
      : `The learner has just started a practice session (week ${weekNum}). Greet them in Spanish and give one short prompt or question they can respond to (e.g. a simple question or a phrase to repeat). Keep it to 2-3 sentences.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: openingPrompt },
          { role: "user", content: "Send your opening message now." },
        ],
        max_tokens: 250,
        temperature: 0.7,
      });
      const assistantMessage = completion.choices[0]?.message?.content?.trim() || "¡Hola! Type **Hola** in the box below to say hello.";
      return NextResponse.json({ message: assistantMessage });
    } catch (err) {
      console.error("OpenAI opening error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "AI request failed" },
        { status: 500 }
      );
    }
  }

  const lastMistakes: string[] = [];
  const { data: recentMistakes } = await supabase
    .from("mistake_events")
    .select("category")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);
  recentMistakes?.forEach((m) => lastMistakes.push(m.category));

  const systemPrompt = buildTutorSystemPrompt({
    week: weekNum,
    mode: (mode as "free_conversation" | "roleplay" | "storytelling" | "speed_round" | "debate") || "free_conversation",
    accent: accent || "neutral",
    learnerMemory: learner_memory ?? undefined,
    lastMistakes,
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...(recentMessages || []).map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    { role: "user", content: user_message },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });
    const assistantMessage = completion.choices[0]?.message?.content?.trim() || "No response.";
    return NextResponse.json({ message: assistantMessage });
  } catch (err) {
    console.error("OpenAI error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}
