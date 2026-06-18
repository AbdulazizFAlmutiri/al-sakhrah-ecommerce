// components/sections/FeaturedCategories.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const CATEGORIES = [
  { name: "Dishwashing Liquid", slug: "dishwashing-liquid", swatch: "bg-olive-300" },
  { name: "Laundry Powder", slug: "laundry-powder", swatch: "bg-sand-400" },
  { name: "Laundry Liquid", slug: "laundry-liquid", swatch: "bg-brown-300" },
  { name: "Multi-Surface Cleaners", slug: "multi-surface-cleaners", swatch: "bg-olive-500" },
  { name: "Bleach & Disinfectants", slug: "bleach-disinfectants", swatch: "bg-brown-500" },
  { name: "Fabric Softener", slug: "fabric-softener", swatch: "bg-sand-600" },
];

export default function FeaturedCategories() {
  return (
    <section className="bg-sand-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-semibold tracking-wider text-olive-700">OUR CATALOG</span>
            <h2 className="text-3xl md:text-4xl font-display text-brown-900 mt-2">
              FEATURED CATEGORIES
            </h2>
          </div>
          <Link href="/products" className="inline-flex items-center gap-1.5 text-olive-700 font-semibold hover:text-olive-800">
            View all products <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group relative overflow-hidden shard-clip bg-white border border-sand-200 hover:shadow-warm-lg transition-shadow"
            >
              {/* Replace with next/image product photography */}
              <div className={`h-36 md:h-44 ${cat.swatch} opacity-90`} />
              <div className="p-4">
                <h3 className="font-display text-base md:text-lg text-brown-900">{cat.name.toUpperCase()}</h3>
                <span className="text-sm text-olive-700 font-medium inline-flex items-center gap-1 mt-1 group-hover:gap-2 transition-all">
                  View Products <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}