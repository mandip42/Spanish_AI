import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { buildTutorSystemPrompt } from "@/lib/ai-prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function useGemini(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

async function geminiOpening(openingPrompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: openingPrompt,
  });
  const result = await model.generateContent("Send your opening message now.");
  const response = result.response;
  const text = response.text();
  return text?.trim() || "¡Hola! Type **Hola** in the box below to say hello.";
}

async function geminiChat(
  systemPrompt: string,
  history: { role: string; content: string }[],
  userMessage: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt,
  });
  const geminiHistory = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    }));
  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(userMessage);
  const text = result.response.text();
  return text?.trim() || "No response.";
}

export async function POST(request: Request) {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  if (!hasGemini && !hasOpenAI) {
    return NextResponse.json(
      { error: "Add GEMINI_API_KEY or OPENAI_API_KEY in environment variables." },
      { status: 500 }
    );
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
      if (useGemini()) {
        const assistantMessage = await geminiOpening(openingPrompt);
        return NextResponse.json({ message: assistantMessage });
      }
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
      console.error("AI opening error:", err);
      const message = (err as { message?: string })?.message ?? "AI request failed";
      const status = (err as { status?: number })?.status;
      if (status === 429) {
        return NextResponse.json(
          { error: useGemini() ? "Gemini rate limit exceeded. Try again later." : "OpenAI quota exceeded. Add payment at platform.openai.com." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: message }, { status: 500 });
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

  try {
    if (useGemini()) {
      const assistantMessage = await geminiChat(
        systemPrompt,
        recentMessages || [],
        user_message
      );
      return NextResponse.json({ message: assistantMessage });
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...(recentMessages || []).map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      { role: "user", content: user_message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });
    const assistantMessage = completion.choices[0]?.message?.content?.trim() || "No response.";
    return NextResponse.json({ message: assistantMessage });
  } catch (err) {
    console.error("AI chat error:", err);
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return NextResponse.json(
        { error: useGemini() ? "Gemini rate limit exceeded. Try again later." : "OpenAI quota exceeded. Add payment at platform.openai.com." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}
