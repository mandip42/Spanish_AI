import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, week, daily_goal_minutes")
    .eq("id", user.id)
    .single();

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayStats } = await supabase
    .from("user_stats_daily")
    .select("minutes, streak_count, sessions_count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const { data: householdMember } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const displayName = profile?.display_name || profile?.display_name || user.email?.split("@")[0] || "You";
  const goal = profile?.daily_goal_minutes ?? 30;
  const minutes = todayStats?.minutes ?? 0;
  const streak = todayStats?.streak_count ?? 0;
  const week = profile?.week ?? 1;

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
        Hola, {displayName}
      </h1>
      <p className="mt-1 text-stone-600 dark:text-stone-400">
        Week {week} · Goal: {goal} min/day
      </p>

      <div className="mt-8 rounded-2xl bg-primary-100 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 p-6">
        <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
          Today&apos;s progress
        </p>
        <p className="mt-2 text-3xl font-bold text-primary-700 dark:text-primary-300">
          {minutes} <span className="text-lg font-normal">/ {goal} min</span>
        </p>
        <div className="mt-3 h-2 rounded-full bg-primary-200 dark:bg-primary-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-600 transition-all"
            style={{ width: `${Math.min(100, (minutes / goal) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-primary-700 dark:text-primary-300">
          🔥 Streak: {streak} day{streak !== 1 ? "s" : ""}
        </p>
      </div>

      <Link
        href="/app/practice"
        className="tap-target mt-8 flex items-center justify-center rounded-2xl bg-primary-600 text-white font-bold py-4 px-6 text-lg shadow-lg hover:bg-primary-700 active:scale-[0.98] transition"
      >
        Start Session
      </Link>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <Link
          href="/app/progress"
          className="tap-target rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50"
        >
          <p className="font-medium text-stone-900 dark:text-stone-100">Progress</p>
          <p className="text-sm text-stone-500">Streak, mistakes, vocab</p>
        </Link>
        <Link
          href="/app/household"
          className="tap-target rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50"
        >
          <p className="font-medium text-stone-900 dark:text-stone-100">Household</p>
          <p className="text-sm text-stone-500">
            {householdMember ? "View dashboard" : "Create or join"}
          </p>
        </Link>
      </div>

      <Link
        href="/app/onboarding"
        className="mt-6 block text-center text-sm text-primary-600 dark:text-primary-400"
      >
        Set accent & daily goal
      </Link>
    </div>
  );
}
