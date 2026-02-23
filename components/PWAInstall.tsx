"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as unknown as { standalone?: boolean }).standalone) {
      setInstalled(true);
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setShowBanner(false);
  };

  if (installed || !showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 rounded-2xl bg-stone-900 dark:bg-stone-800 text-white p-4 shadow-card border border-stone-700/80">
      <p className="text-sm font-semibold">Install Spanish AI on your phone</p>
      <p className="text-xs text-stone-400 mt-1">
        Add to home screen for quick access. AI features need internet.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="tap-target rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold hover:bg-primary-600 transition"
        >
          Install
        </button>
        <button
          type="button"
          onClick={() => setShowBanner(false)}
          className="tap-target rounded-xl bg-stone-600 px-4 py-2.5 text-sm font-medium hover:bg-stone-500 transition"
        >
          Later
        </button>
      </div>
    </div>
  );
}

export function PWAInstallInstructions() {
  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-stone-900 dark:text-white">
        Install on Android
      </h3>
      <ol className="mt-3 list-decimal list-inside text-sm text-stone-600 dark:text-stone-400 space-y-1.5">
        <li>Open this site in Chrome.</li>
        <li>Tap the menu (⋮) → &quot;Add to Home screen&quot; or &quot;Install app&quot;.</li>
        <li>Confirm. The icon will appear on your home screen.</li>
      </ol>
      <p className="mt-3 text-xs text-stone-500 dark:text-stone-500">
        Full AI practice requires an internet connection.
      </p>
    </div>
  );
}
