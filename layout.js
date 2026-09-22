(function () {
  function styles() {
    var s = document.getElementById("layoutFixStyle");
    if (!s) { s = document.createElement("style"); s.id = "layoutFixStyle"; document.head.appendChild(s); }
    s.textContent =
      "#view-history .card{padding:10px 12px;margin-bottom:6px;overflow:hidden}" +
      "#view-history .card .ex-name{display:block;width:100%;font-size:15px}" +
      "#view-history .card .tiny{font-size:11px}" +
      "#view-history .card .row{margin-top:4px!important}" +
      "#view-history .log-acts{display:flex;gap:4px;margin-top:8px}" +
      "#view-history .log-acts .btn{float:none!important;flex:1;width:auto!important;max-width:none!important;min-width:0;padding:6px 4px;min-height:34px;height:34px;font-size:12px;border-radius:10px}" +
      "#view-history .card > .btn{float:none!important}" +
      "#view-library .card{padding:10px 12px;margin-bottom:6px}" +
      "#view-library .card .btn{float:none;width:auto!important;min-width:56px;padding:6px 10px;min-height:34px}" +
      "#view-history .chips .chip,#view-library .chip{min-height:34px;padding:6px 11px}" +
      ".card{padding:10px 12px;margin-bottom:6px}" +
      ".stats{margin:2px 0 6px;gap:4px}" +
      ".stat{padding:6px 4px}";
  }
  function hideJunk(view) {
    if (!view) return;
    Array.prototype.slice.call(view.querySelectorAll("button, .tiny, .btn")).forEach(function (el) {
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (/^start empty/i.test(t) || /^quick add/i.test(t) || /^browse dumbbell/i.test(t) || /^repeat /i.test(t)) {
        el.style.display = "none";
      }
    });
  }
  function tidyLog() {
    var view = document.getElementById("view-history");
    if (!view) return;
    Array.prototype.slice.call(view.querySelectorAll(".card")).forEach(function (card) {
      if (card.querySelector(".log-acts")) return;
      var btns = Array.prototype.slice.call(card.querySelectorAll(".btn"));
      if (!btns.length) return;
      var row = document.createElement("div");
      row.className = "log-acts";
      btns.forEach(function (b) { row.appendChild(b); });
      card.appendChild(row);
    });
  }
  function run() {
    styles();
    hideJunk(document.getElementById("view-home"));
    tidyLog();
  }
  var t = null;
  function schedule() {
    if (t) return;
    t = setTimeout(function () { t = null; run(); }, 60);
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
