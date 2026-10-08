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
    "#view-workout .set-grid.tiny,#view-workout .ghost-set,#view-workout .wu-chip,#view-workout [data-act='step-w'],#view-workout [data-act='del-set']{display:none!important}",
    "#view-workout .set-grid{display:none!important}",
    "#view-workout .pro-row{display:flex!important;align-items:center;gap:8px;margin-top:8px;width:100%;min-width:0}",
    "#view-workout .pro-n{width:18px;flex:0 0 18px;text-align:center;color:#8d8d92;font-size:13px;font-weight:650}",
    "#view-workout .pro-kg{flex:1 1 0!important;min-width:0!important;display:flex!important;align-items:center;height:48px;background:#141414;border:1px solid #2c2c30;border-radius:16px}",
    "#view-workout .pro-kg button{width:40px!important;flex:0 0 40px!important;height:48px;border:0;background:transparent;color:#e4e4e7;font-size:22px;font-weight:500;padding:0}",
    "#view-workout .pro-kg button:first-child{border-right:1px solid #2c2c30}",
    "#view-workout .pro-kg button:last-child{border-left:1px solid #2c2c30}",
    "#view-workout .pro-kg input{flex:1 1 0!important;width:0!important;min-width:0!important;max-width:none!important;height:48px!important;border:0!important;background:transparent!important;text-align:center!important;color:#fff!important;font-size:20px!important;font-weight:700!important;padding:0 2px!important}",
    "#view-workout .pro-row [data-act='set-r']{width:52px!important;flex:0 0 52px!important;min-width:52px!important;height:48px!important;border-radius:14px!important;border:1px solid #2c2c30!important;background:#141414!important;text-align:center!important;color:#fff!important;font-size:18px!important;font-weight:700!important}",
    "#view-workout .pro-row [data-act='toggle-set']{width:44px!important;flex:0 0 44px!important;height:44px!important;border-radius:22px!important;border:1px solid #2c2c30!important;background:#141414!important;margin:0!important}",
    "#view-workout .pro-row [data-act='toggle-set']:not(.ghost){background:#fafafa!important;color:#111!important;border-color:#fafafa!important}"
  ].join("");
  function bump(btn, dir) {
    var inp = btn.parentNode.querySelector("input");
    if (!inp) return;
    inp.value = String(next(inp.value, dir));
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    inp.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function mount() {
    document.querySelectorAll("#view-workout .set-grid:not(.tiny)").forEach(function (grid) {
      if (grid.dataset.pro) return;
      var w = grid.querySelector("[data-act='set-w']");
      var r = grid.querySelector("[data-act='set-r']");
      var tick = grid.querySelector("[data-act='toggle-set']");
      if (!w || !r || !tick) return;
      var n = (grid.querySelector("div") || {}).textContent || "";
      var row = document.createElement("div");
      row.className = "pro-row";
      var num = document.createElement("div");
      num.className = "pro-n";
      num.textContent = n.trim();
      var kg = document.createElement("div");
      kg.className = "pro-kg";
      var minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "\u2212";
      var plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+";
      w.style.width = "0";
      w.style.minWidth = "0";
      w.style.flex = "1 1 0";
      kg.appendChild(minus); kg.appendChild(w); kg.appendChild(plus);
      row.appendChild(num); row.appendChild(kg); row.appendChild(r); row.appendChild(tick);
      minus.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); bump(minus, -1); });
      plus.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); bump(plus, 1); });
      grid.dataset.pro = "1";
      grid.insertAdjacentElement("afterend", row);
    });
  }
  mount();
  var view = document.getElementById("view-workout");
  if (view) new MutationObserver(function () { mount(); }).observe(view, { childList: true, subtree: true });
})();
