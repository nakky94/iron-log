(function () {
  if (!document.querySelector('script[src="delfix.js"]')) {
    var d = document.createElement("script");
    d.src = "delfix.js";
    document.head.appendChild(d);
  }
  function styles() {
    var s = document.getElementById("layoutFixStyle");
    if (!s) { s = document.createElement("style"); s.id = "layoutFixStyle"; document.head.appendChild(s); }
    s.textContent = [
      "html,body{background:#0a0a0a}",
      "header.top{padding:calc(10px + var(--safe-t)) 16px 10px;border-bottom:1px solid #161616}",
      ".card{background:#141414;border:1px solid #1e1e1e;border-radius:18px;padding:14px;margin-bottom:10px}",
      ".tiny{font-size:11px;color:#8d8d8d}",
      ".ex-name{font-size:16px;font-weight:700}",
      ".stats{gap:8px;margin:4px 0 12px}",
      ".stat{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:68px;padding:10px 6px;background:#141414;border:1px solid #1e1e1e;border-radius:16px}",
      ".stat b{display:block;font-size:18px;line-height:1.1;font-variant-numeric:tabular-nums}",
      ".stat .tiny{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;color:#7a7a7a}",
      ".stat-accent{background:#141414;border-color:#1e1e1e}",
      ".chip{background:#161616;border:1px solid #222;min-height:36px;padding:7px 12px}",
      "#view-home #backupNag,#view-home .backup-banner{display:none!important}",
      "#view-library .card .btn{float:none;width:auto!important;min-width:64px;padding:8px 14px;min-height:36px;border-radius:12px}",
      "#view-history .card .btn{float:none!important;max-width:none!important}",
      "#view-history .log-acts{display:flex;gap:6px;margin-top:10px}",
      "#view-history .log-acts .btn{flex:1;width:auto!important;min-width:0;padding:7px 4px;min-height:36px;height:36px;font-size:12px;border-radius:11px}",
      "#view-workout .card{position:relative}",
      "#view-workout .card > .btn.warn,#view-workout .card > [data-act='remove-ex']{position:absolute;top:10px;right:10px;width:34px!important;min-width:34px;max-width:34px;padding:4px;min-height:34px}",
      "#view-workout .ex-name{padding-right:40px}",
      "#view-workout .set-grid{grid-template-columns:28px minmax(0,1fr) 64px 44px;gap:6px}",
      "#view-workout .step{width:36px;min-width:36px;height:40px;border-radius:10px;background:#1c1c1c}",
      "#view-workout .step-wrap input,#view-workout .set-grid input{min-height:40px;padding:8px 4px}",
      "#view-workout .ghost-set{display:none}",
      "#view-workout [data-act='toggle-set']{width:44px;height:44px;border-radius:12px;background:#1c1c1c;border:1px solid #333}",
      "#view-workout [data-act='toggle-set']:not(.ghost){background:#f4f4f5;border-color:#f4f4f5;color:#111}",
      "#view-workout.empty-train #restBar,#view-workout.empty-train .rir-row,#view-workout.empty-train #sessBar,#view-workout.empty-train #continueBox{display:none!important}",
      ".sess-bar,.rest-bar{background:#141414;border:1px solid #1e1e1e;border-radius:16px}",
      ".nav{background:#0a0a0a;border-top-color:#161616}",
      "#view-home [data-act='start-fresh']{display:none!important}"
    ].join("");
  }
  function hideJunk(view) {
    if (!view) return;
    Array.prototype.slice.call(view.querySelectorAll("button, .tiny, .btn")).forEach(function (el) {
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (/^start empty/i.test(t) || /^quick add/i.test(t) || /^browse dumbbell/i.test(t)) el.style.display = "none";
    });
  }
  function tidyTrain() {
    var view = document.getElementById("view-workout");
    if (!view) return;
    view.classList.toggle("empty-train", view.querySelectorAll(".set-grid").length === 0);
  }
  function run() { styles(); hideJunk(document.getElementById("view-home")); tidyTrain(); }
  var t = null;
  function schedule() { if (t) return; t = setTimeout(function () { t = null; run(); }, 80); }
  function boot() {
    ["view-home", "view-library", "view-history", "view-workout"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) new MutationObserver(schedule).observe(n, { childList: true });
    });
    run();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
