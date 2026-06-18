// components/sections/WhyChooseUs.tsx
import Link from "next/link";
import { Factory, ShieldCheck, Truck, PackageCheck, Award, Headset } from "lucide-react";

const BENEFITS = [
  { icon: PackageCheck, text: "Tiered wholesale pricing with flexible MOQs" },
  { icon: Factory, text: "Private-label & OEM production lines" },
  { icon: Headset, text: "Dedicated account manager for every partner" },
  { icon: Truck, text: "Nationwide and GCC-wide logistics network" },
  { icon: ShieldCheck, text: "Full SDS documentation on every formula" },
  { icon: Award, text: "Fast RFQ turnaround — quotes within 24 hours" },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-brown-900 text-sand-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-14 items-center">
        {/* Manufacturing power copy */}
        <div>
          <span className="text-xs font-semibold tracking-wider text-olive-300">
            BUILT FOR WHOLESALE
          </span>
          <h2 className="text-3xl md:text-4xl font-display mt-3 leading-tight">
            MANUFACTURING POWER YOUR SUPPLY CHAIN CAN RELY ON
          </h2>
          <p className="mt-5 text-sand-200 max-w-md">
            Our facility runs automated fill lines and an in-house QC lab on
            every batch, so retailers and distributors get consistent
            formulas at scale — backed by certifications that hold up at
            customs and on the shelf.
          </p>
          <Link
            href="/wholesale"
            className="mt-7 inline-flex items-center gap-2 bg-olive-500 hover:bg-olive-400 text-brown-900 font-semibold px-6 py-3.5 rounded-lg transition-colors"
          >
            Become a Wholesale Partner
          </Link>
        </div>

        {/* Benefit checklist */}
        <div className="grid sm:grid-cols-2 gap-5">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-start gap-3 bg-brown-800/60 border border-brown-700 rounded-lg p-4 shard-clip"
            >
              <Icon className="text-olive-300 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-sand-100">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}