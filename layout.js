(function () {
  if (!document.querySelector('script[src="delfix.js"]')) {
    var d = document.createElement("script");
    d.src = "delfix.js";
    document.head.appendChild(d);
  }
  function styles() {
    var s = document.getElementById("layoutFixStyle");
    if (!s) { s = document.createElement("style"); s.id = "layoutFixStyle"; document.head.appendChild(s); }
    s.textContent =
      "#view-history .card{padding:10px 12px;margin-bottom:6px;overflow:hidden}" +
      "#view-history .log-acts{display:flex;gap:4px;margin-top:8px}" +
      "#view-history .log-acts .btn{float:none!important;flex:1;width:auto!important;max-width:none!important;min-width:0;padding:6px 4px;min-height:34px;height:34px;font-size:12px;border-radius:10px}" +
      "#view-library .card .btn{float:none;width:auto!important;min-width:56px;padding:6px 10px;min-height:34px}" +
      "#view-workout .card{position:relative;padding:12px 12px 10px}" +
      "#view-workout .card > .btn.warn,#view-workout .card > [data-act='remove-ex']{position:absolute;top:8px;right:8px;width:36px!important;min-width:36px;max-width:36px;padding:6px;min-height:36px}" +
      "#view-workout .ex-name{padding-right:44px}" +
      "#view-workout .set-grid{grid-template-columns:22px minmax(108px,1.35fr) minmax(70px,.9fr) 44px 28px;gap:5px;align-items:center}" +
      "#view-workout .step-wrap{display:flex;align-items:center;gap:3px;min-width:0}" +
      "#view-workout .step{width:28px;min-width:28px;height:40px;padding:0;font-size:16px}" +
      "#view-workout .step-wrap input,#view-workout .set-grid input{min-width:0;flex:1;padding:8px 4px;min-height:40px;font-size:16px}" +
      "#view-workout .ghost-set{grid-column:1/-1;margin:0;padding:0 0 2px 22px}" +
      "#view-workout [data-act='toggle-set']{width:44px;height:44px;border-radius:12px;background:#2a2a2a;border:1px solid #444;color:#111}" +
      "#view-workout [data-act='toggle-set']:not(.ghost){background:#FFD400;border-color:#FFD400}" +
      "#view-workout [data-act='del-set']{width:28px;min-height:40px}";
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
    ["view-home", "view-library", "view-history", "view-workout"].forEach(function (id) {
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
