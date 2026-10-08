(function () {
  if (!document.querySelector('script[src="gearlink.js"]')) {
    var g = document.createElement("script");
    g.src = "gearlink.js";
    document.body.appendChild(g);
  }
  var restUntil = 0, restLeft = 0;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function clock() { return load("il_clock", {}); }
  function session() { return load("il_session", null); }
  function fmt(sec) { sec = Math.max(0, Math.floor(sec)); var m = Math.floor(sec / 60), s = String(sec % 60); if (s.length < 2) s = "0" + s; return m + ":" + s; }
  function elapsed() {
    var c = clock();
    if (!c.userStarted || !c.startedAt) return 0;
    var extra = c.pausedAt ? Date.now() - c.pausedAt : 0;
    return Math.max(0, Date.now() - c.startedAt - (c.pauseMs || 0) - extra);
  }
  function paused() { return !!clock().pausedAt; }
  var css = document.getElementById("sessTimerCss");
  if (!css) { css = document.createElement("style"); css.id = "sessTimerCss"; document.head.appendChild(css); }
  css.textContent = "#sessClock,#clkPause,#clkEnd{display:none!important}#sessionTimer,#trainStart{display:none;position:sticky;top:0;z-index:12;margin:0 0 10px}#sessionTimer.on,#trainStart.on{display:flex}#sessionTimer{background:#141414;border:1px solid #2a2a2e;border-radius:16px;padding:10px 12px;align-items:center;justify-content:space-between;gap:8px}#sessionTimer b{font-size:22px;font-variant-numeric:tabular-nums}#sessionTimer button,#trainStart{min-height:48px;padding:0 14px;border-radius:14px;border:1px solid #2a2a2e;background:#f4f4f5;color:#111;font-weight:700;width:100%;justify-content:center}";
  function dropOld() { var old = document.getElementById("sessClock"); if (old) old.remove(); }
  function hasMoves() { var s = session(); return !!(s && (s.exercises || []).length); }
  function bar() {
    var view = document.getElementById("view-workout");
    if (!view) return null;
    var el = document.getElementById("sessionTimer");
    if (!el) { el = document.createElement("div"); el.id = "sessionTimer"; view.insertBefore(el, view.firstChild); }
    return el;
  }
  function startBtn() {
    var view = document.getElementById("view-workout");
    if (!view) return null;
    var el = document.getElementById("trainStart");
    if (!el) { el = document.createElement("button"); el.id = "trainStart"; el.type = "button"; el.textContent = "Start workout"; view.insertBefore(el, view.firstChild); }
    return el;
  }
  function started() { var c = clock(); return !!(c.userStarted && c.startedAt); }
  function start() {
    var c = clock();
    c.userStarted = true;
    if (!c.startedAt || c.pausedAt) {
      if (!c.startedAt) c.startedAt = Date.now();
      c.pauseMs = c.pauseMs || 0;
      c.pausedAt = null;
    }
    save("il_clock", c);
    paint();
  }
  function togglePause() {
    var c = clock();
    if (!c.userStarted) return;
    if (c.pausedAt) {
      c.pauseMs = (c.pauseMs || 0) + (Date.now() - c.pausedAt);
      c.pausedAt = null;
      if (restLeft) { restUntil = Date.now() + restLeft; restLeft = 0; }
    } else {
      c.pausedAt = Date.now();
      restLeft = restUntil > Date.now() ? restUntil - Date.now() : 0;
      restUntil = 0;
    }
    save("il_clock", c);
    var el = bar(); if (el) el.dataset.mode = "";
    paint();
  }
  function paint() {
    dropOld();
    var el = bar();
    var go = startBtn();
    if (!el || !go) return;
    var on = document.getElementById("view-workout") && document.getElementById("view-workout").classList.contains("active");
    if (!on || !hasMoves() || started()) go.classList.remove("on");
    else go.classList.add("on");
    if (!on || !started()) { el.classList.remove("on"); return; }
    el.classList.add("on");
    var rest = restUntil > Date.now();
    var label = paused() ? "Paused" : (rest ? "Rest" : "Session");
    var num = rest ? fmt((restUntil - Date.now()) / 1000) : (restLeft && paused() ? fmt(restLeft / 1000) : fmt(elapsed() / 1000));
    var mode = (paused() ? "pause" : rest ? "rest" : "run");
    if (el.dataset.mode !== mode) {
      el.dataset.mode = mode;
      el.innerHTML = "<b>" + num + "</b><span class='tiny'>" + label + "</span><button type='button' id='sessPause'>" + (paused() ? "Resume" : "Pause") + "</button>" + (rest ? "<button type='button' id='restSkip'>Skip</button>" : "<button type='button' id='sessEnd'>End</button>");
    } else {
      var b = el.querySelector("b"); if (b) b.textContent = num;
    }
  }
  document.addEventListener("click", function (e) {
    if (e.target.id === "trainStart") { e.preventDefault(); start(); return; }
    if (e.target.id === "sessPause") { togglePause(); return; }
    if (e.target.id === "sessEnd") { save("il_clock", {}); restUntil = 0; restLeft = 0; var el = bar(); if (el) { el.classList.remove("on"); el.dataset.mode = ""; } paint(); return; }
    if (e.target.id === "restSkip") { restUntil = 0; restLeft = 0; var el = bar(); if (el) el.dataset.mode = ""; paint(); return; }
    if (e.target.closest("[data-act='load-routine'], #hsStart")) { setTimeout(paint, 80); return; }
    var tick = e.target.closest("[data-act='toggle-set']");
    if (tick && started() && !paused()) { restUntil = Date.now() + 90 * 1000; restLeft = 0; var el = bar(); if (el) el.dataset.mode = ""; paint(); }
  }, true);
  setInterval(paint, 1000);
  paint();
})();
