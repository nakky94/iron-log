(function () {
  function css() {
    var s = document.getElementById("trainFix");
    if (!s) { s = document.createElement("style"); s.id = "trainFix"; document.head.appendChild(s); }
    s.textContent = [
      "#view-workout .set-grid{display:flex!important;flex-wrap:wrap;align-items:center;gap:8px;grid-template-columns:none!important}",
      "#view-workout .set-grid.tiny{display:none!important}",
      "#view-workout .set-grid > div:first-child{width:22px;flex:0 0 22px;font-weight:700}",
      "#view-workout .kg-step{display:flex;flex:1 1 140px;gap:4px;align-items:center;min-width:0}",
      "#view-workout .kg-step input,#view-workout .set-grid input{flex:1;min-width:0;height:48px;text-align:center;font-size:18px;font-weight:700}",
      "#view-workout .kg-step button{width:40px;height:48px;border-radius:12px;background:#1c1c1c;border:1px solid #2a2a2e;flex:0 0 40px}",
      "#view-workout [data-act='toggle-set']{width:48px!important;height:48px!important;flex:0 0 48px;border-radius:12px}",
      "#view-workout .wu-chip,#view-workout .ghost-set,#view-workout [data-act='del-set'],#view-workout .move-acts{display:none!important}",
      "#view-workout .rir-row{display:flex!important;gap:8px;margin-top:8px}",
      "#view-workout .rir-row button{flex:0 0 40px;min-height:36px}",
      "#restBar{margin-bottom:10px}",
      "#trainDock{position:fixed!important;left:50%;transform:translateX(-50%);bottom:calc(var(--nav-h) + var(--safe-b) + 8px);width:calc(100% - 24px);max-width:496px;z-index:28}",
      "body:not(.train-on) #trainDock{display:none!important}"
    ].join("");
  }
  css();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", css);
})();
