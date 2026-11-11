import type { InputHTMLAttributes } from "react";

export function Field({ label, name, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-ink-700">{label}</span>
      <input
        id={name}
        name={name}
        {...props}
        className="h-11 rounded-xl border border-mist-200 bg-white px-3 text-base outline-none focus:border-royal-600 focus:ring-2 focus:ring-royal-100"
      />
    </label>
  );
}
