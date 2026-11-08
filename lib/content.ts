// All site copy (Arabic + English), taken from the 2026 company profile.
// Edit this file to update text, contact details, products, etc.

export type L = { ar: string; en: string };

export const CONTACT = {
  phoneDisplay: "+966 55 626 8175",
  whatsappNumber: "966556268175",
  email: "info@alsakhrah.com",
  address: {
    ar: "المدينة الصناعية في الخرج، المملكة العربية السعودية",
    en: "Industrial City, Al-Kharj, Kingdom of Saudi Arabia",
  },
  mapHref: "https://www.google.com/maps/search/?api=1&query=Al-Kharj+Industrial+City+Saudi+Arabia",
  profilePdf: "/Al-Sakhra-Company-Profile.pdf",
};

export const NAV: (L & { href: string })[] = [
  { href: "#about", ar: "من نحن", en: "About" },
  { href: "#products", ar: "منتجاتنا", en: "Products" },
  { href: "#sectors", ar: "القطاعات", en: "Sectors" },
  { href: "#quality", ar: "الجودة", en: "Quality" },
  { href: "#contact", ar: "تواصل معنا", en: "Contact" },
];

export const HERO = {
  eyebrow: { ar: "مصنع وطني · المدينة الصناعية بالخرج", en: "Saudi national factory · Al-Kharj Industrial City" },
  title: {
    ar: "شريكك الموثوق لحلول المنظفات ومستحضرات العناية",
    en: "Your trusted partner for cleaning and care solutions",
  },
  sub: {
    ar: "من الأساس حتى التسليم: نصنّع منظفات ومطهرات بجودة معتمدة للمنشآت والجهات الحكومية والقطاع الخاص، ونصنّع لعلامتك التجارية الخاصة.",
    en: "From foundation to final delivery: certified detergents and disinfectants for facilities, government and private-sector buyers, plus private label manufacturing under your brand.",
  },
};

// Optional `file`: put a certificate scan (PDF or image) in public/certificates/
// and set e.g. file: "/certificates/iso-9001.pdf" — a "View certificate" link appears.
export const CERTS: { code: string; label: L; body: L; icon: string; file?: string }[] = [
  {
    code: "ISO 9001", icon: "badge",
    label: { ar: "شهادة الأيزو 9001", en: "ISO 9001 certified" },
    body: {
      ar: "نظام إدارة جودة موثق يضبط مراحل التصنيع والتعبئة والفحص النهائي لكل دفعة إنتاج.",
      en: "A documented quality system covering manufacturing, filling and final inspection of every batch.",
    },
  },
  {
    code: "SFDA", icon: "shield",
    label: { ar: "ترخيص هيئة الغذاء والدواء", en: "SFDA approved" },
    body: {
      ar: "اعتماد رسمي يؤكد مطابقة منتجاتنا لاشتراطات السلامة والتصنيع المعتمدة في المملكة.",
      en: "Official approval that our products meet the Kingdom's safety and manufacturing requirements.",
    },
  },
  {
    code: "LCGPA", icon: "building",
    label: { ar: "شهادة المحتوى المحلي", en: "Local Content certified" },
    body: {
      ar: "تصنيف معتمد يمنح شركاءنا أفضلية في المنافسات الحكومية وبرامج توطين سلاسل الإمداد.",
      en: "Gives our partners preference in government tenders and supply-chain localisation programmes.",
    },
  },
  {
    code: "MIM", icon: "landmark",
    label: { ar: "الترخيص الصناعي الرسمي", en: "Official industrial licence" },
    body: {
      ar: "ترخيص صادر عن وزارة الصناعة والثروة المعدنية يغطي نشاط تصنيع المنظفات والمستحضرات.",
      en: "Issued by the Ministry of Industry and Mineral Resources for detergent manufacturing.",
    },
  },
  {
    code: "Saudi Made", icon: "award",
    label: { ar: "صناعة سعودية", en: "Saudi Made" },
    body: {
      ar: "منتجاتنا حاصلة على شعار برنامج «صنع في السعودية» للمنتجات الوطنية.",
      en: "Our products carry the national \"Made in Saudi\" programme mark.",
    },
  },
];

export const ABOUT = {
  title: { ar: "من نحن", en: "Who we are" },
  body: {
    ar: "مصنع الصخرة للصناعة مصنع وطني في المدينة الصناعية بالخرج، تأسس في ظل الحراك الصناعي الذي تقوده رؤية 2030 ليكون جهة متخصصة في صناعة المنظفات ومستحضرات العناية. نقدم حلولاً متكاملة لعملائنا محليًا وعالميًا، مستندين على التزام ثابت بالجودة.",
    en: "Al-Sakhra is a Saudi national factory in Al-Kharj Industrial City, founded amid the industrial growth driven by Vision 2030 to specialise in detergents and care preparations. We deliver integrated solutions to clients locally and internationally, grounded in a firm commitment to quality.",
  },
  vision: {
    title: { ar: "رؤيتنا", en: "Vision" },
    body: {
      ar: "أن نكون المصنع الرائد والأكثر موثوقية في قطاع المنظفات ومستحضرات العناية على مستوى المنطقة.",
      en: "To be the region's leading and most trusted factory for detergents and personal care.",
    },
  },
  mission: {
    title: { ar: "رسالتنا", en: "Mission" },
    body: {
      ar: "منتجات آمنة وعالية الجودة بأسلوب يوازن بين دقة التصنيع والابتكار المستمر وسرعة الاستجابة للسوق.",
      en: "Safe, high-quality products that balance manufacturing precision, innovation and fast response to the market.",
    },
  },
  values: [
    { ar: "الاحترافية والجودة", en: "Professionalism & quality" },
    { ar: "الوضوح والشفافية", en: "Clarity & transparency" },
    { ar: "السلامة والانضباط", en: "Safety & discipline" },
    { ar: "الفخر بالصناعة الوطنية", en: "Pride in local industry" },
  ] as L[],
};

