"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { createBrowserSupabase } from "@/lib/db/browser";
import { getUploadUrl, type ActionResult } from "@/app/admin-actions";

export const fieldCls = "w-full border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20";

export function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`grid gap-1 text-sm font-semibold text-brand-900 ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
    </label>
  );
}

/** Wraps a server action in a form, showing "saved" or the error. Opens as a disclosure panel. */
export function AdminForm({ action, summary, children, saveLabel, savedLabel, open: startOpen, resetOnSave = true }: {
  action: (s: ActionResult, fd: FormData) => Promise<ActionResult>;
  summary: React.ReactNode;
  children: React.ReactNode;
  saveLabel: string;
  savedLabel: string;
  open?: boolean;
  resetOnSave?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSave) ref.current?.reset();
  }, [state, resetOnSave]);
  return (
    <details open={startOpen} className="no-print group border border-dashed border-brand-700/30 bg-white open:border-solid open:border-ink/10 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-100/40">
        <span className="grid h-7 w-7 place-items-center bg-brand-900 text-white"><Plus size={16} className="transition-transform group-open:rotate-45" /></span> {summary}
      </summary>
      <form ref={ref} action={formAction} className="grid gap-4 border-t border-ink/10 p-4 sm:grid-cols-2">
        {children}
        <div className="flex items-center gap-3 sm:col-span-2">
          <button disabled={pending} className="inline-flex items-center gap-2 bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {pending && <Loader2 size={16} className="animate-spin" />} {saveLabel}
          </button>
          {state.ok && !pending && <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><Check size={16} /> {savedLabel}</span>}
          {state.error && !pending && <span role="alert" className="text-sm text-red-700">{state.error === "missing" ? "⚠ Required fields" : state.error}</span>}
        </div>
      </form>
    </details>
  );
}

/** PDF picker: uploads straight to private storage and puts the stored path in a hidden input. */
export function FileInput({ name, folder, label, current }: { name: string; folder: string; label: string; current?: string | null }) {
  const [path, setPath] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    try {
      const { path, token } = await getUploadUrl(folder, file.name);
      const { error } = await createBrowserSupabase().storage.from("files").uploadToSignedUrl(path, token, file, { contentType: file.type || "application/pdf" });
      if (error) throw error;
      setPath(path);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }
  return (
    <div className="grid gap-1 text-sm font-semibold text-brand-900">
      <span>{label}</span>
      <input type="hidden" name={name} value={path} />
      <label className={`${fieldCls} flex cursor-pointer items-center gap-2 font-normal`}>
        {status === "uploading" ? <Loader2 size={16} className="animate-spin" /> : status === "done" ? <Check size={16} className="text-emerald-700" /> : <Upload size={16} />}
        <span className="truncate text-ink/70">
          {status === "done" ? "✓" : status === "error" ? "Upload failed, try again" : current ? "Replace PDF…" : "Choose PDF…"}
        </span>
        <input type="file" accept="application/pdf,image/*" onChange={onChange} className="sr-only" />
      </label>
    </div>
  );
}

export function DeleteButton({ onDelete, label, confirmText }: { onDelete: () => Promise<void>; label: string; confirmText: string }) {
  const [pending, start] = useTransition();
  const [ask, setAsk] = useState(false);
  if (!ask)
    return (
      <button type="button" onClick={() => setAsk(true)} className="no-print inline-flex items-center gap-1 px-2 py-1.5 text-sm text-red-700 hover:bg-red-50">
        <Trash2 size={15} /> {label}
      </button>
    );
  return (
    <span className="no-print inline-flex items-center gap-2 bg-red-50 px-2 py-1 text-sm text-red-800">
      {confirmText}
      <button type="button" disabled={pending} onClick={() => start(onDelete)} className="font-bold underline">{pending ? "…" : label}</button>
      <button type="button" onClick={() => setAsk(false)} className="text-ink/60">✕</button>
    </span>
  );
}

/** Inline note: Enter saves, Shift+Enter adds a new line. */
export function NoteEditor({ initial, onSave, readOnly, labels }: {
  initial: string;
  onSave: (v: string) => Promise<ActionResult>;
  readOnly?: boolean;
  labels: { hint: string; saved: string; placeholder: string };
}) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  async function save() {
    setState("saving");
    const r = await onSave(value);
    setState(r.ok ? "saved" : "error");
  }
  return (
    <div className="grid gap-1.5">
      <textarea
        value={value}
        readOnly={readOnly}
        rows={4}
        placeholder={labels.placeholder}
        onChange={(e) => { setValue(e.target.value); setState("idle"); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !readOnly) { e.preventDefault(); save(); }
        }}
        className={`${fieldCls} leading-relaxed ${readOnly ? "bg-surface" : ""}`}
      />
      {!readOnly && (
        <p className="text-xs text-ink/50">
          {state === "saving" ? "…" : state === "saved" ? <span className="text-emerald-700">✓ {labels.saved}</span> : state === "error" ? <span className="text-red-700">Error</span> : labels.hint}
        </p>
      )}
    </div>
  );
}
