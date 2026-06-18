// components/layout/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, User, ShoppingCart, ChevronDown } from "lucide-react";

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "Wholesale / B2B", href: "/wholesale" },
  { label: "Quality", href: "/quality" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Replace with: const cartCount = useCartStore((s) => s.items.length)
  const cartCount = 0;

  return (
    <header className="sticky top-0 z-50 bg-sand-50/95 backdrop-blur border-b border-sand-200">
      {/* Thin utility bar — desktop only */}
      <div className="hidden md:flex justify-end items-center gap-6 px-6 py-1.5 bg-brown-800 text-sand-100 text-xs">
        <a href="tel:+966000000000" className="hover:text-olive-300 transition-colors">
          +966 00 000 0000
        </a>
        <Link href="/wholesale" className="hover:text-olive-300 transition-colors">
          Wholesale Login
        </Link>
      </div>

      <div className="flex items-center justify-between px-4 md:px-8 py-3">
        {/* Logo placement — replace src with /public/logo/logo-full.svg */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo/logo-mark.svg" alt="Al-Sakhrah for Manufacturing" className="h-10 w-auto" />
          <span className="hidden sm:block font-display text-xl text-brown-800 leading-tight">
            AL-SAKHRAH
            <span className="block text-[10px] font-body normal-case tracking-normal text-brown-500">
              for Manufacturing
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brown-700 hover:text-olive-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3 md:gap-4">
          <button aria-label="Search" className="p-2 text-brown-700 hover:text-olive-600 transition-colors hidden sm:inline-flex">
            <Search size={20} />
          </button>
          <Link href="/account/login" aria-label="Account" className="p-2 text-brown-700 hover:text-olive-600 transition-colors hidden sm:inline-flex">
            <User size={20} />
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative p-2 text-brown-700 hover:text-olive-600 transition-colors">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-olive-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href="/request-quote"
            className="hidden sm:inline-flex items-center bg-olive-500 hover:bg-olive-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-warm transition-colors"
          >
            Request a Quote
          </Link>

          {/* Mobile toggle */}
          <button
            aria-label="Toggle menu"
            className="lg:hidden p-2 text-brown-800"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-sand-200 bg-sand-50 px-4 py-4 flex flex-col gap-3 animate-fade-up">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-medium text-brown-700 py-2 border-b border-sand-200"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/request-quote"
            className="mt-2 inline-flex justify-center items-center bg-olive-500 text-white font-semibold px-4 py-3 rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            Request a Quote
          </Link>
        </div>
      )}
    </header>
  );
}