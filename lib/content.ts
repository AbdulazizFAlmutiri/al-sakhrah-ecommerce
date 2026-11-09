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
    ar: "نصنع المنظفات والمطهرات ومستحضرات العناية في الخرج",
    en: "We make detergents, disinfectants and care products in Al-Kharj",
  },
  sub: {
    ar: "منتجاتنا معتمدة، ونورّدها للمنشآت والجهات الحكومية والقطاع الخاص. ونصنّع أيضًا تحت علامتك التجارية، من التصنيع حتى التسليم.",
    en: "Our products are certified, and we supply facilities, government bodies and private companies. We also manufacture under your own brand and handle everything through to delivery.",
  },
};

// Optional `file`: put a certificate scan (PDF or image) in public/certificates/
// and set e.g. file: "/certificates/iso-9001.pdf" — a "View certificate" link appears.
export const CERTS: { code: string; label: L; body: L; icon: string; file?: string }[] = [
  {
    code: "ISO 9001", icon: "badge",
    label: { ar: "شهادة الأيزو 9001", en: "ISO 9001 certified" },
    body: {
      ar: "كل دفعة إنتاج تمر بنفس خطوات الفحص الموثقة، من التصنيع والتعبئة حتى الفحص النهائي.",
      en: "Every batch goes through the same documented checks, from production and filling to final inspection.",
    },
  },
  {
    code: "SFDA", icon: "shield",
    label: { ar: "ترخيص هيئة الغذاء والدواء", en: "SFDA approved" },
    body: {
      ar: "منتجاتنا مطابقة لاشتراطات السلامة والتصنيع في المملكة.",
      en: "Our products meet the Kingdom's safety and manufacturing requirements.",
    },
  },
  {
    code: "LCGPA", icon: "building",
    label: { ar: "شهادة المحتوى المحلي", en: "Local Content certified" },
    body: {
      ar: "الشراء منا يمنحكم أفضلية في المنافسات الحكومية وبرامج توطين سلاسل الإمداد.",
      en: "Buying from us gives you preference in government tenders and supply-chain localisation programmes.",
    },
  },
  {
    code: "MIM", icon: "landmark",
    label: { ar: "الترخيص الصناعي الرسمي", en: "Official industrial licence" },
    body: {
      ar: "مرخّصون من وزارة الصناعة والثروة المعدنية لتصنيع المنظفات والمستحضرات.",
      en: "Licensed by the Ministry of Industry and Mineral Resources to make detergents.",
    },
  },
  {
    code: "Saudi Made", icon: "award",
    label: { ar: "صناعة سعودية", en: "Saudi Made" },
    body: {
      ar: "منتجاتنا تحمل شعار برنامج «صنع في السعودية».",
      en: "Our products carry the \"Made in Saudi\" mark.",
    },
  },
];

