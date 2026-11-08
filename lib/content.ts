// All site copy lives here (English + Arabic), taken from the company profile.
// Edit this file to update text, contact details, products, etc.

export const CONTACT = {
  phoneDisplay: "+966 55 626 8175",
  phoneHref: "tel:+966556268175",
  whatsappHref: "https://wa.me/966556268175",
  email: "info@alsakhrah.com",
  addressEn: "Industrial City in Al-Kharj, Kingdom of Saudi Arabia",
  addressAr: "المدينة الصناعية في الخرج، المملكة العربية السعودية",
  mapHref: "https://www.google.com/maps/search/?api=1&query=Al-Kharj+Industrial+City+Saudi+Arabia",
};

export const NAV = [
  { href: "#about", en: "About", ar: "من نحن" },
  { href: "#vision", en: "Vision", ar: "رؤيتنا" },
  { href: "#quality", en: "Quality", ar: "الجودة" },
  { href: "#products", en: "Products", ar: "منتجاتنا" },
  { href: "#sectors", en: "Sectors", ar: "القطاعات" },
  { href: "#contact", en: "Contact", ar: "تواصل معنا" },
];

export const VALUES = [
  { icon: "award", en: "Professionalism & Quality", ar: "الاحترافية والجودة" },
  { icon: "eye", en: "Clarity & Transparency", ar: "الوضوح والشفافية" },
  { icon: "shield", en: "Safety & Discipline", ar: "السلامة والانضباط" },
  { icon: "factory", en: "Pride in Local Industry", ar: "الفخر بالصناعة الوطنية" },
] as const;

export const CERTIFICATIONS = [
  {
    icon: "badge",
    code: "ISO 9001",
    tag: "ISO 9001 Certified",
    titleAr: "شهادة الأيزو 9001",
    bodyAr: "نظام إدارة جودة موثق يضبط مراحل التصنيع والتعبئة والفحص النهائي لكل دفعة إنتاج.",
    bodyEn: "A documented quality management system governing manufacturing, filling and final inspection of every batch.",
  },
  {
    icon: "shield",
    code: "SFDA",
    tag: "SFDA Approved",
    titleAr: "ترخيص هيئة الغذاء والدواء",
    bodyAr: "اعتماد رسمي يؤكد مطابقة منتجاتنا لاشتراطات السلامة والتصنيع المعتمدة في المملكة.",
    bodyEn: "Official approval confirming our products meet the Kingdom's safety and manufacturing requirements.",
  },
  {
    icon: "building",
    code: "LCGPA",
    tag: "Local Content Certified",
    titleAr: "شهادة المحتوى المحلي",
    bodyAr: "تصنيف معتمد يمنح شركاءنا أفضلية في المنافسات الحكومية وبرامج توطين سلاسل الإمداد.",
    bodyEn: "Certified classification giving our partners preference in government tenders and supply-chain localisation programmes.",
  },
  {
    icon: "landmark",
    code: "MIM",
    tag: "Official Industrial License",
    titleAr: "الترخيص الصناعي الرسمي",
    bodyAr: "ترخيص صادر عن وزارة الصناعة والثروة المعدنية يغطي نشاط تصنيع المنظفات والمستحضرات.",
    bodyEn: "Licence issued by the Ministry of Industry and Mineral Resources covering detergent and preparation manufacturing.",
  },
] as const;

export const PRODUCTS = [
  { icon: "droplet", en: "Chlorine bleach", ar: "الكلور" },
  { icon: "spray", en: "Disinfectants", ar: "المطهرات" },
  { icon: "brush", en: "Floor cleaners", ar: "منظفات الأرضيات" },
  { icon: "toilet", en: "Toilet cleaning gel", ar: "جل تنظيف دورات المياه" },
  { icon: "dish", en: "Glass & dishwashing liquids", ar: "منظفات الزجاج والأطباق" },
  { icon: "hand", en: "Hand soap", ar: "صابون الأيدي" },
] as const;

export const SECTORS = [
  { icon: "factory", en: "Factories & Industrial Facilities", ar: "المصانع والمنشآت الصناعية" },
  { icon: "hospital", en: "Hospitals & Healthcare", ar: "المستشفيات والمنشآت الصحية" },
  { icon: "bed", en: "Hotels & Hospitality", ar: "الفنادق والضيافة" },
  { icon: "utensils", en: "Restaurants & Central Kitchens", ar: "المطاعم والمطابخ المركزية" },
  { icon: "school", en: "Schools & Commercial Facilities", ar: "المرافق التعليمية" },
  { icon: "wrench", en: "Operation & Maintenance Companies", ar: "شركات التشغيل والصيانة" },
] as const;

export const WHY = [
  { icon: "gauge", en: "High production capacity, able to absorb large-volume orders.", ar: "طاقة إنتاجية عالية وقدرة على تلبية الطلبات الكبيرة." },
  { icon: "clock", en: "Full commitment to schedules and accurate delivery.", ar: "التزام تام بالمواعيد ودقة التسليم." },
  { icon: "banknote", en: "Competitive pricing with continuous technical support.", ar: "أسعار تنافسية ودعم فني مستمر للعملاء." },
  { icon: "flask", en: "High flexibility in meeting custom formulation requirements.", ar: "مرونة عالية في تلبية متطلبات التركيبات الخاصة للعملاء." },
] as const;
