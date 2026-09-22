(function () {
  function hideJunk(view) {
    if (!view) return;
    Array.prototype.slice.call(view.querySelectorAll("button, .tiny, .btn")).forEach(function (el) {
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (/^start empty/i.test(t) || /^quick add/i.test(t) || /^browse dumbbell/i.test(t) || /^repeat /i.test(t)) {
        el.style.display = "none";
        if (el.parentNode && el.parentNode !== view && el.parentNode.childElementCount === 1) el.parentNode.style.display = "none";
      }
    });
  }
  function compact(view) {
    if (!view) return;
    Array.prototype.slice.call(view.querySelectorAll(".card .btn, .card button.btn")).forEach(function (b) {
      b.style.width = "auto";
      b.style.minWidth = "72px";
      b.style.padding = "8px 12px";
      b.style.minHeight = "40px";
      b.style.flex = "0 0 auto";
      b.style.position = "relative";
      b.style.zIndex = "1";
    });
  }
  function run() {
    hideJunk(document.getElementById("view-home"));
    compact(document.getElementById("view-library"));
    compact(document.getElementById("view-history"));
  }
  var t = null;
  function schedule() {
    if (t) return;
    t = setTimeout(function () { t = null; run(); }, 50);
  }
  function boot() {
    ["view-home", "view-library", "view-history"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) new MutationObserver(schedule).observe(n, { childList: true });
    });
    run();
    if (!document.querySelector('script[src="sesspause.js"]')) {
      var s = document.createElement("script");
      s.src = "sesspause.js";
      document.body.appendChild(s);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
