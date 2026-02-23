export type AccentRegion = "mexico" | "spain" | "colombia" | "neutral";
export type DailyGoalMinutes = 15 | 30 | 45 | 60;
export type SessionMode =
  | "free_conversation"
  | "roleplay"
  | "storytelling"
  | "speed_round"
  | "debate";

export interface Profile {
  id: string;
  display_name: string | null;
  accent: AccentRegion;
  daily_goal_minutes: DailyGoalMinutes;
  week: number;
  level_estimate: string; // A0 | A1 | A2
  learner_memory: string | null;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  household_id: string | null;
  started_at: string;
  ended_at: string | null;
  minutes: number | null;
  week: number;
  mode: SessionMode;
  summary: string | null;
  created_at: string;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface UserStatsDaily {
  user_id: string;
  date: string;
  minutes: number;
  streak_count: number;
  sessions_count: number;
}

export type MistakeCategory =
  | "ser_estar"
  | "gender_agreement"
  | "verb_conjugation"
  | "word_order"
  | "articles"
  | "prepositions"
  | "other";

export interface MistakeEvent {
  id: string;
  user_id: string;
  session_id: string;
  category: MistakeCategory;
  example_before: string;
  example_after: string;
  created_at: string;
}

export interface VocabItem {
  id: string;
  user_id: string;
  phrase_es: string;
  phrase_en: string | null;
  context: string | null;
  next_review_date: string;
  interval_days: number;
  created_at: string;
}
