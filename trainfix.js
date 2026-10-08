(function () {
  var css = document.getElementById("trainHide");
  if (!css) { css = document.createElement("style"); css.id = "trainHide"; document.head.appendChild(css); }
  css.textContent = [
    "#trainDock,#continueBox,#restBar,.rir-row,.ghost-set,.wu-chip,.move-acts{display:none!important}",
    "#view-workout .set-grid{display:grid!important;grid-template-columns:22px minmax(0,1fr) 64px 44px!important;grid-auto-flow:row!important;align-items:center;gap:8px;margin-top:8px}",
    "#view-workout .set-grid.tiny{display:none!important}",
    "#view-workout .step,#view-workout .kg-step button,#view-workout [data-act='step-w'],#view-workout .kg-minus,#view-workout .kg-plus{display:none!important}",
    "#view-workout .step-wrap,#view-workout .kg-step{display:block!important;min-width:0}",
    "#view-workout .set-grid > div:first-child{grid-column:1}",
    "#view-workout .set-grid input,#view-workout .step-wrap,#view-workout .kg-step{grid-column:auto}",
    "#view-workout [data-act='set-w'],#view-workout .step-wrap,#view-workout .kg-step{grid-column:2!important}",
    "#view-workout [data-act='set-r']{grid-column:3!important}",
    "#view-workout [data-act='toggle-set']{grid-column:4!important;grid-row:auto;width:44px!important;height:44px!important;justify-self:end}",
    "#view-workout .set-grid input{height:44px;text-align:center;font-size:17px;font-weight:700}",
    "#view-workout .card{padding:12px}",
    "#view-workout [data-act='rm-move']{width:36px!important;min-width:36px;padding:0}",
    ".nav button span{display:none!important}"
  ].join("");
  function strip() {
    document.querySelectorAll("#view-workout .step, #view-workout [data-act='step-w'], #view-workout .kg-minus, #view-workout .kg-plus").forEach(function (n) { n.remove(); });
  }
  strip();
  var view = document.getElementById("view-workout");
  if (view) new MutationObserver(strip).observe(view, { childList: true, subtree: true });
})();
