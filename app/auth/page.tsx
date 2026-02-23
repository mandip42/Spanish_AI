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
    <main className="min-h-dvh app-shell flex flex-col bg-warm-app px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 text-sm font-medium mb-8 hover:underline"
      >
        ← Back
      </Link>
      <div className="card max-w-md mx-auto w-full">
        <h1 className="heading-display text-2xl text-stone-900 dark:text-white">
          Welcome
        </h1>
        <p className="mt-1 text-stone-500 dark:text-stone-400 text-sm">
          Sign in or create an account to start practicing.
        </p>
        <div className="flex gap-1 mt-6 p-1 rounded-xl bg-stone-100 dark:bg-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
              activeTab === "login"
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-soft"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
              activeTab === "signup"
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-soft"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Sign up
          </button>
        </div>
        <form
          onSubmit={activeTab === "login" ? handleLogin : handleSignUp}
          className="mt-6 space-y-4"
        >
          {activeTab === "signup" && (
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Name (optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
                placeholder="Display name"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>
          {activeTab === "login" && !magicLinkSent && (
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Password"
              />
            </div>
          )}
          {activeTab === "signup" && (
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Password (min 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Password"
              />
            </div>
          )}
          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                message.type === "error"
                  ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
                  : "bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-300"
              }`}
            >
              {message.text}
            </div>
          )}
          <div className="flex flex-col gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? "Please wait…" : activeTab === "signup" ? "Sign up" : "Log in"}
            </button>
            {activeTab === "login" && !magicLinkSent && (
              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
                className="btn-secondary w-full py-3.5"
              >
                Send magic link
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh app-shell flex flex-col bg-warm-app px-6 py-10">
          <div className="h-5 w-16 rounded bg-stone-200 dark:bg-stone-700 animate-pulse" />
          <h1 className="heading-display text-2xl mt-8">Welcome</h1>
          <p className="mt-4 text-stone-500">Loading…</p>
        </main>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
