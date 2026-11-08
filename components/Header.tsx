"use client";

import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { NAV, CONTACT } from "@/lib/content";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "bg-brand-950/95 backdrop-blur shadow-lg shadow-brand-950/20" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 md:h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/mark-white.png" alt="" className="h-9 w-auto md:h-10" />
          <span className="leading-tight text-white">
            <span dir="rtl" className="block font-ar text-sm font-bold">الصخرة للصناعة</span>
            <span className="block text-[11px] font-semibold tracking-[0.15em]">AL-SAKHRA FOR INDUSTRY</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-7" aria-label="Main">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-white/85 hover:text-white transition-colors">
              {l.en}
            </a>
          ))}
          <a
            href={CONTACT.phoneHref}
            className="inline-flex items-center gap-2 bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-100 transition-colors"
          >
            <Phone size={16} /> Call us
          </a>
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="lg:hidden p-2 text-white"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-white/10 bg-brand-950 px-4 pb-6 pt-2" aria-label="Mobile">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-white/10 py-3.5 text-white"
            >
              <span className="font-medium">{l.en}</span>
              <span dir="rtl" className="font-ar text-white/70">{l.ar}</span>
            </a>
          ))}
          <a
            href={CONTACT.phoneHref}
            className="mt-5 flex items-center justify-center gap-2 bg-white py-3 font-semibold text-brand-900"
          >
            <Phone size={18} /> {CONTACT.phoneDisplay}
          </a>
        </nav>
      )}
    </header>
  );
}
