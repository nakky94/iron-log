(function () {
  function css() {
    var s = document.getElementById("trainFix");
    if (!s) { s = document.createElement("style"); s.id = "trainFix"; document.head.appendChild(s); }
    s.textContent = [
      ".nav button span{display:none!important}",
      "#trainDock,#restBar,#continueBox,#sessStrip,.rir-row,.wu-chip,.move-acts,.ghost-set,#view-workout [data-act='del-set'],#view-workout [data-act='start-timer'],#view-workout [data-act='rest-pref']{display:none!important}",
      "#view-workout{padding:12px 16px calc(var(--nav-h) + var(--safe-b) + 24px)!important}",
      "#view-workout #sessName{background:transparent;border:0;font-size:20px;font-weight:700;padding:4px 0 12px}",
      "#view-workout .card{background:#141414;border:1px solid #1e1e1e;border-radius:18px;padding:14px;margin:0 0 12px}",
      "#view-workout .ex-name{font-size:16px;padding-right:28px}",
      "#view-workout .tiny{margin-top:2px}",
      "#view-workout .set-grid{display:grid!important;grid-template-columns:22px 1fr 72px 44px!important;gap:8px;align-items:center;margin-top:8px}",
      "#view-workout .set-grid.tiny{display:none!important}",
      "#view-workout .kg-step{display:contents!important}",
      "#view-workout .kg-step button{display:none!important}",
      "#view-workout .set-grid input{height:48px;text-align:center;font-size:18px;font-weight:700;background:#0a0a0a;border:1px solid #222;border-radius:12px}",
      "#view-workout [data-act='toggle-set']{width:44px!important;height:44px!important;border-radius:12px}",
      "#view-workout [data-act='add-set']{width:auto;background:transparent!important;border:0!important;color:#8d8d8d!important;padding:10px 0;font-weight:600}",
      "#view-workout [data-act='rm-move']{position:absolute;top:12px;right:12px;width:32px;height:32px}",
      "#view-workout #sessNotes{margin-top:8px;min-height:72px}",
      "#view-workout [data-act='finish']{margin-top:12px}",
      "#view-workout [data-act='save-template'],#view-workout [data-act='discard']{background:transparent!important;border:0!important;color:#8d8d8d!important}"
    ].join("");
  }
  css();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", css);
})();
