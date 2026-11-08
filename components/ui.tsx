import {
  Award, Eye, Shield, Factory, BadgeCheck, Building2, Landmark, Droplet, SprayCan, Brush,
  Toilet, GlassWater, HandHeart, Hospital, BedDouble, Utensils, GraduationCap, Wrench,
  Gauge, Clock, Banknote, FlaskConical, type LucideIcon,
} from "lucide-react";
import type { L } from "@/lib/content";

const ICONS: Record<string, LucideIcon> = {
  award: Award, eye: Eye, shield: Shield, factory: Factory, badge: BadgeCheck,
  building: Building2, landmark: Landmark, droplet: Droplet, spray: SprayCan, brush: Brush,
  toilet: Toilet, dish: GlassWater, hand: HandHeart, hospital: Hospital, bed: BedDouble,
  utensils: Utensils, school: GraduationCap, wrench: Wrench, gauge: Gauge, clock: Clock,
  banknote: Banknote, flask: FlaskConical,
};

export function Icon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const C = ICONS[name] ?? Award;
  return <C size={size} strokeWidth={1.75} className={className} aria-hidden />;
}

/**
 * Bilingual text. Both languages are in the page; CSS shows the one matching
 * <html data-lang>, so the language switch works without reloading.
 */
export function T({ t }: { t: L }) {
  return (
    <>
      <span className="t-ar" lang="ar">{t.ar}</span>
      <span className="t-en" lang="en">{t.en}</span>
    </>
  );
}

/** Grayscale photo washed with brand blue. Decorative. */
export function TintedPhoto({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div className={`photo-tint ${className}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" />
    </div>
  );
}

export function Container({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function Eyebrow({ t, light = false }: { t: L; light?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] ${light ? "text-brand-200" : "text-brand-700"}`}>
      <span className={`h-[2px] w-8 ${light ? "bg-brand-200" : "bg-brand-700"}`} />
      <T t={t} />
    </p>
  );
}
