/* eslint-disable @next/next/no-img-element */
// Login side panel: factory photo in brand duotone + an illustrated delivery truck
// on a dashed route with store pins (the platform's purpose: factory → stores).

function Pin({ x, y, delay }: { x: number; y: number; delay: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="16" className="hero-pulse fill-royal-500/30" style={{ animationDelay: delay }} />
      <path d="M0 -26c-8.3 0-15 6.5-15 14.6C-15 0 0 14 0 14s15-14 15-25.4C15 -19.5 8.3 -26 0 -26z" className="fill-white" />
      <circle cy="-11.5" r="5.5" className="fill-royal-600" />
    </g>
  );
}

function Truck() {
  return (
    <svg viewBox="0 0 560 210" className="w-full" aria-hidden="true">
      {/* speed lines */}
      <g className="stroke-white/40" strokeWidth="4" strokeLinecap="round">
        <line x1="0" y1="78" x2="38" y2="78" />
        <line x1="10" y1="104" x2="44" y2="104" />
        <line x1="0" y1="130" x2="30" y2="130" />
      </g>
      {/* trailer */}
      <rect x="56" y="30" width="300" height="128" rx="4" className="fill-white" />
      <rect x="56" y="140" width="300" height="18" className="fill-mist-200" />
      <path d="M56 30h52L56 82z" className="fill-royal-600" />
      <image href="/brand/logo-mark.svg" x="178" y="44" width="72" height="68" />
      <text x="214" y="132" textAnchor="middle" className="fill-navy-700" style={{ font: "800 17px var(--font-almarai)" }}>
        الصخرة للصناعة
      </text>
      {/* cab */}
      <path d="M364 62h92c6 0 11 3 14 8l34 48c2 3 3 6 3 10v30H364z" className="fill-royal-600" />
      <path d="M380 76h66c3 0 6 2 8 4l26 36h-100z" className="fill-navy-800" />
      <rect x="364" y="150" width="143" height="8" className="fill-navy-900" />
      <rect x="498" y="134" width="12" height="10" rx="2" className="fill-warn-50" />
      {/* chassis + wheels */}
      <rect x="52" y="158" width="458" height="10" rx="2" className="fill-navy-900" />
      {[110, 168, 300, 440].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="172" r="22" className="fill-navy-900" />
          <circle cx={cx} cy="172" r="10" className="fill-mist-300" />
        </g>
      ))}
      {/* road */}
      <line x1="0" y1="196" x2="560" y2="196" className="stroke-white/30" strokeWidth="3" strokeDasharray="22 14" />
    </svg>
  );
}

export function LoginHero({ title, tagline }: { title: string; tagline: string }) {
  return (
    <section className="corner-accent relative hidden overflow-hidden bg-navy-800 text-white md:flex md:flex-col">
      {/* duotone factory photo */}
      <img src="/brand/factory.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-800/40 to-navy-900/95" />

      <div className="relative flex flex-1 flex-col justify-between p-10">
        <span className="eyebrow text-royal-100">Al-Sakhra for Industry</span>

        <div className="flex flex-col gap-8">
          {/* route: factory → stores */}
          <svg viewBox="0 0 520 120" className="w-full max-w-lg" aria-hidden="true">
            <path
              d="M20 96 C 120 96, 140 30, 240 40 S 380 100, 500 34"
              fill="none"
              className="hero-dash stroke-white/70"
              strokeWidth="3"
              strokeDasharray="10 10"
            />
            <g transform="translate(20 96)">
              <rect x="-16" y="-16" width="32" height="32" className="fill-royal-600" />
              <path d="M-9 8V-2l6 -4v4l6 -4v4l6-4V8z" className="fill-white" />
            </g>
            <Pin x={240} y={40} delay="0s" />
            <Pin x={372} y={84} delay="0.6s" />
            <Pin x={500} y={34} delay="1.2s" />
          </svg>

          <div>
            <h1 className="text-5xl font-extrabold leading-tight">{title}</h1>
            <div className="mt-4 h-1 w-20 bg-royal-500" />
            <p className="mt-4 max-w-md text-lg text-royal-100">{tagline}</p>
          </div>

          <div className="hero-truck max-w-xl">
            <Truck />
          </div>
        </div>

        <span className="eyebrow text-royal-100">Al-Kharj · Riyadh</span>
      </div>
    </section>
  );
}
