// components/sections/Hero.tsx
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

const STATS = [
  { value: "50,000+", label: "Tons Annual Capacity" },
  { value: "15+", label: "Product Lines" },
  { value: "120+", label: "Wholesale Partners" },
  { value: "ISO 9001", label: "Certified Facility" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-sand-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
        {/* Copy */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-olive-700 bg-olive-100 px-3 py-1.5 rounded-full">
            <ShieldCheck size={14} /> AL-SAKHRAH FOR MANUFACTURING
          </span>

          <h1 className="mt-5 text-4xl md:text-6xl font-display text-brown-900 leading-[1.05]">
            ROCK-SOLID FORMULAS.
            <br />
            <span className="text-olive-600">INDUSTRIAL-SCALE SUPPLY.</span>
          </h1>

          <p className="mt-5 text-brown-700 text-base md:text-lg max-w-lg">
            From single cartons to full-pallet wholesale orders, our automated
            production lines and in-house quality labs deliver household
            detergents the Kingdom and GCC retailers trust — at the volume
            your business needs.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/request-quote"
              className="inline-flex items-center gap-2 bg-olive-500 hover:bg-olive-600 text-white font-semibold px-6 py-3.5 rounded-lg shadow-warm-lg transition-colors"
            >
              Request a Wholesale Quote <ArrowRight size={18} />
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 border border-brown-400 text-brown-800 hover:bg-sand-200 font-semibold px-6 py-3.5 rounded-lg transition-colors"
            >
              Browse Products
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-xl">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl md:text-3xl text-brown-900">{stat.value}</p>
                <p className="text-xs text-brown-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Faceted shard graphic — echoes the logomark, no stock photo needed */}
        <div className="relative h-[360px] md:h-[480px] hidden md:block">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[320px] h-[420px]">
              <div className="absolute top-0 left-16 w-32 h-32 bg-sand-400 shard-clip-tr rotate-6" />
              <div className="absolute top-8 left-0 w-28 h-28 bg-olive-400 shard-clip rotate-[-8deg]" />
              <div className="absolute top-32 left-24 w-36 h-36 bg-brown-500 shard-clip rotate-3" />
              <div className="absolute top-56 left-4 w-32 h-32 bg-brown-700 shard-clip-tr rotate-[-4deg]" />
              <div className="absolute top-72 left-32 w-28 h-28 bg-olive-600 shard-clip rotate-12" />
              <div className="absolute bottom-0 left-12 w-40 h-24 bg-brown-400 shard-clip rotate-[-6deg]" />
            </div>
          </div>
        </div>
      </div>

      {/* Angular divider into next section — replaces a generic wave/blob */}
      <svg viewBox="0 0 1440 40" className="block w-full text-sand-50" preserveAspectRatio="none">
        <polygon points="0,40 1440,40 1440,0 1100,30 720,5 340,32 0,10" fill="currentColor" />
      </svg>
    </section>
  );
}