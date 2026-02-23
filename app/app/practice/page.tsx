import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PracticeClient from "./PracticeClient";

export default async function PracticePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("week, accent, learner_memory")
    .eq("id", user.id)
    .single();

  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("mode")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(5);

  const lastModes = (recentSessions || []).map((s) => s.mode as "free_conversation" | "roleplay" | "storytelling" | "speed_round" | "debate");

  return (
    <PracticeClient
      userId={user.id}
      week={profile?.week ?? 1}
      accent={profile?.accent ?? "neutral"}
      learnerMemory={profile?.learner_memory ?? undefined}
      lastModes={lastModes}
    />
  );
}
