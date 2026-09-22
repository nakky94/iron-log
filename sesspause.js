(function () {
  function sess() {
    try { return JSON.parse(localStorage.getItem("il_session") || "null"); } catch (e) { return null; }
  }
  function clock() {
    try { return JSON.parse(localStorage.getItem("il_clock") || "{}"); } catch (e) { return {}; }
  }
  function saveClock(c) {
    localStorage.setItem("il_clock", JSON.stringify(c));
    window.__sessPaused = !c.startedAt || !!c.pausedAt;
  }
  function bindClock(s) {
    var c = clock();
    if (!s) return c;
    if (!c.sessTs) c.sessTs = s.ts;
    if (c.sessTs !== s.ts && !c.startedAt) {
      c = { sessTs: s.ts, startedAt: 0, pauseMs: 0, pausedAt: 0 };
      saveClock(c);
    } else {
      c.sessTs = s.ts;
    }
    return c;
  }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = String(sec % 60);
    if (s.length < 2) s = "0" + s;
    return m + ":" + s;
  }
  function elapsed(c) {
    if (!c || !c.startedAt) return 0;
    var freeze = c.pausedAt ? Date.now() - Number(c.pausedAt) : 0;
    return Math.max(0, Math.floor((Date.now() - c.startedAt - (Number(c.pauseMs) || 0) - freeze) / 1000));
  }
  function styles() {
    if (document.getElementById("sessBarStyle")) return;
    var s = document.createElement("style");
    s.id = "sessBarStyle";
    s.textContent = ".sess-bar{position:sticky;top:calc(28px + var(--safe-t));z-index:10;background:#1d1a0a;border-radius:14px;padding:8px;margin:0 0 10px;display:flex;gap:8px;align-items:center}.sess-bar .btn{width:100%;min-height:48px}.sess-bar .clock{color:#FFD400;font-size:22px;font-weight:800;min-width:5ch;font-variant-numeric:tabular-nums}.sess-bar .ghost{background:#2a2610;color:#FFD400;border-radius:12px;padding:10px 14px;font-weight:800;min-height:44px;flex:1}";
    document.head.appendChild(s);
  }
  function barEl(view) {
    styles();
    var bar = document.getElementById("sessBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "sessBar";
      bar.className = "sess-bar";
      view.insertBefore(bar, view.firstChild);
    }
    return bar;
  }
  function paint() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var s = sess();
    if (!s) {
      var old = document.getElementById("sessBar");
      if (old) old.remove();
      return;
    }
    var c = bindClock(s);
    var bar = barEl(view);
    if (!c.startedAt) {
      bar.innerHTML = '<button type="button" class="btn" data-act="sess-start">Start session</button>';
      var strip = view.querySelector("#sessStrip span");
      if (strip) strip.textContent = "0:00";
      return;
    }
    if (c.pausedAt) {
      bar.innerHTML = '<span class="clock">' + fmt(elapsed(c)) + '</span><button type="button" class="ghost" data-act="sess-resume">Resume session</button>';
    } else {
      bar.innerHTML = '<span class="clock">' + fmt(elapsed(c)) + '</span><button type="button" class="ghost" data-act="sess-pause">Pause session</button>';
    }
    var clockEl = view.querySelector("#sessStrip span");
    if (clockEl) clockEl.textContent = fmt(elapsed(c)) + (c.pausedAt ? " paused" : "");
  }
  function start() {
    var s = sess(); if (!s) return;
    var c = bindClock(s);
    c.startedAt = Date.now();
    c.pausedAt = 0;
    c.pauseMs = 0;
    saveClock(c);
    paint();
  }
  function pause() {
    var s = sess(); if (!s) return;
    var c = bindClock(s);
    if (!c.startedAt || c.pausedAt) return;
    c.pausedAt = Date.now();
    saveClock(c);
    paint();
  }
  function resume() {
    var s = sess(); if (!s) return;
    var c = bindClock(s);
    if (!c.pausedAt) return;
    c.pauseMs = (Number(c.pauseMs) || 0) + (Date.now() - Number(c.pausedAt));
    c.pausedAt = 0;
    saveClock(c);
    paint();
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-act='sess-start']")) { e.preventDefault(); e.stopPropagation(); start(); return; }
    if (e.target.closest("[data-act='sess-pause']")) { e.preventDefault(); e.stopPropagation(); pause(); return; }
    if (e.target.closest("[data-act='sess-resume']")) { e.preventDefault(); e.stopPropagation(); resume(); return; }
  }, true);
  setInterval(paint, 400);
  document.addEventListener("click", function (e) {
    if (e.target.closest('.nav button[data-view="workout"]')) setTimeout(paint, 80);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
})();
