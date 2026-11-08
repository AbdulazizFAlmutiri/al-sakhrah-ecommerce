import { BookOpen, Users, Eye, Flag, Phone, Mail, MapPin, MessageCircle, ArrowRight } from "lucide-react";
import { Ar, Container, Icon, SectionHeading, TintedPhoto } from "./ui";
import { CERTIFICATIONS, CONTACT, PRODUCTS, SECTORS, VALUES, WHY } from "@/lib/content";

const num = (i: number) => String(i + 1).padStart(2, "0");

/* ---------------------------------------------------------------- Hero */
export function Hero() {
  return (
    <section id="top" className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-brand-900 pt-20">
      <TintedPhoto src="/images/cover.jpg" className="-z-10 opacity-70" />
      {/* giant faded S like the cover */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo/mark-white.png" alt="" aria-hidden className="pointer-events-none absolute -right-24 top-10 -z-10 w-[640px] max-w-none opacity-[0.06]" />
      <div className="corner-accent absolute bottom-0 left-0 -z-10 h-40 w-40 rotate-[-90deg] bg-brand-600 md:h-64 md:w-64" />

      <Container className="py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/logo-white.png" alt="Al-Sakhra for Industry — الصخرة للصناعة" className="mx-auto h-40 w-auto sm:h-52 md:h-60" />
        <span className="mx-auto mt-10 block h-[2px] w-16 bg-white/70" />
        <Ar as="h1" className="mx-auto mt-8 max-w-3xl !text-center text-2xl font-bold leading-relaxed text-white sm:text-3xl md:text-4xl md:leading-relaxed">
          شريكك الموثوق لحلول المنظفات ومستحضرات العناية من الأساس حتى التسليم
        </Ar>
        <p className="mx-auto mt-5 max-w-2xl text-base font-light text-white/85 sm:text-lg">
          Your trusted partner for cleaning and cosmetic solutions — from foundation to final delivery.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#contact" className="inline-flex w-full items-center justify-center gap-2 bg-white px-7 py-3.5 font-semibold text-brand-900 transition-colors hover:bg-brand-100 sm:w-auto">
            Contact us <span className="font-ar">· تواصل معنا</span>
          </a>
          <a href="#products" className="inline-flex w-full items-center justify-center gap-2 border border-white/60 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto">
            Our products <ArrowRight size={18} />
          </a>
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------------- About */
export function About() {
  return (
    <section id="about" className="bg-surface">
      <div className="relative h-56 md:h-72">
        <TintedPhoto src="/images/factory-line.jpg" />
        <div className="absolute bottom-0 left-0 bg-brand-900 px-6 py-5 md:px-10 md:py-7 md:w-[55%]">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-brand-200">AL-KHARJ · KINGDOM OF SAUDI ARABIA</p>
          <Ar className="mt-2 !text-left text-xl font-bold text-white md:text-2xl">مصنع وطني في المدينة الصناعية بالخرج</Ar>
        </div>
      </div>

      <Container className="py-16 md:py-24 space-y-6">
        <div className="grid gap-8 border-t-[3px] border-brand-900 bg-white p-6 md:grid-cols-2 md:gap-12 md:p-10">
          <div>
            <h3 className="flex items-center gap-3 text-lg font-bold tracking-[0.15em] text-brand-900"><BookOpen size={22} /> INTRODUCTION</h3>
            <p className="mt-4 leading-relaxed text-ink/75">
              In light of the Kingdom&apos;s rapid industrial growth and the continuous development goals driven by Vision 2030,
              Al-Sakhrah Industrial Factory was established to be a specialized national entity in the detergent and cosmetics
              sector, built on practical expertise and a clear vision aimed at elevating execution quality and customer satisfaction.
            </p>
          </div>
          <div>
            <Ar as="h3" className="text-3xl font-bold text-brand-900">المقدمة</Ar>
            <Ar className="mt-4 leading-loose text-ink/80">
              في ظل الحراك الصناعي المتسارع الذي تشهده المملكة، ومع توجهات التطوير المستمرة التي تقودها رؤية 2030، تأسس مصنع الصخرة
              للصناعة ليكون جهة وطنية متخصصة في قطاع المنظفات ومستحضرات العناية، تستند إلى خبرة عملية ورؤية واضحة تستهدف رفع جودة
              التنفيذ وتحقيق رضا العميل.
            </Ar>
          </div>
        </div>

        <div className="grid gap-8 bg-brand-900 p-6 text-white md:grid-cols-2 md:gap-12 md:p-10">
          <div>
            <h3 className="flex items-center gap-3 text-lg font-bold tracking-[0.15em]"><Users size={22} /> WHO WE ARE</h3>
            <p className="mt-4 leading-relaxed text-white/80">
              Al-Sakhrah for Manufacturing is a Saudi national factory based in the Industrial City in Al-Kharj, specialized in the
              manufacture of detergents and care preparations. We deliver integrated solutions to our clients locally and
              internationally, grounded in a firm commitment to quality.
            </p>
          </div>
          <div>
            <Ar as="h3" className="text-3xl font-bold">من نحن</Ar>
            <Ar className="mt-4 leading-loose text-white/90">
              مصنع الصخرة للصناعة هو مصنع وطني يقع في المدينة الصناعية في الخرج، متخصص في صناعة المنظفات والمستحضرات. نقدم حلولاً
              متكاملة لعملائنا محليًا وعالميًا، مستندين على التزام ثابت بالجودة.
            </Ar>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------------- Vision & Values */
export function Vision() {
  const blocks = [
    {
      Icon: Eye, en: "OUR VISION", ar: "رؤيتنا",
      textEn: "To be the leading and most trusted factory in the detergents and personal care sector across the region, through precise, competitive formulations that add real value for our partners.",
      textAr: "نطمح لأن نكون المصنع الرائد والأكثر موثوقية في قطاع المنظفات ومستحضرات العناية على مستوى المنطقة، من خلال تقديم تركيبات دقيقة وتنافسية تضيف قيمة فعلية لشركائنا.",
    },
    {
      Icon: Flag, en: "OUR MISSION", ar: "رسالتنا",
      textEn: "We are committed to safe, high-quality products through a way of working that balances manufacturing precision, continuous innovation, and fast response to market needs.",
      textAr: "نلتزم بتقديم منتجات عالية الجودة وآمنة، من خلال أسلوب عمل يوازن بين دقة التصنيع، الابتكار المستمر، وسرعة تلبية احتياجات السوق.",
    },
  ];
  return (
    <section id="vision" className="relative isolate overflow-hidden bg-brand-800 py-16 md:py-24">
      <TintedPhoto src="/images/production.jpg" className="-z-10 h-80 opacity-60 [mask-image:linear-gradient(black,transparent)]" />
      <Container>
        <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-3xl font-light text-white md:text-4xl">VISION <span className="font-bold">&amp; VALUES</span></h2>
          <Ar as="h2" className="text-3xl font-bold text-white md:text-4xl">الرؤية والقيم</Ar>
        </div>

        <div className="space-y-4">
          {blocks.map(({ Icon: I, ...b }) => (
            <div key={b.en} className="grid gap-6 border border-white/20 bg-brand-950/55 p-6 backdrop-blur-sm md:grid-cols-2 md:gap-12 md:p-8">
              <div>
                <h3 className="flex items-center gap-3 font-bold tracking-[0.2em] text-white"><I size={20} /> {b.en}</h3>
                <p className="mt-3 leading-relaxed text-white/70">{b.textEn}</p>
              </div>
              <div>
                <Ar as="h3" className="text-2xl font-bold text-white">{b.ar}</Ar>
                <Ar className="mt-3 leading-loose text-white/90">{b.textAr}</Ar>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 mb-6 flex items-center justify-between">
          <h3 className="font-bold tracking-[0.25em] text-white">OUR VALUES</h3>
          <Ar as="h3" className="text-2xl font-bold text-white">قيمنا</Ar>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <div key={v.en} className="bg-white p-6 shadow-xl shadow-brand-950/30">
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center bg-brand-700 text-white"><Icon name={v.icon} /></span>
                <span className="text-2xl font-bold text-brand-200">{num(i)}</span>
              </div>
              <Ar as="h4" className="mt-10 text-xl font-bold text-brand-900">{v.ar}</Ar>
              <p className="mt-1 text-right text-sm text-ink/70">{v.en}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------------- Quality */
export function Quality() {
  return (
    <section id="quality" className="bg-surface">
      <div className="relative h-48 md:h-64">
        <TintedPhoto src="/images/lab.jpg" />
        <div className="corner-accent absolute bottom-0 left-0 h-20 w-20 rotate-[-90deg] bg-surface md:h-28 md:w-28" />
      </div>
      <Container className="py-16 md:py-24">
        <SectionHeading
          en="Quality Assurance & Certifications"
          sub="Trust is built before the product is. We hold our operation to the highest international and local quality standards."
          ar="ضمان الجودة والاعتمادات"
          subAr="نؤمن أن الثقة تُبنى قبل المنتجات، لذلك نحرص على تطبيق أعلى معايير الجودة العالمية والمحلية."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          {CERTIFICATIONS.map((c, i) => {
            const dark = i === CERTIFICATIONS.length - 1;
            return (
              <article key={c.code} className={`border-t-[3px] p-6 md:p-8 shadow-sm ${dark ? "border-brand-600 bg-brand-900 text-white" : "border-brand-900 bg-white"}`}>
                <span className={`grid h-12 w-12 place-items-center ${dark ? "bg-white text-brand-900" : "bg-brand-700 text-white"}`}>
                  <Icon name={c.icon} />
                </span>
                <h3 className={`mt-5 text-3xl font-bold ${dark ? "" : "text-brand-900"}`}>{c.code}</h3>
                <p className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${dark ? "text-brand-200" : "text-brand-700"}`}>{c.tag}</p>
                <hr className={`my-5 ${dark ? "border-white/20" : "border-ink/10"}`} />
                <Ar as="h4" className={`text-lg font-bold ${dark ? "" : "text-brand-900"}`}>{c.titleAr}</Ar>
                <Ar className={`mt-2 leading-loose ${dark ? "text-white/85" : "text-ink/75"}`}>{c.bodyAr}</Ar>
                <p className={`mt-3 text-sm leading-relaxed ${dark ? "text-white/65" : "text-ink/55"}`}>{c.bodyEn}</p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------------- Products + institutional supply */
export function Products() {
  return (
    <section id="products" className="bg-white">
      <Container className="py-16 md:py-24">
        <SectionHeading en="Products & Services" sub="Full production lines" ar="منتجاتنا وخدماتنا" subAr="خطوط الإنتاج الشاملة" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <div key={p.en} className="group flex min-h-44 flex-col justify-between bg-surface p-5 transition-colors hover:bg-brand-900 md:min-h-56 md:p-6">
              <span className="grid h-12 w-12 place-items-center border-2 border-brand-700 text-brand-700 transition-colors group-hover:border-white group-hover:text-white md:h-14 md:w-14">
                <Icon name={p.icon} size={24} />
              </span>
              <div className="mt-8">
                <Ar as="h3" className="text-lg font-bold text-brand-900 transition-colors group-hover:text-white md:text-xl">{p.ar}</Ar>
                <p className="mt-1 text-right text-sm text-ink/65 transition-colors group-hover:text-white/75">{p.en}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      <div className="grid md:grid-cols-[2fr_3fr]">
        <div className="relative min-h-60">
          <TintedPhoto src="/images/conveyor.jpg" />
        </div>
        <div className="relative bg-brand-900 px-6 py-12 text-white md:px-12 md:py-16">
          <div className="corner-accent absolute left-0 top-0 h-16 w-16 bg-brand-600" />
          <p className="text-[11px] font-semibold tracking-[0.3em] text-brand-200">INSTITUTIONAL &amp; GOVERNMENT SUPPLY</p>
          <Ar as="h3" className="mt-4 text-3xl font-bold">التوريد المؤسسي والحكومي</Ar>
          <Ar className="mt-4 leading-loose text-white/90">
            نقدم حلول توريد متكاملة ومستدامة مصممة خصيصًا لتلبية احتياجات الجهات الحكومية والمؤسسات الكبرى. نضمن أعلى معايير
            الجودة، الامتثال التام لاشتراطات المحتوى المحلي، والقدرة الإنتاجية العالية لتلبية الكميات الضخمة في الوقت المحدد.
          </Ar>
          <hr className="my-6 border-white/20" />
          <p className="text-sm leading-relaxed text-white/70">
            We provide integrated and sustainable supply solutions tailored for government agencies and large institutions. We
            ensure the highest quality standards, full compliance with Local Content requirements, and the massive production
            capacity to fulfill large-volume orders on time.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Sectors */
export function Sectors() {
  return (
    <section id="sectors">
      <div className="relative isolate overflow-hidden bg-brand-900 py-14 md:py-20">
        <TintedPhoto src="/images/automation.jpg" className="-z-10" />
        <Container>
          <SectionHeading
            light
            en="Target Sectors"
            sub="Our industrial cleaning and care solutions serve a broad range of sectors, most notably the following."
            ar="القطاعات المستهدفة"
            subAr="نقدم منتجات وحلول المنظفات الصناعية والعناية لتلبية احتياجات مجموعة واسعة من القطاعات، ومن أبرزها:"
          />
        </Container>
      </div>
      <Container className="py-12 md:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map((s, i) => {
            const dark = i === SECTORS.length - 1;
            return (
              <div key={s.en} className={`flex min-h-52 flex-col justify-between border-b-[3px] border-brand-700 p-6 ${dark ? "bg-brand-900 text-white" : "bg-surface"}`}>
                <div className="flex items-start justify-between">
                  <span className={`grid h-12 w-12 place-items-center ${dark ? "bg-white text-brand-900" : "bg-brand-700 text-white"}`}><Icon name={s.icon} /></span>
                  <span className={`text-2xl font-bold ${dark ? "text-white/40" : "text-brand-200"}`}>{num(i)}</span>
                </div>
                <div className="mt-10">
                  <Ar as="h3" className={`text-xl font-bold ${dark ? "" : "text-brand-900"}`}>{s.ar}</Ar>
                  <p className={`mt-1 text-right text-sm ${dark ? "text-white/75" : "text-ink/65"}`}>{s.en}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------------- Why us */
export function WhyUs() {
  return (
    <section id="why" className="relative isolate overflow-hidden bg-brand-950 py-16 md:py-24">
      <TintedPhoto src="/images/robotics.jpg" className="-z-10 opacity-40" />
      <Container>
        <div className="mb-10">
          <Ar as="h2" className="text-3xl font-bold text-white md:text-4xl">لماذا مصنع الصخرة؟</Ar>
          <h2 className="mt-2 text-3xl font-light text-white md:text-4xl">WHY <span className="font-bold">AL-SAKHRAH?</span></h2>
          <span className="mt-5 block h-[3px] w-12 bg-white" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {WHY.map((w, i) => (
            <div key={w.en} className="flex gap-5 border border-white/15 border-l-[3px] border-l-white bg-brand-950/60 p-6 backdrop-blur-sm md:p-8">
              <div className="flex flex-col items-center gap-3 text-white">
                <Icon name={w.icon} size={26} />
                <span className="text-2xl font-bold">{num(i)}</span>
              </div>
              <div className="flex-1">
                <Ar as="h3" className="text-lg font-semibold leading-relaxed text-white">{w.ar}</Ar>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{w.en}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------------------------------------------------------- Contact */
export function Contact() {
  const card = "flex items-start gap-4 border-t-[3px] border-brand-700 bg-surface p-6 transition-colors hover:bg-brand-100";
  return (
    <section id="contact" className="bg-white">
      <Container className="py-16 md:py-24">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/logo-color.png" alt="Al-Sakhra for Industry" className="mx-auto h-36 w-auto md:h-44" />
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className="text-sm font-bold tracking-[0.3em] text-brand-900">CONTACT US</span>
            <span className="h-6 w-px bg-ink/20" />
            <span dir="rtl" className="font-ar text-2xl font-bold text-brand-900">تواصل معنا</span>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          <a href={CONTACT.mapHref} target="_blank" rel="noopener noreferrer" className={`${card} sm:col-span-2`}>
            <MapPin className="mt-1 shrink-0 text-brand-700" size={26} />
            <div className="flex-1">
              <Ar className="font-bold text-brand-900">{CONTACT.addressAr}</Ar>
              <p className="mt-1 text-sm text-ink/65">{CONTACT.addressEn}</p>
            </div>
          </a>
          <a href={CONTACT.phoneHref} className={card}>
            <Phone className="mt-1 shrink-0 text-brand-700" size={24} />
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-ink/50">PHONE · <span className="font-ar">الهاتف</span></p>
              <p dir="ltr" className="mt-1 text-xl font-bold text-brand-900">{CONTACT.phoneDisplay}</p>
            </div>
          </a>
          <a href={`mailto:${CONTACT.email}`} className={card}>
            <Mail className="mt-1 shrink-0 text-brand-700" size={24} />
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.2em] text-ink/50">EMAIL · <span className="font-ar">البريد</span></p>
              <p className="mt-1 break-all text-xl font-bold text-brand-900">{CONTACT.email}</p>
            </div>
          </a>
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-900 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <MessageCircle size={20} /> Message us on WhatsApp <span className="font-ar">· واتساب</span>
          </a>
        </div>
      </Container>

      <div className="relative h-56 md:h-72">
        <TintedPhoto src="/images/plant.jpg" />
        <div className="corner-accent absolute left-0 top-0 h-full w-1/3 bg-brand-600/70" />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Footer */
export function Footer() {
  return (
    <footer className="bg-brand-950 text-white/70">
      <Container className="flex flex-col items-center justify-between gap-3 py-6 text-xs sm:flex-row">
        <p className="tracking-[0.2em]">© {new Date().getFullYear()} AL-SAKHRA FOR INDUSTRY</p>
        <p className="tracking-wider">{CONTACT.email} · <span dir="ltr">{CONTACT.phoneDisplay}</span></p>
        <p dir="rtl" className="font-ar text-sm text-white">الصخرة للصناعة</p>
      </Container>
    </footer>
  );
}
