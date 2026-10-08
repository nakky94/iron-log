(function () {
  var restUntil = 0, restTick = null, restPaused = false, restHold = 0, lastClock = "", lastRest = "";
  function clock() { try { return JSON.parse(localStorage.getItem("il_clock") || "{}"); } catch (e) { return {}; } }
  function saveClock(c) { localStorage.setItem("il_clock", JSON.stringify(c)); }
  function session() { try { return JSON.parse(localStorage.getItem("il_session") || "null"); } catch (e) { return null; } }
  function restPref() { try { return Number(JSON.parse(localStorage.getItem("il_rest") || "90")) || 90; } catch (e) { return 90; } }
  function fmt(sec) { sec = Math.max(0, Math.floor(sec || 0)); var m = Math.floor(sec / 60), s = String(sec % 60); if (s.length < 2) s = "0" + s; return m + ":" + s; }
  function elapsed() { var c = clock(); if (!c.startedAt || !c.userStarted) return 0; var extra = c.pausedAt ? Date.now() - c.pausedAt : 0; return Math.max(0, Date.now() - c.startedAt - (c.pauseMs || 0) - extra); }
  function clearStale() { var s = session(); var live = s && (s.exercises || []).length; var c = clock(); if (!live || !c.userStarted) saveClock({}); }
  function styles() {
    if (document.getElementById("tmStyle")) return;
    var s = document.createElement("style"); s.id = "tmStyle";
    s.textContent = "#sessClock{margin-left:auto;display:none;align-items:center;gap:6px}body.clock-on #sessClock{display:flex}#restBar{position:sticky;top:calc(46px + var(--safe-t));z-index:9;background:#141414;border:1px solid #222;border-radius:14px;padding:8px;margin:0 0 10px}#restBar .rest-num{color:#f4f4f5;font-size:20px;font-weight:800}";
    document.head.appendChild(s);
  }
  function paintClock() {
    var el = document.getElementById("sessClock"); if (!el) return;
    var on = document.getElementById("view-workout") && document.getElementById("view-workout").classList.contains("active");
    document.body.classList.toggle("train-on", !!on);
    var c = clock();
    document.body.classList.toggle("clock-on", !!(on && c.userStarted && c.startedAt));
    if (!on || !c.userStarted) { if (lastClock) { el.innerHTML = ""; lastClock = ""; } return; }
    var b = el.querySelector("b");
    if (!b) { el.innerHTML = "<b>" + fmt(elapsed() / 1000) + "</b><button type='button' id='clkPause'>Pause</button><button type='button' id='clkEnd'>End</button>"; lastClock = "on"; }
    else b.textContent = fmt(elapsed() / 1000);
  }
  function mountClock() { var head = document.querySelector("header.top"); if (head && !document.getElementById("sessClock")) { var el = document.createElement("div"); el.id = "sessClock"; head.appendChild(el); } paintClock(); }
  function startClock() { var c = clock(); c.userStarted = true; if (!c.startedAt) { c.startedAt = Date.now(); c.pauseMs = 0; } c.pausedAt = null; saveClock(c); paintClock(); }
  function endClock() { saveClock({}); lastClock = ""; paintClock(); }
  function paintRest() {
    var bar = document.getElementById("restBar"); if (!bar) return;
    var chips = [60, 90, 120, 180].map(function (n) { return '<button class="chip" type="button" data-rest-sec="' + n + '">' + n + "s</button>"; }).join("");
    var n = restPaused ? restHold : Math.max(0, Math.ceil((restUntil - Date.now()) / 1000));
    var html = (restUntil || restPaused) ? '<div class="row space"><span class="rest-num">Rest ' + fmt(n) + '</span></div><div class="chips">' + chips + "</div>" : '<div class="tiny">Rest after a set</div><div class="chips">' + chips + "</div>";
    if (html !== lastRest) { bar.innerHTML = html; lastRest = html; }
    else { var num = bar.querySelector(".rest-num"); if (num) num.textContent = "Rest " + fmt(n); }
  }
  function startRest(sec) { restPaused = false; restUntil = Date.now() + (sec || restPref()) * 1000; lastRest = ""; paintRest(); }
  window.gymRestAdd = function (extra, replace) {
    if (replace) restUntil = Date.now() + replace * 1000;
    else if (restUntil) restUntil += (extra || 15) * 1000;
    else startRest(extra || 15);
    lastRest = ""; paintRest();
  };
  window.gymRestClear = function () { restUntil = 0; restPaused = false; lastRest = ""; paintRest(); };
  document.addEventListener("click", function (e) {
    if (e.target.id === "clkPause") { startClock(); return; }
    if (e.target.id === "clkEnd") { endClock(); return; }
    var chip = e.target.closest("[data-rest-sec]");
    if (chip) { startRest(Number(chip.getAttribute("data-rest-sec"))); return; }
    if (e.target.closest("[data-rest-skip]")) { window.gymRestClear(); return; }
    if (e.target.id === "restPlus") { window.gymRestAdd(15); return; }
  }, true);
  styles(); clearStale(); mountClock();
  setInterval(function () { paintClock(); if (document.getElementById("view-workout") && document.getElementById("view-workout").classList.contains("active")) { var view = document.getElementById("view-workout"); if (!document.getElementById("restBar")) { var bar = document.createElement("div"); bar.id = "restBar"; view.insertBefore(bar, view.firstChild); } paintRest(); } }, 1000);
  if (!document.querySelector('script[src="restplus.js"]')) { var s = document.createElement("script"); s.src = "restplus.js"; document.body.appendChild(s); }
})();
