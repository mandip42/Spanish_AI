"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function AuthForm() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "login";
  const [activeTab, setActiveTab] = useState<"login" | "signup">(
    tab === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setActiveTab(tab === "signup" ? "signup" : "login");
  }, [tab]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split("@")[0] } },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Check your email to confirm your account." });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    window.location.href = "/app";
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { data: { display_name: displayName || email.split("@")[0] } },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMagicLinkSent(true);
    setMessage({ type: "success", text: "Check your email for the login link." });
  };

  return (
    <main className="min-h-dvh app-shell flex flex-col bg-background px-6 py-10">
      <Link href="/" className="text-primary-600 dark:text-primary-400 text-sm mb-6">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
        Welcome
      </h1>
      <>
          <div className="flex gap-2 mt-6 border-b border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`pb-3 px-2 font-medium border-b-2 -mb-px ${
                activeTab === "login"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-stone-500"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={`pb-3 px-2 font-medium border-b-2 -mb-px ${
                activeTab === "signup"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-stone-500"
              }`}
            >
              Sign up
            </button>
          </div>

          <form
            onSubmit={activeTab === "login" ? handleLogin : handleSignUp}
            className="mt-8 space-y-4"
          >
            {activeTab === "signup" && (
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-3"
                  placeholder="Display name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-3"
                placeholder="you@example.com"
              />
            </div>
            {activeTab === "login" && !magicLinkSent && (
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-3"
                  placeholder="Password"
                />
              </div>
            )}
            {activeTab === "signup" && (
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-3"
                  placeholder="Password"
                />
              </div>
            )}
            {message && (
              <p className={message.type === "error" ? "text-red-600" : "text-green-600 text-sm"}>
                {message.text}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="tap-target w-full rounded-xl bg-primary-600 text-white font-semibold py-3"
              >
                {loading ? "Please wait…" : activeTab === "signup" ? "Sign up" : "Log in"}
              </button>
              {activeTab === "login" && !magicLinkSent && (
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={loading}
                  className="tap-target w-full rounded-xl border border-stone-300 dark:border-stone-600 py-3 text-stone-700 dark:text-stone-300"
                >
                  Send magic link
                </button>
              )}
            </div>
          </form>
      </>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh app-shell flex flex-col bg-background px-6 py-10">
        <Link href="/" className="text-primary-600 dark:text-primary-400 text-sm mb-6">← Back</Link>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Welcome</h1>
        <p className="mt-4 text-stone-500">Loading…</p>
      </main>
    }>
      <AuthForm />
    </Suspense>
  );
}
