import { Menu, Mail, ChevronDown, Copy, Send, MapPin, MessageCircle, ArrowLeft, FileDown, Languages, Eye, Flag, Check } from "lucide-react";
import { Container, Eyebrow, Icon, T, TintedPhoto } from "./ui";
import {
  ABOUT, BRANDS, CERTS, CLIENTS, CONTACT, SOCIAL, CUSTOM, REQUEST_TYPES, GOV, HERO, NAV, PRODUCTS, SECTORS, WHY,
} from "@/lib/content";

// Every phone link opens a WhatsApp chat with a short greeting already typed.
const WA = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent("السلام عليكم، أود الاستفسار عن منتجات الصخرة للصناعة")}`;

function LangButton({ className = "" }: { className?: string }) {
  return (
    <>
      {/* Arabic page (/) links to English (/en) and vice versa; CSS shows the right one. */}
      <a href="/en" hrefLang="en" lang="en" className={`t-ar inline-flex items-center gap-1.5 text-sm font-semibold ${className}`}>
        <Languages size={17} /> English
      </a>
      {/* Plain <a> on purpose: / and /en have different root layouts, so this is a full page load anyway. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" hrefLang="ar" lang="ar" className={`t-en inline-flex items-center gap-1.5 font-ar text-sm font-semibold ${className}`}>
        <Languages size={17} /> عربي
      </a>
    </>
  );
}

/* ------------------------------------------------------------ Header */
export function Header() {
  return (
    <header
      id="site-header"
      data-solid="false"
      className="group fixed inset-x-0 top-0 z-50 transition-colors duration-300 data-[solid=true]:bg-brand-950/95 data-[solid=true]:shadow-lg data-[solid=true]:shadow-brand-950/20 data-[solid=true]:backdrop-blur"
    >
      <Container className="flex h-16 items-center justify-between gap-4 md:h-20">
        <a href="#top" className="flex shrink-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/mark-white.png" alt="" className="h-9 w-auto md:h-10" />
          <span className="leading-tight text-white">
            <span className="block font-ar text-sm font-bold">الصخرة للصناعة</span>
            <span className="block text-[10px] font-semibold tracking-[0.15em]" dir="ltr">AL-SAKHRA FOR INDUSTRY</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-white/85 transition-colors hover:text-white">
              <T t={l} />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <a href={WA} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 text-sm font-semibold text-white/90 hover:text-white xl:inline-flex">
            <MessageCircle size={16} /> <span dir="ltr">{CONTACT.phoneDisplay}</span>
          </a>
          <LangButton className="px-2 py-2 text-white/90 hover:text-white" />
          <a
            href="#contact"
            className="hidden bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-100 sm:inline-flex"
          >
            <T t={{ ar: "اطلب عرض سعر", en: "Request a quote" }} />
          </a>
          <button id="menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu" className="p-2 text-white lg:hidden">
            <Menu size={26} />
          </button>
        </div>
      </Container>

      <nav id="mobile-menu" hidden className="border-t border-white/10 bg-brand-950 lg:hidden" aria-label="Mobile">
        <Container className="pb-6 pt-2">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className="block border-b border-white/10 py-3.5 font-medium text-white">
              <T t={l} />
            </a>
          ))}
          <a href="#contact" className="mt-5 flex justify-center bg-white py-3 font-semibold text-brand-900">
            <T t={{ ar: "اطلب عرض سعر", en: "Request a quote" }} />
          </a>
        </Container>
      </nav>
    </header>
  );
}

/* ------------------------------------------------------------ Hero */
export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-brand-900 pt-16 md:pt-20">
      <TintedPhoto src="/images/cover.jpg" className="-z-10 opacity-60" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo/mark-white.png" alt="" aria-hidden className="pointer-events-none absolute -bottom-24 -end-24 -z-10 w-[560px] max-w-none opacity-[0.07]" />

      <Container className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <Eyebrow t={HERO.eyebrow} light />
          <h1 className="mt-5 text-4xl font-bold leading-tight text-balance text-white md:text-5xl md:leading-tight">
            <T t={HERO.title} />
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            <T t={HERO.sub} />
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#contact" className="inline-flex items-center justify-center gap-2 bg-white px-7 py-3.5 font-semibold text-brand-900 transition-colors hover:bg-brand-100">
              <T t={{ ar: "اطلب عرض سعر", en: "Request a quote" }} />
              <ArrowLeft size={18} className="ltr:rotate-180" />
            </a>
            <a href={CONTACT.profilePdf} download className="inline-flex items-center justify-center gap-2 border border-white/50 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-white/10">
              <FileDown size={18} />
              <T t={{ ar: "حمّل بروفايل الشركة", en: "Company profile (PDF)" }} />
            </a>
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/logo-white.png" alt="Al-Sakhra for Industry, الصخرة للصناعة" className="mx-auto hidden h-72 w-auto lg:block" />
      </Container>

      {/* Certification strip — proof up front */}
      <div className="border-t border-white/15 bg-brand-950/60 backdrop-blur-sm">
        <Container className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {CERTS.map((c) => (
            <div key={c.code} className="flex items-center gap-3 py-5 pe-3 last:col-span-2 sm:last:col-span-1">
              <Icon name={c.icon} className="shrink-0 text-brand-200" />
              <div className="min-w-0 px-1">
                <p className="font-bold text-white" dir="ltr">{c.code}</p>
                <p className="text-xs text-white/65"><T t={c.label} /></p>
              </div>
            </div>
          ))}
        </Container>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ About */
export function About() {
  return (
    <section id="about" className="bg-white py-16 md:py-24">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <Eyebrow t={{ ar: "مصنع وطني في الخرج", en: "Made in Al-Kharj" }} />
          <h2 className="mt-4 text-3xl font-bold text-brand-900 md:text-4xl"><T t={ABOUT.title} /></h2>
          <p className="mt-5 text-lg leading-loose text-ink/75"><T t={ABOUT.body} /></p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {ABOUT.values.map((v) => (
              <li key={v.en} className="flex items-center gap-2.5 font-medium text-brand-900">
                <span className="grid h-6 w-6 shrink-0 place-items-center bg-brand-700 text-white"><Check size={14} /></span>
                <T t={v} />
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4">
          <div className="relative h-52 overflow-hidden md:h-60">
            <TintedPhoto src="/images/factory-line.jpg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ I: Eye, ...ABOUT.vision }, { I: Flag, ...ABOUT.mission }].map(({ I, title, body }) => (
              <div key={title.en} className="border-t-[3px] border-brand-700 bg-surface p-5">
                <h3 className="flex items-center gap-2 font-bold text-brand-900"><I size={18} /> <T t={title} /></h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70"><T t={body} /></p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------ Products */
export function Products() {
  return (
    <section id="products" className="bg-surface py-16 md:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Eyebrow t={{ ar: "خطوط الإنتاج", en: "Production lines" }} />
            <h2 className="mt-4 text-3xl font-bold text-brand-900 md:text-4xl">
              <T t={{ ar: "منتجاتنا", en: "Our products" }} />
            </h2>
          </div>
          <p className="max-w-md text-ink/70">
            <T t={{ ar: "متوفرة بأحجام تعبئة للمنشآت والتوريد بالجملة.", en: "Available in facility and bulk-supply pack sizes." }} />
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {PRODUCTS.map((p) => (
            <div key={p.en} className="group bg-white p-5 transition-colors hover:bg-brand-900 md:p-6">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt="" loading="lazy" className="-mx-5 -mt-5 mb-1 aspect-[4/3] w-[calc(100%+2.5rem)] max-w-none object-cover md:-mx-6 md:-mt-6 md:w-[calc(100%+3rem)]" />
              ) : (
                <span className="grid h-12 w-12 place-items-center bg-brand-100 text-brand-700 transition-colors group-hover:bg-white/10 group-hover:text-white">
                  <Icon name={p.icon} size={24} />
                </span>
              )}
              <h3 className="mt-6 text-lg font-bold text-brand-900 transition-colors group-hover:text-white"><T t={p} /></h3>
              <p className="mt-1 text-sm text-ink/60 transition-colors group-hover:text-white/70"><T t={p.use} /></p>
            </div>
          ))}
          <a href="#contact" data-request-type="1" className="col-span-2 flex flex-col justify-between gap-6 bg-brand-900 p-6 text-white transition-colors hover:bg-brand-700">
            <div>
              <Icon name="flask" size={26} className="text-brand-200" />
              <h3 className="mt-4 text-xl font-bold"><T t={CUSTOM.title} /></h3>
              <p className="mt-2 text-white/75"><T t={CUSTOM.body} /></p>
            </div>
            <span className="inline-flex items-center gap-2 font-semibold">
              <T t={{ ar: "اطلب عرض تصنيع لعلامتك", en: "Request a private label quote" }} />
              <ArrowLeft size={18} className="ltr:rotate-180" />
            </span>
          </a>
        </div>

        {/* Own brands */}
        <div className="mt-14 border-t border-ink/10 pt-12">
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <h3 className="text-2xl font-bold text-brand-900 md:text-3xl"><T t={{ ar: "علاماتنا التجارية", en: "Our brands" }} /></h3>
            <p className="text-ink/60"><T t={{ ar: "من تصنيع الصخرة للصناعة في الخرج", en: "Made by Al-Sakhra for Industry in Al-Kharj" }} /></p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {BRANDS.map((b) => {
              const g = b.style === "gradient";
              return (
                <article
                  key={b.name}
                  className={`flex flex-col p-6 md:p-8 ${g ? "bg-gradient-to-br from-[#ef3b2d] via-[#c42bb3] to-[#6a2ad8] text-white" : "border border-brand-700/15 bg-white"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.logo} alt={`${b.name} (${b.nameAr})`} className="h-16 w-auto self-start object-contain md:h-20" />
                  <p className={`mt-5 text-lg font-semibold ${g ? "" : "text-brand-900"}`}><T t={b.about} /></p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {b.products.map((x) => (
                      <li key={x.en} className={`px-3 py-1.5 text-sm ${g ? "bg-white/15" : "bg-surface text-ink/80"}`}><T t={x} /></li>
                    ))}
                  </ul>
                  <div className="mt-auto flex flex-wrap gap-3 pt-7">
                    <a
                      href={b.catalog}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-5 py-3 font-semibold transition-colors ${g ? "bg-white text-[#7a2ad0] hover:bg-white/90" : "bg-brand-900 text-white hover:bg-brand-700"}`}
                    >
                      <FileDown size={18} />
                      <T t={{ ar: `كتالوج ${b.nameAr}`, en: `${b.name} catalog` }} />
                    </a>
                    {b.store && (
                      <a
                        href={b.store}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border border-brand-900/30 px-5 py-3 font-semibold text-brand-900 transition-colors hover:bg-brand-100"
                      >
                        <T t={{ ar: "تسوّق من المتجر", en: "Shop online" }} />
                        <span dir="ltr" className="text-sm opacity-70">{b.store.replace("https://", "")}</span>
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------ Sectors + government supply */
export function Sectors() {
  return (
    <section id="sectors" className="relative isolate overflow-hidden bg-brand-900 py-16 text-white md:py-24">
      <TintedPhoto src="/images/automation.jpg" className="-z-10 opacity-50" />
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <Eyebrow t={GOV.eyebrow} light />
          <h2 className="mt-4 text-3xl font-bold md:text-4xl"><T t={GOV.title} /></h2>
          <p className="mt-5 text-lg leading-relaxed text-white/80"><T t={GOV.body} /></p>
          <ul className="mt-7 grid gap-3">
            {WHY.map((w) => (
              <li key={w.en} className="flex items-center gap-3 text-white/90">
                <Icon name={w.icon} size={20} className="shrink-0 text-brand-200" />
                <T t={w} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-brand-200"><T t={{ ar: "القطاعات التي نخدمها", en: "Sectors we serve" }} /></h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SECTORS.map((s) => (
              <div key={s.en} className="border border-white/15 bg-brand-950/50 p-5 backdrop-blur-sm">
                <Icon name={s.icon} size={26} className="text-white" />
                <p className="mt-4 text-sm font-semibold leading-snug"><T t={s} /></p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------ Quality */
export function Quality() {
  return (
    <section id="quality" className="bg-white py-16 md:py-24">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow t={{ ar: "ضمان الجودة والاعتمادات", en: "Quality & certifications" }} />
          <h2 className="mt-4 text-3xl font-bold text-brand-900 md:text-4xl">
            <T t={{ ar: "شهاداتنا وتراخيصنا", en: "Our certificates and licences" }} />
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CERTS.map((c) => (
            <article key={c.code} className="border-t-[3px] border-brand-900 bg-surface p-5">
              <span className="grid h-11 w-11 place-items-center bg-brand-700 text-white"><Icon name={c.icon} /></span>
              <h3 className="mt-5 text-2xl font-bold text-brand-900" dir="ltr">{c.code}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-700"><T t={c.label} /></p>
              <p className="mt-3 text-sm leading-relaxed text-ink/70"><T t={c.body} /></p>
              {c.file && (
                <a href={c.file} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
                  <FileDown size={16} /> <T t={{ ar: "عرض الشهادة", en: "View certificate" }} />
                </a>
              )}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------ Clients (shown once CLIENTS has entries) */
export function Clients() {
  if (CLIENTS.length === 0) return null;
  return (
    <section className="border-y border-ink/10 bg-white py-10">
      <Container>
        <p className="text-center text-sm font-semibold text-ink/60"><T t={{ ar: "يثق بنا", en: "Trusted by" }} /></p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {CLIENTS.map((c) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={c.name} src={c.logo} alt={c.name} className="h-10 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 md:h-12" />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------ Contact + quote form */
export function Contact() {
  const field = "w-full border border-ink/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20";
  const label = "mb-1.5 block text-sm font-semibold text-brand-900";
  return (
    <section id="contact" className="bg-surface py-16 md:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <Eyebrow t={{ ar: "تواصل معنا", en: "Contact us" }} />
          <h2 className="mt-4 text-3xl font-bold text-brand-900 md:text-4xl">
            <T t={{ ar: "لنبدأ طلبك", en: "Let's start your order" }} />
          </h2>
          <p className="mt-4 text-ink/70">
            <T t={{ ar: "أرسل تفاصيل طلبك ونرد عليك بعرض سعر.", en: "Send us the details and we'll reply with a quote." }} />
          </p>

          <div className="mt-8 grid gap-3">
            <a href={WA} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white p-5 transition-colors hover:bg-brand-100">
              <MessageCircle className="shrink-0 text-brand-700" />
              <span className="text-lg font-bold text-brand-900" dir="ltr">{CONTACT.phoneDisplay}</span>
            </a>
            {/* Email card: tapping it slides open a menu (Gmail / copy),
                because mailto: alone does nothing on devices without a mail app. */}
            <div data-email-menu data-open="false" className="group/email bg-white transition-shadow data-[open=true]:shadow-lg data-[open=true]:shadow-brand-900/10">
              <button
                type="button"
                data-email-toggle
                aria-expanded="false"
                aria-controls="email-options"
                className="flex w-full items-center gap-4 p-5 text-start transition-colors hover:bg-brand-100"
              >
                <Mail className="shrink-0 text-brand-700" />
                <span className="min-w-0 flex-1 break-all text-lg font-bold text-brand-900">{CONTACT.email}</span>
                <ChevronDown size={20} className="shrink-0 text-brand-700 transition-transform duration-300 group-data-[open=true]/email:rotate-180" />
              </button>
              <div
                id="email-options"
                className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-out group-data-[open=true]/email:grid-rows-[1fr] group-data-[open=true]/email:opacity-100"
              >
                <div className="overflow-hidden">
                  <p className="px-5 text-sm text-ink/60">
                    <T t={{ ar: "كيف تريد مراسلتنا؟", en: "How would you like to email us?" }} />
                  </p>
                  <div className="grid grid-cols-2 gap-2 p-5 pt-3">
                    {[
                      { href: `https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT.email}`, label: { ar: "Gmail", en: "Gmail" }, external: true },
                    ].map((o) => (
                      <a
                        key={o.href}
                        href={o.href}
                        tabIndex={-1}
                        data-email-option
                        {...(o.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="flex items-center justify-center gap-2 border border-brand-700/25 bg-surface px-3 py-3 font-semibold text-brand-900 transition-colors hover:border-brand-700 hover:bg-brand-100"
                      >
                        <Send size={16} className="text-brand-700 rtl:-scale-x-100" />
                        <T t={o.label} />
                      </a>
                    ))}
                    <button
                      type="button"
                      tabIndex={-1}
                      data-email-option
                      data-copy={CONTACT.email}
                      className="flex items-center justify-center gap-2 bg-brand-900 px-3 py-3 font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      <Copy size={16} />
                      <span data-copy-label><T t={{ ar: "نسخ البريد", en: "Copy email" }} /></span>
                      <span data-copy-done hidden><T t={{ ar: "تم النسخ ✓", en: "Copied ✓" }} /></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <a href={CONTACT.mapHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white p-5 transition-colors hover:bg-brand-100">
              <MapPin className="shrink-0 text-brand-700" />
              <span className="font-semibold text-brand-900"><T t={CONTACT.address} /></span>
            </a>
          </div>
        </div>

        <form id="quote-form" data-wa={CONTACT.whatsappNumber} className="bg-white p-6 shadow-xl shadow-brand-900/5 md:p-8">
          <h3 className="text-xl font-bold text-brand-900"><T t={{ ar: "طلب عرض سعر", en: "Request a quote" }} /></h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="q-name" className={label}><T t={{ ar: "الاسم", en: "Name" }} /></label>
              <input id="q-name" name="name" required className={field} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="q-company" className={label}><T t={{ ar: "الجهة / الشركة", en: "Company" }} /></label>
              <input id="q-company" name="company" className={field} autoComplete="organization" />
            </div>
            <div>
              <label htmlFor="q-type" className={label}><T t={{ ar: "نوع الطلب", en: "Request type" }} /></label>
              <select id="q-type" name="type" className={field} defaultValue={`${REQUEST_TYPES[0].ar} / ${REQUEST_TYPES[0].en}`}>
                {REQUEST_TYPES.map((r) => (
                  <option key={r.en} value={`${r.ar} / ${r.en}`}>{r.ar} · {r.en}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="q-sector" className={label}><T t={{ ar: "القطاع", en: "Sector" }} /></label>
              <select id="q-sector" name="sector" className={field} defaultValue="">
                <option value="" disabled>اختر · Select</option>
                {SECTORS.map((s) => (
                  <option key={s.en} value={`${s.ar} / ${s.en}`}>{s.ar} · {s.en}</option>
                ))}
                <option value="أخرى / Other">أخرى · Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="q-details" className={label}><T t={{ ar: "المنتجات والكميات", en: "Products & quantities" }} /></label>
              <textarea
                id="q-details"
                name="details"
                rows={4}
                required
                className={field}
                data-ph-ar="مثال: 500 جالون مطهر، 200 كرتون صابون أيدي شهريًا"
                data-ph-en="e.g. 500 gallons of disinfectant, 200 cartons of hand soap per month"
                placeholder="مثال: 500 جالون مطهر، 200 كرتون صابون أيدي شهريًا"
              />
            </div>
            <label htmlFor="q-sds" className="flex items-center gap-3 text-sm text-ink/80 sm:col-span-2">
              <input id="q-sds" name="sds" type="checkbox" className="h-4 w-4 accent-brand-700" />
              <T t={{ ar: "أحتاج نشرات بيانات السلامة (SDS) والمواصفات الفنية", en: "I need safety data sheets (SDS) and technical specs" }} />
            </label>
          </div>
          <button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-brand-900 px-6 py-4 font-semibold text-white transition-colors hover:bg-brand-700">
            <MessageCircle size={20} />
            <T t={{ ar: "أرسل الطلب عبر واتساب", en: "Send via WhatsApp" }} />
          </button>
          <a id="quote-fallback" hidden target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-sm font-semibold text-brand-700 underline">
            <T t={{ ar: "لم يفتح واتساب؟ اضغط هنا", en: "WhatsApp didn't open? Tap here" }} />
          </a>
          <p className="mt-3 text-center text-xs text-ink/50">
            <T t={{ ar: "سيُفتح واتساب برسالة جاهزة تحتوي على تفاصيلك.", en: "WhatsApp opens with a ready message containing your details." }} />
          </p>
        </form>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------ Footer + floating WhatsApp */
export function Footer() {
  return (
    <footer className="bg-brand-950 text-white/70">
      <Container className="flex flex-col items-center justify-between gap-4 py-8 text-sm md:flex-row">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/mark-white.png" alt="" className="h-7 w-auto" />
          <span>© {new Date().getFullYear()} <T t={{ ar: "الصخرة للصناعة", en: "Al-Sakhra for Industry" }} /></span>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Footer">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white"><T t={l} /></a>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          {SOCIAL.map((x) => (
            <a key={x.name} href={x.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">{x.name}</a>
          ))}
          <LangButton className="text-white/80 hover:text-white" />
        </div>
      </Container>
    </footer>
  );
}

export function WhatsAppFab() {
  return (
    <a
      href={WA}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-5 end-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105"
    >
      <MessageCircle size={28} />
    </a>
  );
}
