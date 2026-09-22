(function () {
  function sess() {
    try { return JSON.parse(localStorage.getItem("il_session") || "null"); } catch (e) { return null; }
  }
  function clock() {
    try { return JSON.parse(localStorage.getItem("il_clock") || "{}"); } catch (e) { return {}; }
  }
  function saveClock(c) {
    localStorage.setItem("il_clock", JSON.stringify(c));
    window.__sessPaused = !!c.pausedAt;
  }
  function bindClock(s) {
    var c = clock();
    if (!s || !s.ts) return c;
    if (c.sessTs !== s.ts) {
      c = { sessTs: s.ts, pauseMs: 0, pausedAt: 0 };
      saveClock(c);
    }
    return c;
  }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = String(sec % 60);
    if (s.length < 2) s = "0" + s;
    return m + ":" + s;
  }
  function elapsed(s, c) {
    if (!s || !s.ts) return 0;
    c = c || bindClock(s);
    var freeze = c.pausedAt ? Date.now() - Number(c.pausedAt) : 0;
    return Math.max(0, Math.floor((Date.now() - s.ts - (Number(c.pauseMs) || 0) - freeze) / 1000));
  }
  function paint() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var s = sess(); if (!s) return;
    var c = bindClock(s);
    var strip = view.querySelector("#sessStrip");
    if (!strip) return;
    var btn = strip.querySelector("[data-act='sess-pause']");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-act", "sess-pause");
      btn.className = "text-link";
      btn.style.cssText = "flex:0 0 auto;color:#FFD400;font-size:13px;font-weight:700;padding:4px 8px";
      strip.appendChild(btn);
    }
    btn.textContent = c.pausedAt ? "Resume session" : "Pause session";
    var clockEl = strip.querySelector("span");
    if (clockEl) clockEl.textContent = fmt(elapsed(s, c)) + (c.pausedAt ? " paused" : "");
    window.__sessPaused = !!c.pausedAt;
  }
  function toggle() {
    var s = sess(); if (!s) return;
    var c = bindClock(s);
    if (c.pausedAt) {
      c.pauseMs = (Number(c.pauseMs) || 0) + (Date.now() - Number(c.pausedAt));
      c.pausedAt = 0;
    } else {
      c.pausedAt = Date.now();
    }
    saveClock(c);
    paint();
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-act='sess-pause']")) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    }
  }, true);
  document.addEventListener("visibilitychange", function () {
    var s = sess(); if (!s) return;
    bindClock(s);
  });
  setInterval(paint, 400);
  var orig = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (k, v) {
    orig(k, v);
    if (k === "il_session") setTimeout(paint, 0);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
})();
