"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLangAction } from "@/app/actions";

export function LangToggle({ lang, label, className = "" }: { lang: "ar" | "en"; label: string; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await setLangAction(lang === "ar" ? "en" : "ar"); router.refresh(); })}
      className={className}
    >
      {label}
    </button>
  );
}
