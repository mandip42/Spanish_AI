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
    <div className="px-5 py-8 max-w-lg mx-auto">
      <h1 className="heading-display text-2xl text-stone-900 dark:text-white">
        Settings
      </h1>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-xl bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-300 px-4 py-3 text-sm">
          {success}
        </div>
      )}

      <section className="mt-8 card p-5">
        <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
          Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
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
              {goals.map((g) => (
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
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Week (1–4)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeek((w) => Math.max(1, w - 1))}
                className="tap-target rounded-xl border-2 border-stone-300 dark:border-stone-600 w-11 h-11 font-bold text-lg hover:border-primary-400 dark:hover:border-primary-600 transition"
              >
                −
              </button>
              <span className="text-xl font-display font-semibold w-8 text-center">{week}</span>
              <button
                type="button"
                onClick={() => setWeek((w) => Math.min(4, w + 1))}
                className="tap-target rounded-xl border-2 border-stone-300 dark:border-stone-600 w-11 h-11 font-bold text-lg hover:border-primary-400 dark:hover:border-primary-600 transition"
              >
                +
              </button>
              <button
                type="button"
                onClick={resetWeek}
                className="tap-target text-sm text-stone-500 dark:text-stone-400 ml-2 hover:underline"
              >
                Reset to week 1
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={saveProfile}
            disabled={loading}
            className="btn-primary mt-2 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </section>

      <section className="mt-8 card p-5">
        <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
          Data & privacy
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
          Delete all your conversation history. Progress stats and vocab are kept.
        </p>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="input-field"
        />
        <button
          type="button"
          onClick={deleteHistory}
          disabled={loading || deleteConfirm !== "DELETE"}
          className="tap-target mt-3 rounded-xl border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 py-3 px-6 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition"
        >
          Delete conversation history
        </button>
      </section>

      <section className="mt-8">
        <PWAInstallInstructions />
      </section>

      <section className="mt-8">
        <button
          type="button"
          onClick={signOut}
          className="tap-target text-stone-500 dark:text-stone-400 text-sm font-medium hover:underline"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
