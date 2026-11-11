const RIYADH = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" });

export function riyadhToday(now: Date = new Date()): string {
  return RIYADH.format(now);
}

export function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function ageParts(fromIso: string, now: Date = new Date()): { h: number; m: number } {
  const mins = Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / 60000));
  return { h: Math.floor(mins / 60), m: mins % 60 };
}

/** "08:42" in Riyadh time with Latin digits (matches PO numbers on screen). */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Riyadh" }).format(new Date(iso));
}
