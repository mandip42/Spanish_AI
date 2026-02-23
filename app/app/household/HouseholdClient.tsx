"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface HouseholdClientProps {
  userId: string;
  household: { id: string; name: string; invite_code: string; owner_id: string } | null;
  members: { user_id: string; display_name: string | null }[];
  memberStats: { user_id: string; minutes: number; streak_count: number }[];
  isOwner: boolean;
}

export default function HouseholdClient({
  userId,
  household,
  members,
  memberStats,
  isOwner,
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
    <div className="px-5 py-8 max-w-lg mx-auto">
      <h1 className="heading-display text-2xl text-stone-900 dark:text-white">
        Household
      </h1>
      <p className="mt-2 text-stone-500 dark:text-stone-400 text-sm">
        Create or join a household to see each other&apos;s progress.
      </p>

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

      {!household ? (
        <div className="mt-8 space-y-6">
          <div className="card p-5">
            <button
              type="button"
              onClick={createHousehold}
              disabled={loading}
              className="btn-primary w-full py-3.5 disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create household"}
            </button>
            {inviteCode && (
              <p className="mt-4 text-center">
                Invite code:{" "}
                <strong className="text-xl tracking-[0.25em] text-primary-600 dark:text-primary-400 font-display">
                  {inviteCode}
                </strong>
              </p>
            )}
          </div>
          <div className="card p-5">
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Join with code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="input-field flex-1 uppercase"
              />
              <button
                type="button"
                onClick={joinHousehold}
                disabled={loading || joinCode.length < 4}
                className="btn-secondary shrink-0 py-3 px-5 disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            Invite code:{" "}
            <strong className="tracking-widest text-primary-600 dark:text-primary-400 font-display">
              {household.invite_code}
            </strong>
          </p>
          <h2 className="mt-6 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
            Household dashboard
          </h2>
          <ul className="space-y-3">
            {members.map((m) => {
              const stat = getStat(m.user_id);
              return (
                <li key={m.user_id} className="card p-5">
                  <p className="font-display font-semibold text-stone-900 dark:text-white">
                    {m.display_name || "Member"}
                  </p>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
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
            className="mt-6 tap-target text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
          >
            Leave household
          </button>
        </div>
      )}
    </div>
  );
}
