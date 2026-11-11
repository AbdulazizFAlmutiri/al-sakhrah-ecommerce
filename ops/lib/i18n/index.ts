import { ar } from "./ar";
import { en, type MessageKey } from "./en";
import { ur } from "./ur";

export type { MessageKey };
export const LOCALES = ["ar", "en", "ur"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";
export type Dictionary = Record<MessageKey, string>;
export type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

const DICTS: Record<Locale, Dictionary> = { ar, en, ur };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function dirFor(l: Locale): "rtl" | "ltr" {
  return l === "en" ? "ltr" : "rtl";
}

export function getDictionary(l: Locale): Dictionary {
  return DICTS[l];
}

export function translate(dict: Dictionary, key: MessageKey, vars?: Record<string, string | number>): string {
  const raw = dict[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export function makeT(l: Locale): T {
  const d = getDictionary(l);
  return (key, vars) => translate(d, key, vars);
}
