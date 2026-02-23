"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Home", icon: "🏠" },
  { href: "/app/practice", label: "Practice", icon: "💬" },
  { href: "/app/progress", label: "Progress", icon: "📊" },
  { href: "/app/household", label: "Household", icon: "👥" },
  { href: "/app/settings", label: "Settings", icon: "⚙️" },
];

export default function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-700/80 safe-area-pb flex justify-around items-center py-2 z-50 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.08)]">
      {links.map(({ href, label, icon }) => {
        const isActive = pathname === href || (href !== "/app" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`tap-target flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              isActive
                ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
            }`}
          >
            <span className="text-base leading-none" aria-hidden>{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
