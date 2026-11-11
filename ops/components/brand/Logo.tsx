/* eslint-disable @next/next/no-img-element */
export function Logo({ variant = "full", className = "" }: { variant?: "full" | "mark"; className?: string }) {
  const src = variant === "full" ? "/brand/logo.svg" : "/brand/logo-mark.svg";
  return <img src={src} alt="الصخرة للصناعة — Al-Sakhra for Industry" className={className} />;
}
