"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Stamp, ListTree, FileText, FileCheck2, Share2, ClipboardCheck, Gauge, Handshake, Users, History, LogOut, Menu, X, Languages,
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { LangToggle } from "./LangToggle";

const ICONS = { home: LayoutDashboard, general: Stamp, sopIndex: ListTree, documents: FileText, docControl: FileCheck2, distribution: Share2, clauses: ClipboardCheck, calibration: Gauge, contracts: Handshake, users: Users, audit: History };
export type NavItem = { key: keyof typeof ICONS; href: string; label: string; badge?: string };
export type NavGroup = { label?: string; items: NavItem[] };

export function Sidebar({ groups, user, lang, labels }: {
  groups: NavGroup[];
  user: { name: string; role: string };
  lang: "ar" | "en";
  labels: { appName: string; company: string; logout: string; switchLang: string };
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/dashboard" ? path === href : path === href || path.startsWith(href + "/"));

  const nav = (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-5" aria-label="Main">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-200/60">{g.label}</p>}
          <div className="grid gap-0.5">
            {g.items.map((it) => {
              const I = ICONS[it.key];
              const on = isActive(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={on ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${on ? "bg-white text-brand-900 shadow-lg shadow-black/20" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
                >
                  <I size={18} strokeWidth={1.75} className={`shrink-0 ${on ? "text-brand-700" : ""}`} />
                  <span className="flex-1">{it.label}</span>
                  {it.badge && <span className={`px-1.5 text-xs font-semibold tabular-nums ${on ? "bg-brand-100 text-brand-900" : "bg-white/15"}`}>{it.badge}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const initial = user.name.trim().charAt(0) || "؟";
  const footer = (
    <div className="border-t border-white/10 bg-black/10 p-4 text-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center bg-white/10 text-base font-bold text-white">{initial}</span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-brand-200/80">{user.role}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <span className="inline-flex items-center justify-center gap-1.5 bg-white/5 py-2 text-white/85 transition-colors hover:bg-white/10 hover:text-white">
          <Languages size={15} />
          <LangToggle lang={lang} label={labels.switchLang} />
        </span>
        <form action={logoutAction}>
          <button className="inline-flex w-full items-center justify-center gap-1.5 bg-white/5 py-2 text-red-200 transition-colors hover:bg-red-500/20 hover:text-white">
            <LogOut size={15} /> {labels.logout}
          </button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mark-white.png" alt="" className="h-10 w-auto" />
      <span className="leading-tight text-white">
        <span className="block text-base font-bold">{labels.appName}</span>
        <span className="block text-[10px] font-semibold tracking-[0.15em] text-brand-200" dir="ltr">AL-SAKHRA FOR INDUSTRY</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Phone top bar */}
      <div className="no-print sticky top-0 z-30 flex h-16 items-center justify-between bg-brand-950/95 px-4 shadow-lg shadow-brand-950/20 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark-white.png" alt="" className="h-8 w-auto" />
          <span className="leading-tight">
            <span className="block text-sm font-bold">{labels.appName}</span>
            <span className="block text-[9px] font-semibold tracking-[0.15em] text-brand-200" dir="ltr">AL-SAKHRA FOR INDUSTRY</span>
          </span>
        </Link>
        <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="p-2 text-white">
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
      {open && (
        <div className="no-print fixed inset-0 top-16 z-30 flex flex-col bg-brand-950 lg:hidden">
          {nav}
          {footer}
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 start-0 z-20 hidden w-72 flex-col overflow-hidden bg-brand-950 lg:flex">
        <div className="pattern-lines pointer-events-none absolute inset-0" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mark-white.png" alt="" aria-hidden className="pointer-events-none absolute -bottom-10 -start-16 w-64 max-w-none opacity-[0.04]" />
        <div className="relative flex min-h-0 flex-1 flex-col">
          {brand}
          {nav}
          {footer}
        </div>
      </aside>
    </>
  );
}
