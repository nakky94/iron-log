(function () {
  var STEPS = [2.3,3.4,4.5,5.7,6.8,7.9,9.1,10.2,11.3,12.5,13.6,14.7,15.9,18.1,20.4,22.7,23.8,24.9,27.2,29.5,31.8,34,36.3,38.6,40.8];
  function next(n, dir) {
    var x = Number(n) || 0, best = 0, d = 99;
    STEPS.forEach(function (s, i) { var z = Math.abs(x - s); if (z < d) { d = z; best = i; } });
    return STEPS[Math.max(0, Math.min(STEPS.length - 1, best + dir))];
  }
  var css = document.getElementById("trainHide");
  if (!css) { css = document.createElement("style"); css.id = "trainHide"; document.head.appendChild(css); }
  css.textContent = [
    "html,body{background:#090909!important;color:#f4f4f5!important}",
    "header.top{background:#090909!important;border-bottom:1px solid #1a1a1a!important;height:52px!important}",
    "header.top b,header.top .brand{font-size:16px!important;font-weight:650!important;letter-spacing:-.02em}",
    ".nav{background:#0c0c0c!important;border-top:1px solid #1a1a1a!important}",
    ".nav button{color:#6b6b70!important}",
    ".nav button.active{color:#f4f4f5!important;background:#1c1c1c!important;border-radius:16px!important}",
    ".nav button span{display:none!important}",
    "#view-workout{padding:8px 12px 96px!important}",
    "#view-workout #sessName{background:transparent!important;border:0!important;font-size:22px!important;font-weight:700!important;letter-spacing:-.03em;padding:4px 0 10px!important}",
    "#view-workout .card{background:#121212!important;border:1px solid #222!important;border-radius:18px!important;padding:14px!important;margin:0 0 10px!important}",
    "#view-workout .ex-name{font-size:16px!important;font-weight:700!important;letter-spacing:-.02em;line-height:1.25}",
    "#view-workout .tiny{color:#8a8a8e!important;font-size:12px!important}",
    "#view-workout [style*='FFD400'],#view-workout [style*='ffd400'],#view-workout .next-line{color:#a1a1aa!important}",
    "#view-workout [data-act='rm-move']{width:32px!important;height:32px!important;min-width:32px!important;border-radius:10px!important;padding:0!important;background:#1c1c1c!important;border:1px solid #2a2a2e!important}",
    "#view-workout .set-grid{display:grid!important;grid-template-columns:20px minmax(0,1fr) 52px 40px!important;align-items:center;gap:6px;margin-top:8px!important}",
    "#view-workout .set-grid.tiny{display:none!important}",
    "#view-workout .kg-step{grid-column:2!important;display:flex!important;align-items:center;gap:4px;min-width:0;background:#1a1a1a;border-radius:12px;padding:3px}",
    "#view-workout .kg-step button{display:flex!important;width:36px;height:40px;flex:0 0 36px;border:0;border-radius:10px;background:#262626;color:#f4f4f5;font-size:18px;font-weight:700;align-items:center;justify-content:center}",
    "#view-workout .kg-step input{flex:1;min-width:0;height:40px;border:0!important;background:transparent!important;text-align:center;font-size:17px;font-weight:700;color:#f4f4f5}",
    "#view-workout [data-act='set-r']{grid-column:3!important;height:44px!important;border-radius:12px!important;border:1px solid #2a2a2e!important;background:#1a1a1a!important;text-align:center;font-weight:700;color:#f4f4f5}",
    "#view-workout [data-act='toggle-set']{grid-column:4!important;width:40px!important;height:40px!important;border-radius:12px!important;border:1px solid #2a2a2e!important;background:#1a1a1a!important}",
    "#view-workout [data-act='toggle-set']:not(.ghost){background:#f4f4f5!important;color:#111!important;border-color:#f4f4f5!important}",
    "#view-workout [data-act='add-set']{margin-top:8px;background:#1a1a1a!important;border:1px solid #2a2a2e!important;border-radius:12px!important;min-height:40px}",
    "#view-workout [data-act='finish']{border-radius:14px!important;min-height:48px;background:#f4f4f5!important;color:#111!important;font-weight:700}",
    "#view-workout .step-wrap{display:contents!important}",
    "#view-workout [data-act='step-w']{display:none!important}"
  ].join("");
  function bump(btn, dir) {
    var wrap = btn.closest(".kg-step");
    var inp = wrap && wrap.querySelector("input");
    if (!inp) return;
    inp.value = String(next(inp.value, dir));
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    inp.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function mount() {
    document.querySelectorAll("#view-workout [style*='255, 212'], #view-workout [style*='FFD400'], #view-workout [style*='ffd400']").forEach(function (n) { n.style.color = "#a1a1aa"; });
    document.querySelectorAll("#view-workout [data-act='set-w']").forEach(function (inp) {
      if (inp.closest(".kg-step")) return;
      var wrap = document.createElement("div");
      wrap.className = "kg-step";
      inp.parentNode.insertBefore(wrap, inp);
      var minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "\u2212";
      var plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+";
      wrap.appendChild(minus); wrap.appendChild(inp); wrap.appendChild(plus);
      minus.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); bump(minus, -1); });
      plus.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); bump(plus, 1); });
    });
  }
  mount();
  var view = document.getElementById("view-workout");
  if (view) new MutationObserver(mount).observe(view, { childList: true, subtree: true });
})();
