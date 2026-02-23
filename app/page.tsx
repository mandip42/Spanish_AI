import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-dvh app-shell flex flex-col bg-gradient-to-b from-primary-50 to-background dark:from-primary-950 dark:to-background">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-4xl font-bold text-primary-700 dark:text-primary-300 tracking-tight">
          Spanish AI
        </h1>
        <p className="mt-3 text-lg text-stone-600 dark:text-stone-400 max-w-sm">
          Conversational fluency in 4 weeks. AI tutor, two profiles, household dashboard.
        </p>
        <div className="mt-10 flex flex-col gap-4 w-full max-w-xs">
          <Link
            href="/auth?tab=signup"
            className="tap-target flex items-center justify-center rounded-xl bg-primary-600 text-white font-semibold py-3 px-6 shadow-lg hover:bg-primary-700 active:scale-[0.98] transition"
          >
            Get started
          </Link>
          <Link
            href="/auth?tab=login"
            className="tap-target flex items-center justify-center rounded-xl border-2 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 font-semibold py-3 px-6"
          >
            Log in
          </Link>
        </div>
        <p className="mt-8 text-sm text-stone-500 dark:text-stone-500">
          No prompts to paste. One tap → daily lesson + roleplay.
        </p>
      </div>
      <footer className="py-4 text-center text-xs text-stone-400">
        Speaking-first · Corrections · 4-week program
      </footer>
    </main>
  );
}
