"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/db/browser";

/** Re-renders the current server page when any visible order changes, plus a 60s safety refresh. */
export function LiveRefresh({ label, tables = ["orders"] }: { label: string; tables?: string[] }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const supabase = createBrowserSupabase();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };
    const channel = supabase.channel(`live-${tables.join("-")}`);
    tables.forEach((table) => channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh));
    channel.subscribe();
    const interval = setInterval(() => router.refresh(), 60_000);
    return () => {
      clearInterval(interval);
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router, tables]);
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold text-ok-600">
      <span className="h-2 w-2 animate-pulse rounded-full bg-ok-600" />
      {label}
    </span>
  );
}
