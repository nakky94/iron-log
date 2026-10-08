(function () {
  function css() {
    var s = document.getElementById("trainFix");
    if (!s) { s = document.createElement("style"); s.id = "trainFix"; document.head.appendChild(s); }
    s.textContent = [
      "#trainDock,#continueBox,#restBar,#sessStrip,.rir-row,.step,.step-wrap button,.wu-chip,.move-acts,.ghost-set{display:none!important}",
      "#view-workout .step-wrap{display:contents!important}",
      "#view-workout{padding:8px 12px calc(var(--nav-h) + var(--safe-b) + 16px)!important}",
      "#view-workout #sessName{background:transparent;border:0;font-size:18px;font-weight:700;padding:2px 0 8px}",
      "#view-workout .card{padding:10px 12px;margin:0 0 8px;border-radius:14px}",
      "#view-workout .ex-name{font-size:15px}",
      "#view-workout .tiny{font-size:11px}",
      "#view-workout .set-grid{display:grid!important;grid-template-columns:18px 1fr 64px 40px!important;gap:6px;margin-top:6px}",
      "#view-workout .set-grid.tiny{display:none!important}",
      "#view-workout .set-grid input{height:40px;font-size:16px;font-weight:700;text-align:center;background:#0a0a0a;border:1px solid #222;border-radius:10px}",
      "#view-workout [data-act='toggle-set']{width:40px!important;height:40px!important}",
      "#view-workout [data-act='add-set']{padding:6px 0;font-size:13px}"
    ].join("");
  }
  function strip() {
    ["trainDock", "continueBox", "restBar", "sessStrip"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.remove();
    });
    document.querySelectorAll("#view-workout button, #view-workout .card").forEach(function (el) {
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (/^continue/i.test(t) && el.querySelectorAll(".set-grid").length === 0) el.remove();
    });
  }
  css();
  strip();
  document.addEventListener("click", function () { setTimeout(strip, 40); });
  var view = document.getElementById("view-workout");
  if (view) new MutationObserver(function () { strip(); }).observe(view, { childList: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { css(); strip(); });
})();
