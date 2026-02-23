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
    <div className="px-5 py-10 max-w-md mx-auto">
      <h1 className="heading-display text-2xl text-stone-900 dark:text-white">
        Set your preferences
      </h1>
      <p className="mt-2 text-stone-500 dark:text-stone-400 text-sm">
        Choose accent and daily goal. You can change these in Settings later.
      </p>
      <form onSubmit={handleSave} className="mt-8">
        <div className="card p-5 space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Display name (optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
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
                  className={`tap-target rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    accent === a.value
                      ? "bg-primary-500 text-white shadow-soft"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
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
                  className={`tap-target rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    dailyGoal === g
                      ? "bg-primary-500 text-white shadow-soft"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
