import { setLocaleAction } from "@/app/actions/locale";
import { LOCALES, type Locale } from "@/lib/i18n";

export function LocaleSwitcher({ current, labels }: { current: Locale; labels: Record<Locale, string> }) {
  return (
    <form action={setLocaleAction} className="flex gap-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="submit"
          name="locale"
          value={l}
          aria-pressed={l === current}
          className={`px-3 py-1 text-sm ${l === current ? "bg-royal-600 text-white" : "text-navy-700 hover:bg-royal-50"}`}
        >
          {labels[l]}
        </button>
      ))}
    </form>
  );
}
