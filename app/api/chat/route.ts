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
    mode: string;
    week: number;
    accent: string;
    learner_memory?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id, user_message, mode, week, accent, learner_memory } = body;
  if (!session_id || typeof user_message !== "string") {
    return NextResponse.json({ error: "session_id and user_message required" }, { status: 400 });
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

  const lastMistakes: string[] = [];
  const { data: recentMistakes } = await supabase
    .from("mistake_events")
    .select("category")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);
  recentMistakes?.forEach((m) => lastMistakes.push(m.category));

  const systemPrompt = buildTutorSystemPrompt({
    week: week || 1,
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
