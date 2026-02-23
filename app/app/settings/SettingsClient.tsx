"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PWAInstallInstructions } from "@/components/PWAInstall";
import type { AccentRegion, DailyGoalMinutes } from "@/lib/types";

interface SettingsClientProps {
  userId: string;
  displayName: string;
  accent: AccentRegion;
  dailyGoal: DailyGoalMinutes;
  week: number;
  accents: { value: AccentRegion; label: string }[];
  goals: DailyGoalMinutes[];
}

export default function SettingsClient({
  userId,
  displayName: initialDisplayName,
  accent: initialAccent,
  dailyGoal: initialDailyGoal,
  week: initialWeek,
  accents,
  goals,
}: SettingsClientProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [accent, setAccent] = useState<AccentRegion>(initialAccent);
  const [dailyGoal, setDailyGoal] = useState<DailyGoalMinutes>(initialDailyGoal);
  const [week, setWeek] = useState(initialWeek);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const saveProfile = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        accent,
        daily_goal_minutes: dailyGoal,
        week: Math.max(1, Math.min(4, week)),
      })
      .eq("id", userId);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess("Saved.");
    setTimeout(() => setSuccess(null), 2000);
  };

  const resetWeek = () => {
    setWeek(1);
  };

  const deleteHistory = async () => {
    if (deleteConfirm !== "DELETE") return;
    setLoading(true);
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("user_id", userId);
    if (sessions?.length) {
      for (const s of sessions) {
        await supabase.from("session_messages").delete().eq("session_id", s.id);
      }
      await supabase.from("sessions").delete().eq("user_id", userId);
    }
    await supabase.from("mistake_events").delete().eq("user_id", userId);
    setLoading(false);
    setDeleteConfirm("");
    setSuccess("Conversation history deleted.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
        Settings
      </h1>

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
      {success && <p className="mt-4 text-green-600 text-sm">{success}</p>}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
          Profile
        </h2>
        <div className="mt-3 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Accent / Region
            </label>
            <div className="flex flex-wrap gap-2">
              {accents.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAccent(a.value)}
                  className={`tap-target rounded-lg px-4 py-2 text-sm ${
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
              {goals.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setDailyGoal(g)}
                  className={`tap-target rounded-lg px-4 py-2 text-sm ${
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
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Week (1–4)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeek((w) => Math.max(1, w - 1))}
                className="tap-target rounded-lg border border-stone-300 dark:border-stone-600 w-10 h-10 font-bold"
              >
                −
              </button>
              <span className="text-lg font-semibold">{week}</span>
              <button
                type="button"
                onClick={() => setWeek((w) => Math.min(4, w + 1))}
                className="tap-target rounded-lg border border-stone-300 dark:border-stone-600 w-10 h-10 font-bold"
              >
                +
              </button>
              <button
                type="button"
                onClick={resetWeek}
                className="tap-target text-sm text-stone-500 ml-2"
              >
                Reset to week 1
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={saveProfile}
            disabled={loading}
            className="tap-target rounded-xl bg-primary-600 text-white font-semibold py-3 px-6"
          >
            Save
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
          Data & privacy
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Delete all your conversation history. Progress stats and vocab are kept.
        </p>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder='Type DELETE to confirm'
          className="mt-2 w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-3"
        />
        <button
          type="button"
          onClick={deleteHistory}
          disabled={loading || deleteConfirm !== "DELETE"}
          className="tap-target mt-2 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 py-3 px-6 disabled:opacity-50"
        >
          Delete conversation history
        </button>
      </section>

      <section className="mt-10">
        <PWAInstallInstructions />
      </section>

      <section className="mt-6">
        <button
          type="button"
          onClick={signOut}
          className="tap-target text-stone-500 dark:text-stone-400"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
