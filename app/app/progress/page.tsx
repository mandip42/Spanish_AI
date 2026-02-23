import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const MISTAKE_LABELS: Record<string, string> = {
  ser_estar: "Ser / Estar",
  gender_agreement: "Gender agreement",
  verb_conjugation: "Verb conjugation",
  word_order: "Word order",
  articles: "Articles",
  prepositions: "Prepositions",
  other: "Other",
};

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayStats } = await supabase
    .from("user_stats_daily")
    .select("minutes, streak_count, sessions_count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_goal_minutes, week")
    .eq("id", user.id)
    .single();

  const { data: last7Days } = await supabase
    .from("user_stats_daily")
    .select("date, minutes, sessions_count")
    .eq("user_id", user.id)
    .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    .order("date", { ascending: false });

  const { data: mistakes } = await supabase
    .from("mistake_events")
    .select("category")
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const categoryCounts: Record<string, number> = {};
  (mistakes || []).forEach((m) => {
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
  });
  const topMistakes = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const { data: vocabDue } = await supabase
    .from("vocab_items")
    .select("id, phrase_es, phrase_en, next_review_date")
    .eq("user_id", user.id)
    .lte("next_review_date", today)
    .order("next_review_date")
    .limit(20);

  const { data: vocabUpcoming } = await supabase
    .from("vocab_items")
    .select("id, phrase_es, next_review_date")
    .eq("user_id", user.id)
    .gt("next_review_date", today)
    .order("next_review_date")
    .limit(10);

  const streak = todayStats?.streak_count ?? 0;
  const goal = profile?.daily_goal_minutes ?? 30;

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
        Progress
      </h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
          Streak & minutes
        </h2>
        <div className="mt-3 rounded-xl bg-stone-100 dark:bg-stone-800 p-4">
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            🔥 {streak} day{streak !== 1 ? "s" : ""}
          </p>
          <p className="text-sm text-stone-500 mt-1">
            Today: {(todayStats?.minutes ?? 0)} / {goal} min
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
          Last 7 days
        </h2>
        <ul className="mt-3 space-y-2">
          {(last7Days || []).map((d) => (
            <li
              key={d.date}
              className="flex justify-between items-center rounded-lg bg-stone-100 dark:bg-stone-800 px-4 py-2"
            >
              <span className="text-stone-700 dark:text-stone-300">{d.date}</span>
              <span className="text-stone-600 dark:text-stone-400">
                {d.minutes} min · {d.sessions_count} session(s)
              </span>
            </li>
          ))}
          {(!last7Days || last7Days.length === 0) && (
            <li className="text-stone-500 text-sm">No data yet. Start a session!</li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
          Top recurring mistakes
        </h2>
        <ul className="mt-3 space-y-2">
          {topMistakes.map(([cat, count]) => (
            <li
              key={cat}
              className="flex justify-between rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-2"
            >
              <span>{MISTAKE_LABELS[cat] || cat}</span>
              <span className="text-amber-700 dark:text-amber-400">{count}</span>
            </li>
          ))}
          {topMistakes.length === 0 && (
            <li className="text-stone-500 text-sm">None recorded yet.</li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
          Vocabulary · Review
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          Due today: {vocabDue?.length ?? 0}. Upcoming: {vocabUpcoming?.length ?? 0}.
        </p>
        <div className="mt-3 space-y-2">
          {(vocabDue || []).slice(0, 5).map((v) => (
            <div
              key={v.id}
              className="rounded-lg border border-stone-200 dark:border-stone-700 p-3"
            >
              <p className="font-medium text-stone-900 dark:text-stone-100">
                {v.phrase_es}
              </p>
              {v.phrase_en && (
                <p className="text-sm text-stone-500 mt-1">{v.phrase_en}</p>
              )}
            </div>
          ))}
          {(!vocabDue || vocabDue.length === 0) && (
            <p className="text-stone-500 text-sm">No phrases due. Keep practicing!</p>
          )}
        </div>
        <Link
          href="/app/practice"
          className="mt-4 inline-block text-primary-600 dark:text-primary-400 text-sm font-medium"
        >
          Practice more →
        </Link>
      </section>
    </div>
  );
}
