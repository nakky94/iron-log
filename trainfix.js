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
    "#view-workout .set-grid{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:8px!important;margin:8px 0 0!important;height:48px!important}",
    "#view-workout .set-grid.tiny{display:none!important}",
    "#view-workout .set-grid > div:first-child{width:18px!important;flex:0 0 18px!important;color:#8a8a8e!important;font-size:13px!important;font-weight:650!important;text-align:center}",
    "#view-workout .ghost-set,#view-workout .wu-chip,#view-workout [data-act='del-set'],#view-workout [data-act='step-w']{display:none!important}",
    "#view-workout .kg-step{flex:1 1 auto!important;display:flex!important;align-items:center!important;height:44px!important;background:#1a1a1a!important;border:1px solid #2a2a2e!important;border-radius:12px!important;overflow:hidden}",
    "#view-workout .kg-step button{display:flex!important;width:40px!important;height:44px!important;flex:0 0 40px!important;border:0!important;background:#222!important;color:#f4f4f5!important;font-size:20px!important;font-weight:600!important;align-items:center;justify-content:center}",
    "#view-workout .kg-step input{flex:1!important;min-width:0!important;height:44px!important;border:0!important;background:transparent!important;text-align:center!important;font-size:17px!important;font-weight:700!important;color:#f4f4f5!important;padding:0!important}",
    "#view-workout [data-act='set-r']{flex:0 0 56px!important;width:56px!important;height:44px!important;border-radius:12px!important;border:1px solid #2a2a2e!important;background:#1a1a1a!important;text-align:center!important;font-size:17px!important;font-weight:700!important;color:#f4f4f5!important}",
    "#view-workout [data-act='toggle-set']{flex:0 0 44px!important;width:44px!important;height:44px!important;border-radius:22px!important;border:1px solid #2a2a2e!important;background:#1a1a1a!important;margin:0!important}",
    "#view-workout [data-act='toggle-set']:not(.ghost){background:#f4f4f5!important;color:#111!important;border-color:#f4f4f5!important}"
  ].join("");
  function bump(btn, dir) {
    var inp = btn.parentNode.querySelector("input");
    if (!inp) return;
    inp.value = String(next(inp.value, dir));
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    inp.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function mount() {
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
