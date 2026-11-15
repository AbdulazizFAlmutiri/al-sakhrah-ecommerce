"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Printer, Search } from "lucide-react";

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 bg-white px-3 py-2 text-sm font-semibold text-brand-900 ring-1 ring-ink/10 hover:bg-brand-100">
      <Printer size={16} /> {label}
    </button>
  );
}

/** Search box that keeps the query in the address (?q=…), so results can be shared and printed. */
export function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  useEffect(() => {
    const id = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q); else next.delete("q");
      if (next.toString() !== params.toString()) router.replace(`${path}?${next.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
  }, [q, params, path, router]);
  return (
    <label className="no-print relative block w-full sm:max-w-sm">
      <Search size={17} className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-ink/40" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-ink/15 bg-white py-2.5 ps-10 pe-3 text-sm outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20"
      />
    </label>
  );
}
