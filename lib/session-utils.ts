import type { SessionMode } from "./types";

export function getSuggestedMode(week: number, lastModes: SessionMode[]): SessionMode {
  if (week === 1) return "free_conversation";
  if (week === 2) return "roleplay";
  if (week === 3) {
    if (lastModes.filter((m) => m === "speed_round").length < 2) return "speed_round";
    return "free_conversation";
  }
  if (week === 4) {
    if (lastModes.filter((m) => m === "debate").length < 1) return "debate";
    return "free_conversation";
  }
  return "free_conversation";
}

export const MODE_LABELS: Record<SessionMode, string> = {
  free_conversation: "Free conversation",
  roleplay: "Roleplay",
  storytelling: "Storytelling",
  speed_round: "Speed round",
  debate: "Debate",
};

export const WEEK_THEMES: Record<number, string> = {
  1: "Survival speaking, present tense, high-frequency phrases",
  2: "Roleplays, past/future basics, longer turns",
  3: "Natural conversation, listening, speed, optional slang",
  4: "Immersion, opinions/debates, polishing",
};
