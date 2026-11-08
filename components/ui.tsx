import {
  Award, Eye, Shield, Factory, BadgeCheck, Building2, Landmark, Droplet, SprayCan, Brush,
  Toilet, GlassWater, HandHeart, Hospital, BedDouble, Utensils, GraduationCap, Wrench,
  Gauge, Clock, Banknote, FlaskConical, type LucideIcon,
} from "lucide-react";

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

/** Arabic text block — right-to-left, Arabic font. */
export function Ar({ as: Tag = "p", className = "", children }: {
  as?: React.ElementType; className?: string; children: React.ReactNode;
}) {
  return (
    <Tag dir="rtl" lang="ar" className={`font-ar text-right ${className}`}>
      {children}
    </Tag>
  );
}

/** Tinted background photo (grayscale + brand-blue wash). Decorative. */
export function TintedPhoto({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div className={`photo-tint ${className}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" />
    </div>
  );
}

/** Section header: English label on the left, Arabic title on the right — as in the profile. */
export function SectionHeading({ en, ar, sub, subAr, light = false }: {
  en: string; ar: string; sub?: string; subAr?: string; light?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-end mb-10 md:mb-14">
      <div>
        <h2 className={`text-sm font-bold tracking-[0.25em] uppercase ${light ? "text-brand-200" : "text-brand-700"}`}>
          {en}
        </h2>
        {sub && <p className={`mt-3 max-w-md text-[15px] leading-relaxed ${light ? "text-brand-100/80" : "text-ink/70"}`}>{sub}</p>}
        <span className={`mt-5 block h-[3px] w-12 ${light ? "bg-white" : "bg-brand-900"}`} />
      </div>
      <div>
        <Ar as="h3" className={`text-3xl md:text-4xl font-bold ${light ? "text-white" : "text-brand-900"}`}>{ar}</Ar>
        {subAr && <Ar className={`mt-3 leading-loose ${light ? "text-brand-100/90" : "text-ink/75"}`}>{subAr}</Ar>}
      </div>
    </div>
  );
}

export function Container({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
