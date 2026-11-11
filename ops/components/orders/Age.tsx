import { ageParts } from "@/lib/time";
import type { T } from "@/lib/i18n";

export function Age({ since, t, now }: { since: string; t: T; now: Date }) {
  const { h, m } = ageParts(since, now);
  const text = h === 0 && m === 0 ? t("time.just_now") : h === 0 ? t("time.m", { m }) : t("time.hm", { h, m });
  return <span className="text-xs text-ink-500">{text}</span>;
}
