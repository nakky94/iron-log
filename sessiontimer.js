(function () {
  var restUntil = 0;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function clock() { return load("il_clock", {}); }
  function fmt(sec) { sec = Math.max(0, Math.floor(sec)); var m = Math.floor(sec / 60), s = String(sec % 60); if (s.length < 2) s = "0" + s; return m + ":" + s; }
  function elapsed() { var c = clock(); if (!c.userStarted || !c.startedAt) return 0; return Math.max(0, Date.now() - c.startedAt - (c.pauseMs || 0)); }
  var css = document.getElementById("sessTimerCss");
  if (!css) { css = document.createElement("style"); css.id = "sessTimerCss"; document.head.appendChild(css); }
  css.textContent = "#sessionTimer{display:none;position:sticky;top:0;z-index:12;margin:0 0 10px;background:#141414;border:1px solid #2a2a2e;border-radius:16px;padding:10px 12px;align-items:center;justify-content:space-between;gap:8px}#sessionTimer.on{display:flex}#sessionTimer b{font-size:22px;font-variant-numeric:tabular-nums}#sessionTimer button{min-height:36px;padding:0 12px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}";
  function bar() {
    var view = document.getElementById("view-workout");
    if (!view) return null;
    var el = document.getElementById("sessionTimer");
    if (!el) { el = document.createElement("div"); el.id = "sessionTimer"; view.insertBefore(el, view.firstChild); }
    return el;
  }
  function started() { var c = clock(); return !!(c.userStarted && c.startedAt); }
  function start() {
    var c = clock();
    if (!c.userStarted) { c.userStarted = true; c.startedAt = Date.now(); c.pauseMs = 0; save("il_clock", c); }
    paint();
  }
  function paint() {
    var el = bar();
    if (!el) return;
    var on = document.getElementById("view-workout") && document.getElementById("view-workout").classList.contains("active");
    if (!on || !started()) { el.classList.remove("on"); return; }
    el.classList.add("on");
    var rest = restUntil > Date.now();
    var label = rest ? "Rest" : "Session";
    var num = rest ? fmt((restUntil - Date.now()) / 1000) : fmt(elapsed() / 1000);
    if (el.dataset.mode !== (rest ? "rest" : "run")) {
      el.dataset.mode = rest ? "rest" : "run";
      el.innerHTML = "<b>" + num + "</b><span class='tiny'>" + label + "</span>" + (rest ? "<button type='button' id='restSkip'>Skip</button>" : "<button type='button' id='sessEnd'>End</button>");
    } else {
      var b = el.querySelector("b"); if (b) b.textContent = num;
    }
  }
  document.addEventListener("click", function (e) {
    if (e.target.id === "sessEnd") { save("il_clock", {}); restUntil = 0; var el = bar(); if (el) { el.classList.remove("on"); el.dataset.mode = ""; } return; }
    if (e.target.id === "restSkip") { restUntil = 0; var el = bar(); if (el) el.dataset.mode = ""; paint(); return; }
    if (e.target.closest("[data-act='start'], [data-act='resume'], [data-act='load-routine'], #hsStart")) { start(); return; }
    var tick = e.target.closest("[data-act='toggle-set']");
    if (tick) { start(); restUntil = Date.now() + 90 * 1000; var el = bar(); if (el) el.dataset.mode = ""; paint(); }
  }, true);
  setInterval(paint, 1000);
  paint();
})();
