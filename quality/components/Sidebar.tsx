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

export function Sidebar({ items, user, lang, labels }: {
  items: NavItem[];
  user: { name: string; role: string };
  lang: "ar" | "en";
  labels: { appName: string; company: string; logout: string; switchLang: string };
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/dashboard" ? path === href : path === href || path.startsWith(href + "/"));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Main">
      {items.map((it) => {
        const I = ICONS[it.key];
        const on = isActive(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={() => setOpen(false)}
            aria-current={on ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${on ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
          >
            <I size={18} className="shrink-0" />
            <span className="flex-1">{it.label}</span>
            {it.badge && <span className="bg-white/15 px-1.5 text-xs tabular-nums">{it.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-4 text-sm">
      <p className="font-semibold text-white">{user.name}</p>
      <p className="text-white/60">{user.role}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-white/80 hover:text-white">
          <Languages size={16} />
          <LangToggle lang={lang} label={labels.switchLang} />
        </span>
        <form action={logoutAction}>
          <button className="inline-flex items-center gap-1.5 text-red-300 hover:text-red-200">
            <LogOut size={16} /> {labels.logout}
          </button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mark-white.png" alt="" className="h-9 w-auto" />
      <span className="leading-tight text-white">
        <span className="block text-sm font-bold">{labels.appName}</span>
        <span className="block text-xs text-white/60">{labels.company}</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Phone top bar */}
      <div className="no-print sticky top-0 z-30 flex h-14 items-center justify-between bg-brand-950 px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark-white.png" alt="" className="h-7 w-auto" />
          <span className="text-sm font-bold">{labels.appName}</span>
        </Link>
        <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="p-2 text-white">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {open && (
        <div className="no-print fixed inset-0 top-14 z-30 flex flex-col bg-brand-950 lg:hidden">
          {nav}
          {footer}
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 start-0 z-20 hidden w-64 flex-col bg-brand-950 lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>
    </>
  );
}
