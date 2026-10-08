(function () {
  var restUntil = 0, restTick = null, restPaused = false, restHold = 0, lastClock = "", lastRest = "";
  function clock() {
    try { return JSON.parse(localStorage.getItem("il_clock") || "{}"); } catch (e) { return {}; }
  }
  function saveClock(c) { localStorage.setItem("il_clock", JSON.stringify(c)); }
  function session() {
    try { return JSON.parse(localStorage.getItem("il_session") || "null"); } catch (e) { return null; }
  }
  function restPref() {
    try { return Number(JSON.parse(localStorage.getItem("il_rest") || "90")) || 90; } catch (e) { return 90; }
  }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = String(sec % 60);
    if (s.length < 2) s = "0" + s;
    return m + ":" + s;
  }
  function elapsed() {
    var c = clock();
    if (!c.startedAt || !c.userStarted) return 0;
    var extra = c.pausedAt ? Date.now() - c.pausedAt : 0;
    return Math.max(0, Date.now() - c.startedAt - (c.pauseMs || 0) - extra);
  }
  function clearStale() {
    var s = session();
    var live = s && (s.exercises || []).length;
    var c = clock();
    if (!live || !c.userStarted) saveClock({});
  }
  function styles() {
    if (document.getElementById("tmStyle")) return;
    var s = document.createElement("style");
    s.id = "tmStyle";
    s.textContent =
      "#sessClock{margin-left:auto;display:none;align-items:center;gap:6px;font-variant-numeric:tabular-nums}" +
      "body.clock-on #sessClock{display:flex}" +
      "#sessClock b{font-size:15px}" +
      "#sessClock button{min-height:32px;padding:4px 8px;border-radius:8px;background:#1c1c1c;font-size:12px;font-weight:700}" +
      "#restBar{position:sticky;top:calc(46px + var(--safe-t));z-index:9;background:#141414;border:1px solid #222;border-radius:14px;padding:8px;margin:0 0 10px}" +
      "#restBar .rest-num{color:#f4f4f5;font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}" +
      "#restBar .chips{margin:6px 0 0}";
    document.head.appendChild(s);
  }
  function mountClock() {
    var head = document.querySelector("header.top");
    var el = document.getElementById("sessClock");
    if (!el && head) {
      el = document.createElement("div");
      el.id = "sessClock";
      head.appendChild(el);
    }
    paintClock();
  }
  function paintClock() {
    var el = document.getElementById("sessClock");
    if (!el) return;
    var on = document.getElementById("view-workout") && document.getElementById("view-workout").classList.contains("active");
    document.body.classList.toggle("train-on", !!on);
    var c = clock();
    var running = !!(on && c.userStarted && c.startedAt && !c.pausedAt);
    document.body.classList.toggle("clock-on", !!(on && c.userStarted && c.startedAt));
    if (!on || !c.userStarted) {
      if (lastClock !== "") { el.innerHTML = ""; lastClock = ""; }
      return;
    }
    var html = "<b>" + fmt(elapsed() / 1000) + "</b>" +
      '<button type="button" id="clkPause">' + (running ? "Pause" : "Resume") + "</button>" +
      '<button type="button" id="clkEnd">End</button>';
    if (html !== lastClock) { el.innerHTML = html; lastClock = html; }
    else {
      var b = el.querySelector("b");
      if (b) b.textContent = fmt(elapsed() / 1000);
    }
  }
  function startClock() {
    var c = clock();
    if (c.userStarted && c.startedAt && !c.pausedAt) return;
    if (c.pausedAt && c.userStarted) {
      c.pauseMs = (c.pauseMs || 0) + (Date.now() - c.pausedAt);
      c.pausedAt = null;
    } else {
      c.startedAt = Date.now();
      c.pauseMs = 0;
      c.pausedAt = null;
      c.userStarted = true;
    }
    c.userStarted = true;
    saveClock(c);
    lastClock = "";
    paintClock();
  }
  function pauseClock() {
    var c = clock();
    if (!c.userStarted) { startClock(); return; }
    if (c.startedAt && !c.pausedAt) {
      c.pausedAt = Date.now();
      saveClock(c);
    } else startClock();
    lastClock = "";
    paintClock();
  }
  function endClock() {
    var dur = Math.round(elapsed() / 1000);
    saveClock({});
    lastClock = "";
    try {
      var s = session();
      if (s) { s.durationSec = dur; localStorage.setItem("il_session", JSON.stringify(s)); }
    } catch (e) {}
    paintClock();
    return dur;
  }
  function mountRest() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var bar = document.getElementById("restBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "restBar";
      view.insertBefore(bar, view.firstChild);
    }
    paintRest();
  }
  function restLeft() { return Math.max(0, Math.ceil((restUntil - Date.now()) / 1000)); }
  function paintRest() {
    var bar = document.getElementById("restBar");
    if (!bar) return;
    var chips = [60, 90, 120, 180].map(function (n) {
      return '<button class="chip' + (restPref() === n ? " on" : "") + '" type="button" data-rest-sec="' + n + '">' + n + "s</button>";
    }).join("");
    var html;
    if (restUntil || restPaused) {
      var n = restPaused ? restHold : restLeft();
      if (!restPaused && n <= 0) {
        restUntil = 0; restPaused = false;
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
        html = '<div class="tiny">Rest after a set</div><div class="chips">' + chips + "</div>";
      } else {
        html = '<div class="row space"><span class="rest-num">Rest ' + fmt(n) + '</span>' +
          '<div><button class="text-link" type="button" data-rest-pause>' + (restPaused ? "Resume" : "Pause") + '</button> ' +
          '<button class="text-link" type="button" data-rest-skip>Skip</button></div></div>' +
          '<div class="chips">' + chips + "</div>";
      }
    } else html = '<div class="tiny">Rest after a set</div><div class="chips">' + chips + "</div>";
    if (html !== lastRest) { bar.innerHTML = html; lastRest = html; }
    else {
      var num = bar.querySelector(".rest-num");
      if (num && (restUntil || restPaused)) num.textContent = "Rest " + fmt(restPaused ? restHold : restLeft());
    }
  }
  function startRest(sec) {
    localStorage.setItem("il_rest", JSON.stringify(sec || restPref()));
    restPaused = false;
    restUntil = Date.now() + (sec || restPref()) * 1000;
    clearInterval(restTick);
    restTick = setInterval(paintRest, 250);
    lastRest = "";
    paintRest();
  }
  document.addEventListener("click", function (e) {
    if (e.target.id === "clkPause") { pauseClock(); return; }
    if (e.target.id === "clkEnd") {
      var d = endClock();
      var toast = document.getElementById("prToast");
      if (toast) { toast.textContent = "Session " + fmt(d); toast.classList.add("show"); setTimeout(function () { toast.classList.remove("show"); }, 1600); }
      return;
    }
    var chip = e.target.closest("[data-rest-sec]");
    if (chip) { startRest(Number(chip.getAttribute("data-rest-sec"))); return; }
    if (e.target.closest("[data-rest-pause]")) {
      if (restPaused) { restPaused = false; restUntil = Date.now() + restHold * 1000; }
      else { restHold = restLeft(); restPaused = true; restUntil = 0; }
      lastRest = "";
      paintRest();
      return;
    }
    if (e.target.closest("[data-rest-skip]")) {
      restUntil = 0; restPaused = false; lastRest = ""; paintRest();
      return;
    }
    if (e.target.closest("[data-act='finish']")) endClock();
  }, true);
  styles();
  clearStale();
  mountClock();
  setInterval(function () {
    paintClock();
    if (document.getElementById("view-workout") && document.getElementById("view-workout").classList.contains("active")) mountRest();
  }, 1000);
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(function () { mountClock(); mountRest(); }, 50); });
  });
})();
