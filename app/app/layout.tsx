import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";
import PWAInstall from "@/components/PWAInstall";

export default async function AppLayout({
  children,
}: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return (
    <div className="min-h-dvh app-shell flex flex-col bg-warm-app">
      <main className="flex-1 overflow-auto pb-20">{children}</main>
      <PWAInstall />
      <AppNav />
    </div>
  );
}
