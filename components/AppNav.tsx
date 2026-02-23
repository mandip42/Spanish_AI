"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Home" },
  { href: "/app/practice", label: "Practice" },
  { href: "/app/progress", label: "Progress" },
  { href: "/app/household", label: "Household" },
  { href: "/app/settings", label: "Settings" },
];

export default function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 border-t border-stone-200 dark:border-stone-700 safe-area-pb flex justify-around items-center py-2 z-50">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`tap-target flex flex-col items-center justify-center px-3 py-2 text-xs font-medium ${
            pathname === href || (href !== "/app" && pathname.startsWith(href))
              ? "text-primary-600 dark:text-primary-400"
              : "text-stone-500 dark:text-stone-400"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
