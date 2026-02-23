import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HouseholdClient from "./HouseholdClient";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function HouseholdPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let household: { id: string; name: string; invite_code: string; owner_id: string } | null = null;
  let members: { user_id: string; display_name: string | null }[] = [];
  let isOwner = false;

  if (membership?.household_id) {
    const { data: h } = await supabase
      .from("households")
      .select("id, name, invite_code, owner_id")
      .eq("id", membership.household_id)
      .maybeSingle();
    household = h ?? null;
    isOwner = membership.role === "owner";
    const { data: mems } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", membership.household_id);
    if (mems?.length) {
      const ids = mems.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      members = (profiles || []).map((p) => ({
        user_id: p.id,
        display_name: p.display_name,
      }));
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const memberStats: { user_id: string; minutes: number; streak_count: number }[] = [];
  if (members.length) {
    const { data: stats } = await supabase
      .from("user_stats_daily")
      .select("user_id, minutes, streak_count")
      .in("user_id", members.map((m) => m.user_id))
      .eq("date", today);
    stats?.forEach((s) => {
      memberStats.push({
        user_id: s.user_id,
        minutes: s.minutes,
        streak_count: s.streak_count,
      });
    });
  }

  return (
    <HouseholdClient
      userId={user.id}
      household={household}
      members={members}
      memberStats={memberStats}
      isOwner={isOwner}
      generateInviteCode={generateInviteCode}
    />
  );
}
