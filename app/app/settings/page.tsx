import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import type { AccentRegion, DailyGoalMinutes } from "@/lib/types";

const ACCENTS: { value: AccentRegion; label: string }[] = [
  { value: "mexico", label: "México" },
  { value: "spain", label: "España" },
  { value: "colombia", label: "Colombia" },
  { value: "neutral", label: "Neutral" },
];

const GOALS: DailyGoalMinutes[] = [15, 30, 45, 60];

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, accent, daily_goal_minutes, week")
    .eq("id", user.id)
    .single();

  return (
    <SettingsClient
      userId={user.id}
      displayName={profile?.display_name ?? ""}
      accent={(profile?.accent as AccentRegion) ?? "neutral"}
      dailyGoal={(profile?.daily_goal_minutes as DailyGoalMinutes) ?? 30}
      week={profile?.week ?? 1}
      accents={ACCENTS}
      goals={GOALS}
    />
  );
}
