import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-dvh app-shell flex flex-col bg-mesh-warm dark:bg-gradient-to-b dark:from-primary-950 dark:via-stone-900 dark:to-stone-950">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-14 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-30 dark:opacity-10 pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-block rounded-full bg-primary-100 dark:bg-primary-900/50 px-4 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300 mb-6">
            4-week fluency
          </span>
          <h1 className="heading-display text-4xl sm:text-5xl text-stone-900 dark:text-white">
            Spanish AI
          </h1>
          <p className="mt-4 text-lg text-stone-600 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
            Conversational fluency with an AI tutor. Two profiles, household dashboard, no prompts to paste.
          </p>
          <div className="mt-10 flex flex-col gap-4 w-full max-w-xs mx-auto">
            <Link href="/auth?tab=signup" className="btn-primary text-base py-4">
              Get started
            </Link>
            <Link href="/auth?tab=login" className="btn-secondary text-base py-4">
              Log in
            </Link>
          </div>
          <p className="mt-8 text-sm text-stone-500 dark:text-stone-500">
            One tap → daily lesson + roleplay
          </p>
        </div>
      </div>
      <footer className="relative py-5 text-center text-xs text-stone-400 dark:text-stone-500 border-t border-stone-200/60 dark:border-stone-800">
        Speaking-first · Gentle corrections · Structured program
      </footer>
    </main>
  );
}