// Optional `image`: put a product photo in public/products/ and set e.g. image: "/products/bleach.jpg".
export const PRODUCTS: (L & { icon: string; use: L; image?: string })[] = [
  { icon: "droplet", ar: "الكلور", en: "Chlorine bleach", use: { ar: "تبييض وتعقيم الأسطح", en: "Whitening & surface sanitising" } },
  { icon: "spray", ar: "المطهرات", en: "Disinfectants", use: { ar: "للمنشآت الصحية والعامة", en: "For healthcare & public facilities" } },
  { icon: "brush", ar: "منظفات الأرضيات", en: "Floor cleaners", use: { ar: "للأرضيات بمختلف أنواعها", en: "For all floor types" } },
  { icon: "toilet", ar: "جل تنظيف دورات المياه", en: "Toilet cleaning gel", use: { ar: "إزالة الترسبات والروائح", en: "Removes scale & odours" } },
  { icon: "dish", ar: "منظفات الزجاج والأطباق", en: "Glass & dish liquids", use: { ar: "للمطابخ والمرافق", en: "For kitchens & facilities" } },
  { icon: "hand", ar: "صابون الأيدي", en: "Hand soap", use: { ar: "لطيف على البشرة", en: "Gentle on skin" } },
];

export const CUSTOM = {
  title: { ar: "التصنيع لعلامتك الخاصة (Private Label)", en: "Private label manufacturing" },
  body: {
    ar: "نصنّع ونعبّئ المنتجات باسم علامتك التجارية، مع تركيبات خاصة حسب متطلباتك.",
    en: "We manufacture and fill products under your brand, with custom formulations to your specification.",
  },
};

export const REQUEST_TYPES: L[] = [
  { ar: "عرض سعر لمنتجات", en: "Product quote" },
  { ar: "تصنيع لعلامة خاصة (Private Label)", en: "Private label manufacturing" },
  { ar: "تركيبة خاصة", en: "Custom formulation" },
  { ar: "توريد حكومي / مؤسسي", en: "Government / institutional supply" },
];

// Al-Sakhra's own brands. Optional `logo`: put the logo in public/brands/ and set
// e.g. logo: "/brands/oxin.png" — it replaces the text wordmark.
// Optional `about`: a one-line description in both languages.
export const BRANDS: { name: string; logo?: string; about?: L }[] = [
  { name: "Oxin" },
  { name: "Keen" },
];

export const SECTORS: (L & { icon: string })[] = [
  { icon: "factory", ar: "المصانع والمنشآت الصناعية", en: "Factories & industrial facilities" },
  { icon: "hospital", ar: "المستشفيات والمنشآت الصحية", en: "Hospitals & healthcare" },
  { icon: "bed", ar: "الفنادق والضيافة", en: "Hotels & hospitality" },
  { icon: "utensils", ar: "المطاعم والمطابخ المركزية", en: "Restaurants & central kitchens" },
  { icon: "school", ar: "المرافق التعليمية والتجارية", en: "Schools & commercial facilities" },
  { icon: "wrench", ar: "شركات التشغيل والصيانة", en: "Operation & maintenance companies" },
];

export const GOV = {
  eyebrow: { ar: "التوريد المؤسسي والحكومي", en: "Institutional & government supply" },
  title: { ar: "كميات كبيرة، في الوقت المحدد", en: "Large volumes, delivered on time" },
  body: {
    ar: "حلول توريد متكاملة ومستدامة للجهات الحكومية والمؤسسات الكبرى، مع الامتثال التام لاشتراطات المحتوى المحلي.",
    en: "Integrated, sustainable supply for government agencies and large institutions, fully compliant with Local Content requirements.",
  },
};

export const WHY: (L & { icon: string })[] = [
  { icon: "gauge", ar: "طاقة إنتاجية عالية لتلبية الطلبات الكبيرة", en: "High capacity for large-volume orders" },
  { icon: "clock", ar: "التزام تام بالمواعيد ودقة التسليم", en: "On-schedule, accurate delivery" },
  { icon: "banknote", ar: "أسعار تنافسية ودعم فني مستمر", en: "Competitive pricing & ongoing technical support" },
  { icon: "flask", ar: "مرونة في التركيبات الخاصة", en: "Flexible custom formulations" },
];

// Clients / partners. Add logos to public/clients/ and list them here, e.g.
// { name: "King Fahad Hospital", logo: "/clients/kfh.png" }
// The "Trusted by" strip appears on the site automatically once this list has entries.
export const CLIENTS: { name: string; logo: string }[] = [];

// Social media links (leave empty to hide). Example: { name: "LinkedIn", href: "https://linkedin.com/company/..." }
export const SOCIAL: { name: string; href: string }[] = [];
