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
    .maybeSingle();

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayStats } = await supabase
    .from("user_stats_daily")
    .select("minutes, streak_count, sessions_count")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  const { data: householdMember } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "You";
  const goal = profile?.daily_goal_minutes ?? 30;
  const minutes = todayStats?.minutes ?? 0;
  const streak = todayStats?.streak_count ?? 0;
  const week = profile?.week ?? 1;
  const progressPct = goal > 0 ? Math.min(100, (minutes / goal) * 100) : 0;

  return (
    <div className="px-5 py-8 max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="heading-display text-2xl text-stone-900 dark:text-white">
          Hola, {displayName}
        </h1>
        <p className="mt-1.5 text-stone-500 dark:text-stone-400 text-sm">
          Week {week} · Goal: {goal} min/day
        </p>
      </div>

      <div className="card border-primary-200/50 dark:border-primary-800/50 bg-gradient-to-br from-primary-50/80 to-white dark:from-primary-950/40 dark:to-stone-900/90 p-6">
        <p className="text-sm font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wide">
          Today&apos;s progress
        </p>
        <p className="mt-2 text-3xl font-display font-bold text-primary-600 dark:text-primary-400">
          {minutes} <span className="text-lg font-normal text-stone-500 dark:text-stone-400">/ {goal} min</span>
        </p>
        <div className="mt-4 h-3 rounded-full bg-primary-200/60 dark:bg-primary-800/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
          <span className="text-lg" aria-hidden>🔥</span>
          <span className="font-medium">Streak: {streak} day{streak !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <Link
        href="/app/practice"
        className="tap-target mt-8 flex items-center justify-center gap-2 rounded-2xl bg-primary-500 text-white font-display font-semibold py-4 px-6 text-lg shadow-card hover:bg-primary-600 hover:shadow-glow active:scale-[0.98] transition-all"
      >
        <span aria-hidden>▶</span>
        Start Session
      </Link>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <Link
          href="/app/progress"
          className="card tap-target block p-5 hover:shadow-card hover:border-primary-200 dark:hover:border-primary-800/50 transition-all group"
        >
          <span className="text-2xl mb-2 block" aria-hidden>📈</span>
          <p className="font-display font-semibold text-stone-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            Progress
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Streak, mistakes, vocab
          </p>
        </Link>
        <Link
          href="/app/household"
          className="card tap-target block p-5 hover:shadow-card hover:border-primary-200 dark:hover:border-primary-800/50 transition-all group"
        >
          <span className="text-2xl mb-2 block" aria-hidden>🏠</span>
          <p className="font-display font-semibold text-stone-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            Household
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {householdMember ? "View dashboard" : "Create or join"}
          </p>
        </Link>
      </div>

      <Link
        href="/app/onboarding"
        className="mt-8 block text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
      >
        Set accent & daily goal
      </Link>
    </div>
  );
}
