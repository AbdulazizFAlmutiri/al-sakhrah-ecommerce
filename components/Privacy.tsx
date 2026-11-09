import { ArrowLeft } from "lucide-react";
import { Container, T } from "./ui";
import { Footer, WhatsAppFab } from "./Site";
import { CONTACT, LEGAL, type L } from "@/lib/content";

const UPDATED: L = { ar: "آخر تحديث: 9 نوفمبر 2026", en: "Last updated: 9 November 2026" };

const SECTIONS: { h: L; p: L[] }[] = [
  {
    h: { ar: "من نحن", en: "Who we are" },
    p: [
      {
        ar: `هذا الموقع تابع لـ${LEGAL.name.ar}، ${LEGAL.entity.ar}، سجل تجاري (الرقم الموحد) ${LEGAL.cr}، ومقرها ${CONTACT.address.ar}.`,
        en: `This website belongs to ${LEGAL.name.en}, a ${LEGAL.entity.en.toLowerCase()}, CR unified number ${LEGAL.cr}, located in ${CONTACT.address.en}.`,
      },
    ],
  },
  {
    h: { ar: "البيانات التي نستلمها", en: "Information we receive" },
    p: [
      {
        ar: "عند استخدام نموذج «طلب عرض سعر»، تكتب اسمك واسم الجهة والقطاع ونوع الطلب والمنتجات والكميات. الموقع لا يحفظ هذه البيانات، بل يفتح واتساب برسالة جاهزة، ولا تصلنا إلا إذا أرسلتها أنت.",
        en: "When you use the quote request form, you enter your name, company, sector, request type, and products and quantities. The website does not store this information. It opens WhatsApp with a prepared message, and we only receive it if you send it.",
      },
      {
        ar: "إذا تواصلت معنا عبر واتساب أو البريد الإلكتروني، نستلم رقمك أو بريدك وما تكتبه في رسالتك.",
        en: "If you contact us by WhatsApp or email, we receive your number or email address and what you write in your message.",
      },
      {
        ar: "نستخدم إحصاءات زيارات مجهولة من Vercel لمعرفة عدد الزوار والصفحات التي يزورونها. هذه الإحصاءات لا تستخدم ملفات تعريف الارتباط (الكوكيز) ولا تحدد هويتك.",
        en: "We use anonymous visit statistics from Vercel to count visitors and the pages they view. These statistics do not use cookies and do not identify you.",
      },
    ],
  },
  {
    h: { ar: "كيف نستخدمها", en: "How we use it" },
    p: [
      {
        ar: "نستخدم بياناتك فقط للرد على استفسارك، وإعداد عروض الأسعار، وتنفيذ الطلبات، والتواصل معك بخصوصها.",
        en: "We use your information only to answer your enquiry, prepare quotes, fulfil orders and contact you about them.",
      },
    ],
  },
  {
    h: { ar: "مشاركة البيانات", en: "Sharing" },
    p: [
      {
        ar: "لا نبيع بياناتك ولا نؤجرها. قد تمر عبر مقدمي الخدمات الذين نستخدمهم للتواصل (مثل واتساب وخدمة البريد الإلكتروني)، أو نفصح عنها إذا طلبتها جهة حكومية مختصة وفق الأنظمة.",
        en: "We do not sell or rent your information. It may pass through the services we use to communicate (such as WhatsApp and our email provider), or be disclosed when a competent government authority requires it by law.",
      },
    ],
  },
  {
    h: { ar: "مدة الاحتفاظ", en: "How long we keep it" },
    p: [
      {
        ar: "نحتفظ بالمراسلات طوال المدة اللازمة لخدمة طلبك وعلاقتنا التجارية، أو المدة التي تفرضها الأنظمة.",
        en: "We keep correspondence for as long as needed to handle your request and our business relationship, or as long as the law requires.",
      },
    ],
  },
  {
    h: { ar: "حقوقك", en: "Your rights" },
    p: [
      {
        ar: "وفق نظام حماية البيانات الشخصية في المملكة، يحق لك أن تطلب الاطلاع على بياناتك، أو تصحيحها، أو حذفها. راسلنا على البريد أدناه وسنرد على طلبك.",
        en: "Under the Saudi Personal Data Protection Law, you can ask to see, correct or delete your information. Email us at the address below and we will respond to your request.",
      },
    ],
  },
  {
    h: { ar: "تواصل معنا", en: "Contact" },
    p: [
      {
        ar: `للأسئلة أو الطلبات المتعلقة بالخصوصية: ${CONTACT.email}`,
        en: `For privacy questions or requests: ${CONTACT.email}`,
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <header className="bg-brand-950">
        <Container className="flex h-16 items-center justify-between md:h-20">
          {/* Arabic page links home to /, English to /en */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="t-ar flex items-center gap-3 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/mark-white.png" alt="" className="h-9 w-auto" />
            <span className="font-ar text-sm font-bold">الصخرة للصناعة</span>
          </a>
          <a href="/en" className="t-en flex items-center gap-3 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/mark-white.png" alt="" className="h-9 w-auto" />
            <span className="text-sm font-bold">Al-Sakhra for Industry</span>
          </a>
          <a href="/en/privacy" className="t-ar text-sm font-semibold text-white/85 hover:text-white">English</a>
          { }
          <a href="/privacy" className="t-en font-ar text-sm font-semibold text-white/85 hover:text-white">عربي</a>
        </Container>
      </header>
      <main className="bg-surface py-14 md:py-20">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-bold text-brand-900 md:text-4xl"><T t={{ ar: "سياسة الخصوصية", en: "Privacy policy" }} /></h1>
          <p className="mt-2 text-sm text-ink/55"><T t={UPDATED} /></p>
          <div className="mt-10 space-y-8 bg-white p-6 md:p-10">
            {SECTIONS.map((s) => (
              <section key={s.h.en}>
                <h2 className="text-lg font-bold text-brand-900"><T t={s.h} /></h2>
                {s.p.map((x) => (
                  <p key={x.en} className="mt-2 leading-loose text-ink/80"><T t={x} /></p>
                ))}
              </section>
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="t-ar mt-8 inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline">
            <ArrowLeft size={16} className="rotate-180" /> العودة للصفحة الرئيسية
          </a>
          <a href="/en" className="t-en mt-8 inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline">
            <ArrowLeft size={16} /> Back to the home page
          </a>
        </Container>
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
