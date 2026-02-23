import { WEEK_THEMES } from "./session-utils";
import type { SessionMode } from "./types";

const MODE_INSTRUCTIONS: Record<SessionMode, string> = {
  free_conversation:
    "Have a natural back-and-forth. Ask follow-up questions. Keep turns short so the learner can respond.",
  roleplay:
    "Set a simple scenario (e.g. ordering food, asking directions). Stay in character. Gently correct and encourage.",
  storytelling:
    "Ask the learner to tell a short story (their day, a memory). Ask clarifying questions. Correct key errors.",
  speed_round:
    "Keep exchanges very short. Quick questions, quick answers. Gently note errors without long explanations.",
  debate:
    "Introduce a simple opinion topic. Ask for their view, then a counter. Keep it light; correct form.",
};

const ACCENT_NOTE: Record<string, string> = {
  mexico: "Prefer vocabulary and expressions common in Mexico.",
  spain: "Prefer vocabulary and expressions common in Spain (e.g. vosotros if natural).",
  colombia: "Prefer vocabulary and expressions common in Colombia.",
  neutral: "Use neutral Spanish.",
};

export function buildTutorSystemPrompt(options: {
  week: number;
  mode: SessionMode;
  accent: string;
  learnerMemory?: string | null;
  lastMistakes?: string[];
}): string {
  const { week, mode, accent, learnerMemory, lastMistakes } = options;
  const theme = WEEK_THEMES[week] || WEEK_THEMES[1];
  const modeInstr = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.free_conversation;
  const accentInstr = ACCENT_NOTE[accent] || ACCENT_NOTE.neutral;

  let prompt = `You are a Spanish immersion tutor. Your goal is to help the learner reach conversational fluency in 4 weeks.

RULES:
- Speak primarily in Spanish. In week 1 only, you may use a very short English explanation if the learner is clearly stuck (one short phrase max).
- Adapt your level to week ${week}: ${theme}.
- Encourage the learner to produce output: ask follow-up questions, ask them to re-say a corrected sentence.
- Keep corrections brief. Format: give the correct version, then one short "Why" (in Spanish), then "Try again" or "Repite, por favor."
- No long grammar lectures. Micro-lessons: 2–5 sentences max when you explain something.
- Session mode: ${mode}. ${modeInstr}
- ${accentInstr}
`;

  if (learnerMemory?.trim()) {
    prompt += `\nLearner context (use to personalize):\n${learnerMemory}\n`;
  }
  if (lastMistakes?.length) {
    prompt += `\nRecent mistake categories to watch for: ${lastMistakes.join(", ")}.\n`;
  }

  prompt += `\nReply in Spanish only (except rare week-1 English). Keep your reply concise (2–4 sentences unless doing a micro-lesson).`;
  return prompt;
}

export function buildSessionSummaryPrompt(messages: { role: string; content: string }[]): string {
  const transcript = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");
  return `You are summarizing a Spanish practice session. Extract the following in JSON format only, no other text.

Transcript:
${transcript}

Return a single JSON object with these keys:
- "takeaway": One short sentence (in English) the learner should remember (e.g. one correction or one tip).
- "phrases": Array of up to 5 objects with "es" (Spanish phrase) and "en" (English, optional). Key phrases learned or practiced.
- "mistakes": Array of objects with "category" (one of: ser_estar, gender_agreement, verb_conjugation, word_order, articles, prepositions, other), "before" (learner's incorrect text), "after" (corrected version). Only include clear corrections from the session.
- "memory": A compact 2–4 sentence summary of what the learner worked on and their level, for future sessions.

Output only the JSON object.`;
}
