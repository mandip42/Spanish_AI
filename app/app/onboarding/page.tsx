"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AccentRegion, DailyGoalMinutes } from "@/lib/types";

const ACCENTS: { value: AccentRegion; label: string }[] = [
  { value: "mexico", label: "México" },
  { value: "spain", label: "España" },
  { value: "colombia", label: "Colombia" },
  { value: "neutral", label: "Neutral" },
];

const GOALS: DailyGoalMinutes[] = [15, 30, 45, 60];

export default function OnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [accent, setAccent] = useState<AccentRegion>("neutral");
  const [dailyGoal, setDailyGoal] = useState<DailyGoalMinutes>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("display_name, accent, daily_goal_minutes")
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || "");
          setAccent((data.accent as AccentRegion) || "neutral");
          setDailyGoal((data.daily_goal_minutes as DailyGoalMinutes) || 30);
        }
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    const { error: err } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        accent,
        daily_goal_minutes: dailyGoal,
      })
      .eq("id", user.id);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/app");
    router.refresh();
  };

  return (
    <div className="px-6 py-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
        Set your preferences
      </h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        Choose accent and daily goal. You can change these in Settings later.
      </p>
      <form onSubmit={handleSave} className="mt-8 space-y-8">
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Display name (optional)
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-3"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Accent / Region
          </label>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAccent(a.value)}
                className={`tap-target rounded-lg px-4 py-2 text-sm font-medium ${
                  accent === a.value
                    ? "bg-primary-600 text-white"
                    : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Daily goal (minutes)
          </label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setDailyGoal(g)}
                className={`tap-target rounded-lg px-4 py-2 text-sm font-medium ${
                  dailyGoal === g
                    ? "bg-primary-600 text-white"
                    : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="tap-target w-full rounded-xl bg-primary-600 text-white font-semibold py-3"
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
