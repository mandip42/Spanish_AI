import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Spanish AI — 4-Week Fluency",
  description:
    "AI-driven conversational Spanish practice. Two profiles, household dashboard, 4-week program.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Spanish AI" },
};

export const viewport: Viewport = {
  themeColor: "#db5b13",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={font.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
