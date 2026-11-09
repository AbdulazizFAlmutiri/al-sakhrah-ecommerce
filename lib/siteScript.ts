// Plain-JS behaviour for the page: sticky header, mobile menu, email menu,
// and the quote form (which opens WhatsApp with the details filled in).
// Kept framework-free so the same code also runs in a static preview.

export const SITE_SCRIPT = `
(function () {
  var root = document.documentElement;
  // The page language comes from the URL (/ = Arabic, /en = English) and is set
  // on <html data-lang> by the server; only form placeholders need swapping here.
  var lang = root.getAttribute("data-lang") || "ar";
  document.querySelectorAll("[data-ph-ar]").forEach(function (el) {
    el.setAttribute("placeholder", el.getAttribute("data-ph-" + lang));
  });

  var header = document.getElementById("site-header");
  var menu = document.getElementById("mobile-menu");
  var menuBtn = document.getElementById("menu-btn");
  function paint() {
    var solid = window.scrollY > 24 || (menu && !menu.hidden);
    if (header) header.setAttribute("data-solid", solid ? "true" : "false");
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

  // Email menu: slide open on tap, close on outside tap or Escape.
  document.querySelectorAll("[data-email-menu]").forEach(function (box) {
    var toggle = box.querySelector("[data-email-toggle]");
    var options = box.querySelectorAll("[data-email-option]");
    function set(open) {
      box.setAttribute("data-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", String(open));
      options.forEach(function (o) { o.tabIndex = open ? 0 : -1; });
    }
    toggle.addEventListener("click", function () { set(box.getAttribute("data-open") !== "true"); });
    document.addEventListener("click", function (e) { if (!box.contains(e.target)) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
    box.querySelectorAll("a[data-email-option]").forEach(function (a) {
      a.addEventListener("click", function () { setTimeout(function () { set(false); }, 150); });
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
