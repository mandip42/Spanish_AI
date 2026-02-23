"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface HouseholdClientProps {
  userId: string;
  household: { id: string; name: string; invite_code: string; owner_id: string } | null;
  members: { user_id: string; display_name: string | null }[];
  memberStats: { user_id: string; minutes: number; streak_count: number }[];
  isOwner: boolean;
  generateInviteCode: () => string;
}

export default function HouseholdClient({
  userId,
  household,
  members,
  memberStats,
  isOwner,
  generateInviteCode,
}: HouseholdClientProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  const createHousehold = async () => {
    setLoading(true);
    setError(null);
    const code = generateInviteCode();
    const { data: newHousehold, error: createErr } = await supabase
      .from("households")
      .insert({ name: "Mi hogar", invite_code: code, owner_id: userId })
      .select("id")
      .single();
    if (createErr) {
      setError(createErr.message);
      setLoading(false);
      return;
    }
    if (newHousehold) {
      await supabase.from("household_members").insert({
        household_id: newHousehold.id,
        user_id: userId,
        role: "owner",
      });
      setInviteCode(code);
      setSuccess("Household created. Share the code to invite.");
      setTimeout(() => window.location.reload(), 1500);
    }
    setLoading(false);
  };

  const joinHousehold = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError(null);
    const { data: h } = await supabase
      .from("households")
      .select("id")
      .eq("invite_code", joinCode.trim().toUpperCase())
      .single();
    if (!h) {
      setError("Invalid invite code.");
      setLoading(false);
      return;
    }
    const { error: insertErr } = await supabase.from("household_members").insert({
      household_id: h.id,
      user_id: userId,
      role: "member",
    });
    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }
    setSuccess("Joined household!");
    setJoinCode("");
    window.location.reload();
  };

  const leaveHousehold = async () => {
    if (!household || !confirm("Leave this household?")) return;
    setLoading(true);
    await supabase
      .from("household_members")
      .delete()
      .eq("household_id", household.id)
      .eq("user_id", userId);
    setLoading(false);
    window.location.reload();
  };

  const getStat = (uid: string) =>
    memberStats.find((s) => s.user_id === uid) || {
      minutes: 0,
      streak_count: 0,
    };

  return (
    <div className="px-6 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
        Household
      </h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        Create or join a household to see each other&apos;s progress.
      </p>

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
      {success && <p className="mt-4 text-green-600 text-sm">{success}</p>}

      {!household ? (
        <div className="mt-8 space-y-6">
          <div>
            <button
              type="button"
              onClick={createHousehold}
              disabled={loading}
              className="tap-target w-full rounded-xl bg-primary-600 text-white font-semibold py-3"
            >
              {loading ? "Creating…" : "Create household"}
            </button>
            {inviteCode && (
              <p className="mt-4 text-center">
                Invite code: <strong className="text-lg tracking-widest">{inviteCode}</strong>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Join with code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="flex-1 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-3 uppercase"
              />
              <button
                type="button"
                onClick={joinHousehold}
                disabled={loading || joinCode.length < 4}
                className="tap-target rounded-lg bg-stone-200 dark:bg-stone-700 px-4 py-3 font-medium"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <p className="text-stone-600 dark:text-stone-400">
            Invite code: <strong className="tracking-widest">{household.invite_code}</strong>
          </p>
          <h2 className="mt-6 text-lg font-semibold text-stone-900 dark:text-stone-100">
            Household dashboard
          </h2>
          <ul className="mt-3 space-y-4">
            {members.map((m) => {
              const stat = getStat(m.user_id);
              return (
                <li
                  key={m.user_id}
                  className="rounded-xl border border-stone-200 dark:border-stone-700 p-4"
                >
                  <p className="font-medium text-stone-900 dark:text-stone-100">
                    {m.display_name || "Member"}
                  </p>
                  <p className="text-sm text-stone-500 mt-1">
                    Today: {stat.minutes} min · Streak: {stat.streak_count} day(s)
                  </p>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={leaveHousehold}
            disabled={loading}
            className="mt-6 tap-target text-sm text-red-600 dark:text-red-400"
          >
            Leave household
          </button>
        </div>
      )}
    </div>
  );
}
