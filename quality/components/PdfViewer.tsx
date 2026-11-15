"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Eye, Printer, X } from "lucide-react";

type Open = (url: string, title: string) => void;
const Ctx = createContext<Open>(() => {});

/** Full-screen PDF viewer with print. Files stream from our own /api routes. */
export function PdfViewerProvider({ children, labels }: { children: React.ReactNode; labels: { print: string; close: string } }) {
  const [doc, setDoc] = useState<{ url: string; title: string } | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDoc(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc]);
  return (
    <Ctx.Provider value={(url, title) => setDoc({ url, title })}>
      {children}
      {doc && (
        <div role="dialog" aria-modal="true" aria-label={doc.title} className="fixed inset-0 z-50 flex flex-col bg-black/85">
          <div className="flex items-center gap-3 bg-brand-950 px-4 py-3 text-white shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mark-white.png" alt="" className="h-7 w-auto" />
            <p className="min-w-0 flex-1 truncate font-semibold">{doc.title}</p>
            <button onClick={() => frame.current?.contentWindow?.print()} className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
              <Printer size={16} /> {labels.print}
            </button>
            <button onClick={() => setDoc(null)} aria-label={labels.close} className="p-1.5 hover:bg-white/10"><X size={22} /></button>
          </div>
          <iframe ref={frame} src={doc.url} title={doc.title} className="w-full flex-1 bg-white" />
        </div>
      )}
    </Ctx.Provider>
  );
}

export function ViewButton({ url, title, label, disabled }: { url: string | null; title: string; label: string; disabled?: boolean }) {
  const open = useContext(Ctx);
  return (
    <button
      type="button"
      disabled={disabled || !url}
      onClick={() => url && open(url, title)}
      className="inline-flex shrink-0 items-center gap-1.5 bg-brand-100 px-3 py-1.5 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-900 hover:text-white disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink/40 disabled:hover:bg-surface"
    >
      <Eye size={15} /> {label}
    </button>
  );
}
