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

  document.querySelectorAll("[data-request-type]").forEach(function (el) {
    el.addEventListener("click", function () {
      var sel = document.getElementById("q-type");
      if (sel) sel.selectedIndex = Number(el.getAttribute("data-request-type"));
    });
  });

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      function done() {
        var l = btn.querySelector("[data-copy-label]"), d = btn.querySelector("[data-copy-done]");
        if (l && d) { l.hidden = true; d.hidden = false; setTimeout(function () { l.hidden = false; d.hidden = true; }, 2000); }
      }
      function fallback() {
        var t = document.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); done(); } catch (e) { window.prompt("", text); }
        document.body.removeChild(t);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    });
  });

  var form = document.getElementById("quote-form");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var ar = root.getAttribute("data-lang") === "ar";
    var lines = ar
      ? ["طلب عرض سعر من الموقع", "الاسم: " + d.get("name"), "الجهة: " + d.get("company"), "نوع الطلب: " + d.get("type"), "القطاع: " + d.get("sector"), "التفاصيل: " + d.get("details")].concat(d.get("sds") ? ["يرجى إرسال نشرات بيانات السلامة (SDS) والمواصفات الفنية"] : [])
      : ["Quote request from the website", "Name: " + d.get("name"), "Company: " + d.get("company"), "Request type: " + d.get("type"), "Sector: " + d.get("sector"), "Details: " + d.get("details")].concat(d.get("sds") ? ["Please include safety data sheets (SDS) and technical specs"] : []);
    var url = "https://wa.me/" + form.getAttribute("data-wa") + "?text=" + encodeURIComponent(lines.join("\\n"));
    window.open(url, "_blank", "noopener");
    var link = document.getElementById("quote-fallback");
    if (link) { link.href = url; link.hidden = false; }
  });
})();
`;