export const ABOUT = {
  title: { ar: "من نحن", en: "Who we are" },
  body: {
    ar: "نحن مصنع سعودي في المدينة الصناعية بالخرج، نصنع المنظفات ومستحضرات العناية. بدأنا مع التوسع الصناعي الذي جاءت به رؤية 2030، ونبيع منتجاتنا داخل المملكة وخارجها. الجودة عندنا هي الأساس في كل طلب.",
    en: "We are a Saudi factory in Al-Kharj Industrial City that makes detergents and care products. We started during the industrial growth that came with Vision 2030, and we sell in the Kingdom and abroad. Quality comes first in every order.",
  },
  vision: {
    title: { ar: "رؤيتنا", en: "Vision" },
    body: {
      ar: "أن نكون أكثر مصنع منظفات ومستحضرات عناية يثق به العملاء في المنطقة.",
      en: "To be the detergent and personal care factory that customers in the region trust most.",
    },
  },
  mission: {
    title: { ar: "رسالتنا", en: "Mission" },
    body: {
      ar: "نصنع منتجات آمنة وعالية الجودة بدقة، ونطوّر تركيباتنا باستمرار، ونلبّي طلبات السوق بسرعة.",
      en: "We make safe, high-quality products with care, keep improving our formulas, and respond quickly to what the market needs.",
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
  { icon: "droplet", image: "/products/bleach.jpg", ar: "الكلور", en: "Chlorine bleach", use: { ar: "تبييض وتعقيم الأسطح", en: "Whitening & surface sanitising" } },
  { icon: "spray", image: "/products/disinfectant.jpg", ar: "المطهرات", en: "Disinfectants", use: { ar: "للمنشآت الصحية والعامة", en: "For healthcare & public facilities" } },
  { icon: "brush", image: "/products/floor-cleaner.jpg", ar: "منظفات الأرضيات", en: "Floor cleaners", use: { ar: "للأرضيات بمختلف أنواعها", en: "For all floor types" } },
  { icon: "toilet", image: "/products/toilet-gel.jpg", ar: "جل تنظيف دورات المياه", en: "Toilet cleaning gel", use: { ar: "إزالة الترسبات والروائح", en: "Removes scale & odours" } },
  { icon: "dish", image: "/products/dish-liquid.jpg", ar: "منظفات الزجاج والأطباق", en: "Glass & dish liquids", use: { ar: "للمطابخ والمرافق", en: "For kitchens & facilities" } },
  { icon: "hand", image: "/products/hand-soap.jpg", ar: "صابون الأيدي", en: "Hand soap", use: { ar: "لطيف على البشرة", en: "Gentle on skin" } },
];

export const CUSTOM = {
  title: { ar: "التصنيع لعلامتك الخاصة (Private Label)", en: "Private label manufacturing" },
  body: {
    ar: "عندك علامة تجارية؟ نصنّع المنتج ونعبّئه باسمها، ونجهّز تركيبة خاصة إذا احتجت.",
    en: "Have your own brand? We make and fill the product under its name, and prepare a custom formula if you need one.",
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
export type Brand = {
  name: string;
  nameAr: string;
  logo: string;
  style: "light" | "gradient";
  about: L;
  products: L[];
  catalog: string;
  store?: string;
};

export const BRANDS: Brand[] = [
  {
    name: "Oxin",
    nameAr: "أوكسين",
    logo: "/brands/oxin.png",
    style: "light",
    about: { ar: "منظفات للمنزل والغسيل.", en: "Cleaning products for the home and laundry." },
    products: [
      { ar: "مطهر ومنظف الأسطح والأرضيات 3 لتر (4 روائح)", en: "Surface & floor disinfectant 3L (4 scents)" },
      { ar: "شامبو العباية 2 لتر", en: "Abaya shampoo 2L" },
      { ar: "شامبو الملابس 2 لتر", en: "Clothes shampoo 2L" },
      { ar: "منعم ومعطر الملابس 2 لتر", en: "Fabric softener 2L" },
      { ar: "منظف فعّال للأسطح والأرضيات", en: "Active surface & floor cleaner" },
      { ar: "صابون اليدين 2.2 لتر", en: "Liquid hand soap 2.2L" },
    ],
    catalog: "/catalogs/oxin-catalog-2026.pdf",
    store: "https://oxin.sa",
  },
  {
    name: "Keen",
    nameAr: "كين",
    logo: "/brands/keen-white.png",
    style: "gradient",
    about: { ar: "منتجات تنظيف للاستخدام اليومي في البيت والمنشآت.", en: "Everyday cleaning products for homes and facilities." },
    products: [
      { ar: "منظف الصحون", en: "Dishwashing liquid" },
      { ar: "منظف الزجاج", en: "Glass cleaner" },
      { ar: "صابون اليد", en: "Hand soap" },
      { ar: "منظف ومبيض الملابس", en: "Liquid bleach" },
      { ar: "مسحوق غسيل الملابس", en: "Laundry powder" },
      { ar: "منظف ومطهر الأرضيات", en: "Floor cleaner & disinfectant" },
      { ar: "سوبر جل وكين فلاش", en: "Super gel & Flash toilet cleaner" },
      { ar: "مطهر عام ومزيل الدهون", en: "Disinfectant & degreaser" },
      { ar: "شامبو العباية والسجاد والملابس", en: "Abaya, carpet & clothes shampoo" },
      { ar: "منعم ومعطر الملابس", en: "Fabric softener" },
    ],
    catalog: "/catalogs/keen-catalog.pdf",
  },
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
    ar: "نورّد للجهات الحكومية والمؤسسات الكبيرة بشكل منتظم، ومنتجاتنا مطابقة لاشتراطات المحتوى المحلي.",
    en: "We supply government bodies and large institutions on a regular basis, and our products meet Local Content requirements.",
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
