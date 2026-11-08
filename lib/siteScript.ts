// Plain-JS behaviour for the page: language switch, sticky header, mobile menu,
// and the quote form (which opens WhatsApp with the details filled in).
// Kept framework-free so the same code also runs in a static preview.

export const SITE_SCRIPT = `
(function () {
  var root = document.documentElement;
  var KEY = "alsakhra-lang";

  function setLang(lang) {
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);
    root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    document.querySelectorAll("[data-ph-ar]").forEach(function (el) {
      el.setAttribute("placeholder", el.getAttribute("data-ph-" + lang));
    });
  }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  setLang(saved === "en" ? "en" : "ar");
  document.querySelectorAll("[data-lang-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      setLang(root.getAttribute("data-lang") === "ar" ? "en" : "ar");
    });
  });

  var header = document.getElementById("site-header");
  var menu = document.getElementById("mobile-menu");
  var menuBtn = document.getElementById("menu-btn");
  function paint() {
    var solid = window.scrollY > 24 || (menu && !menu.hidden);
    header.setAttribute("data-solid", solid ? "true" : "false");
  }
  function setMenu(open) {
    if (!menu) return;
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    paint();
  }
  if (menuBtn) menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
  if (menu) menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  window.addEventListener("scroll", paint, { passive: true });
  paint();

  var form = document.getElementById("quote-form");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var ar = root.getAttribute("data-lang") === "ar";
    var lines = ar
      ? ["طلب عرض سعر من الموقع", "الاسم: " + d.get("name"), "الجهة: " + d.get("company"), "القطاع: " + d.get("sector"), "التفاصيل: " + d.get("details")].concat(d.get("sds") ? ["يرجى إرسال نشرات بيانات السلامة (SDS) والمواصفات الفنية"] : [])
      : ["Quote request from the website", "Name: " + d.get("name"), "Company: " + d.get("company"), "Sector: " + d.get("sector"), "Details: " + d.get("details")].concat(d.get("sds") ? ["Please include safety data sheets (SDS) and technical specs"] : []);
    var url = "https://wa.me/" + form.getAttribute("data-wa") + "?text=" + encodeURIComponent(lines.join("\\n"));
    window.open(url, "_blank", "noopener");
    var link = document.getElementById("quote-fallback");
    if (link) { link.href = url; link.hidden = false; }
  });
})();
`;
