"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSuggestedMode, MODE_LABELS } from "@/lib/session-utils";
import type { SessionMode } from "@/lib/types";

// Web Speech API types (not in all TS libs)
type SpeechRecognitionResultEvent = {
  results: { length: number; [i: number]: { length?: number; [j: number]: { transcript: string } } };
};
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
}

interface PracticeClientProps {
  userId: string;
  week: number;
  accent: string;
  learnerMemory?: string | null;
  lastModes: SessionMode[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function PracticeClient({
  userId,
  week,
  accent,
  learnerMemory,
  lastModes,
}: PracticeClientProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<SessionMode>(() =>
    getSuggestedMode(week, lastModes)
  );
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [takeaway, setTakeaway] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    setVoiceSupported(
      typeof window !== "undefined" &&
        !!(
          (window as unknown as { webkitSpeechRecognition?: unknown })
            .webkitSpeechRecognition ||
          (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition
        )
    );
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    timerRef.current = setInterval(() => {
      setTimerMinutes((m) => m + 1);
    }, 60_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const startSession = async () => {
    setError(null);
    setLoading(true);
    const { data: h } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    const { data: newSession, error: err } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        household_id: h?.household_id ?? null,
        week,
        mode,
      })
      .select("id")
      .single();
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (newSession) {
      setSessionId(newSession.id);
      setMessages([]);
      setTimerMinutes(0);
      setTimerRunning(true);
      setSessionEnded(false);
      setTakeaway(null);
      setError(null);
      fetchOpeningMessage(newSession.id);
    }
  };

  const fetchOpeningMessage = async (sid: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sid,
          user_message: "",
          first_message: true,
          week,
          accent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load");
        setLoading(false);
        return;
      }
      const opening = data.message as string;
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: opening },
      ]);
      await supabase.from("session_messages").insert({
        session_id: sid,
        role: "assistant",
        content: opening,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
    setLoading(false);
  };

  const sendMessage = async (text: string) => {
    if (!sessionId || !text.trim()) return;
    const userContent = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: userContent }]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_message: userContent,
          mode,
          week,
          accent,
          learner_memory: learnerMemory || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to get response");
        setLoading(false);
        return;
      }
      const assistantContent = data.message as string;
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: assistantContent },
      ]);
      await supabase.from("session_messages").insert([
        { session_id: sessionId, role: "user", content: userContent },
        { session_id: sessionId, role: "assistant", content: assistantContent },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
    setLoading(false);
  };

  const endSession = async () => {
    if (!sessionId) return;
    setTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          minutes: timerMinutes || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to end session");
        setLoading(false);
        return;
      }
      setTakeaway(data.takeaway || "Great session! Review your phrases in Progress.");
      setSessionEnded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
    setLoading(false);
  };

  const startVoiceInput = () => {
    if (!voiceSupported) return;
    const Win = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      SpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRecognition = Win.webkitSpeechRecognition || Win.SpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "es-ES";
    setListening(true);
    rec.onresult = (event: SpeechRecognitionResultEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result?.[0]?.transcript ?? "";
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  if (!sessionId) {
    return (
      <div className="px-5 py-8 max-w-lg mx-auto">
        <h1 className="heading-display text-2xl text-stone-900 dark:text-white">
          Practice
        </h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400 text-sm">
          Week {week}. One tap starts your daily conversation.
        </p>
        <div className="mt-6 card p-5">
          <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
            Session mode
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                "free_conversation",
                "roleplay",
                "storytelling",
                "speed_round",
                "debate",
              ] as SessionMode[]
            ).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`tap-target rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  mode === m
                    ? "bg-primary-500 text-white shadow-soft"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={startSession}
          disabled={loading}
          className="tap-target mt-8 w-full btn-primary py-4 text-base disabled:opacity-50"
        >
          {loading ? "Starting…" : "Start Session"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] max-w-lg mx-auto bg-surface-50 dark:bg-stone-950/50">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-200/80 dark:border-stone-700/80 shrink-0 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
        <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
          {MODE_LABELS[mode]} · Week {week}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums text-stone-500 dark:text-stone-400 font-medium">
            ⏱ {timerMinutes} min
          </span>
          {!sessionEnded && (
            <button
              type="button"
              onClick={endSession}
              disabled={loading}
              className="tap-target text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              End session
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-soft ${
                msg.role === "user"
                  ? "bg-primary-500 text-white rounded-br-md"
                  : "card rounded-bl-md border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              }`}
            >
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md card px-4 py-3 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {takeaway && (
        <div className="px-4 py-4 bg-accent-50 dark:bg-accent-950/50 border-t border-accent-200/80 dark:border-accent-800/50">
          <p className="text-sm font-semibold text-accent-800 dark:text-accent-200">
            One takeaway
          </p>
          <p className="mt-1 text-sm text-accent-700 dark:text-accent-300 leading-relaxed">
            {takeaway}
          </p>
        </div>
      )}

      {!sessionEnded && (
        <div className="p-4 border-t border-stone-200/80 dark:border-stone-700/80 shrink-0 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm mb-2 px-1">{error}</p>
          )}
          <div className="flex gap-2">
            {voiceSupported && (
              <button
                type="button"
                onClick={startVoiceInput}
                disabled={listening}
                className="tap-target shrink-0 rounded-xl border-2 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-3 font-medium hover:border-primary-300 dark:hover:border-primary-700 disabled:opacity-50 transition"
              >
                {listening ? "Listening…" : "🎤"}
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Type in Spanish…"
              className="input-field flex-1 py-3"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="tap-target shrink-0 rounded-xl bg-primary-500 text-white px-4 py-3 font-semibold shadow-soft hover:bg-primary-600 disabled:opacity-50 transition"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400 px-1">
            {week === 1 ? (
              <>Type what the tutor asked for above (e.g. <strong>Hola</strong>), then Send. You can also use 🎤 to speak.</>
            ) : (
              <>Speak out loud: read the prompts and answer in Spanish. Use 🎤 if your browser supports it.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
