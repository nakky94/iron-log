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
    "#view-workout .set-grid{display:grid!important;grid-template-columns:22px minmax(0,1fr) 56px 44px!important;align-items:center;gap:8px;margin-top:8px}",
    "#view-workout .set-grid.tiny{display:none!important}",
    "#view-workout .kg-step{grid-column:2!important;display:flex!important;align-items:center;gap:4px;min-width:0}",
    "#view-workout .kg-step button{display:flex!important;width:36px;height:44px;flex:0 0 36px;border-radius:10px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5;font-weight:800;align-items:center;justify-content:center}",
    "#view-workout .kg-step input,#view-workout [data-act='set-w']{flex:1;min-width:0;height:44px;text-align:center;font-size:17px;font-weight:700}",
    "#view-workout [data-act='set-r']{grid-column:3!important;height:44px;text-align:center;font-weight:700}",
    "#view-workout [data-act='toggle-set']{grid-column:4!important;width:44px!important;height:44px!important}",
    "#view-workout .step-wrap{display:contents!important}",
    "#view-workout [data-act='step-w']{display:none!important}"
  ].join("");
  function bump(btn, dir) {
    var wrap = btn.closest(".kg-step");
    var inp = wrap && wrap.querySelector("input");
    if (!inp) return;
    var val = next(inp.value, dir);
    inp.value = String(val);
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
      minus.type = "button"; minus.textContent = "\u2212"; minus.className = "kg-minus";
      var plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+"; plus.className = "kg-plus";
      wrap.appendChild(minus);
      wrap.appendChild(inp);
      wrap.appendChild(plus);
      minus.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); bump(minus, -1); });
      plus.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); bump(plus, 1); });
    });
  }
  mount();
  var view = document.getElementById("view-workout");
  if (view) new MutationObserver(function () { mount(); }).observe(view, { childList: true, subtree: true });
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(mount, 80); }); });
})();
