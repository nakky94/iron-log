(function () {
  function loadSess() {
    try { return JSON.parse(localStorage.getItem("il_session") || "null"); } catch (e) { return null; }
  }
  function saveSess(s) { localStorage.setItem("il_session", JSON.stringify(s)); }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = String(sec % 60);
    if (s.length < 2) s = "0" + s;
    return m + ":" + s;
  }
  function elapsed(s) {
    if (!s || !s.ts) return 0;
    var pauseMs = Number(s.pauseMs) || 0;
    var frozen = s.pausedAt ? (Date.now() - Number(s.pausedAt)) : 0;
    return Math.max(0, Math.floor((Date.now() - s.ts - pauseMs - frozen) / 1000));
  }
  function ensureBtn(view) {
    var strip = view.querySelector("#sessStrip");
    if (!strip) return;
    var btn = strip.querySelector("[data-act='sess-pause']");
    var s = loadSess();
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-act", "sess-pause");
      btn.className = "text-link";
      btn.style.cssText = "flex:0 0 auto;color:#FFD400;font-size:13px;font-weight:700;padding:4px 8px";
      strip.appendChild(btn);
    }
    var paused = !!(s && s.pausedAt);
    btn.textContent = paused ? "Resume session" : "Pause session";
    view.classList.toggle("sess-paused", paused);
    var clock = strip.querySelector("span");
    if (clock && s) clock.textContent = fmt(elapsed(s)) + (paused ? " paused" : "");
  }
  function toggle() {
    var s = loadSess(); if (!s) return;
    if (s.pausedAt) {
      s.pauseMs = (Number(s.pauseMs) || 0) + (Date.now() - Number(s.pausedAt));
      s.pausedAt = 0;
    } else {
      s.pausedAt = Date.now();
    }
    saveSess(s);
    var view = document.getElementById("view-workout");
    if (view) ensureBtn(view);
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-act='sess-pause']")) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    }
  }, true);
  var t = null;
  function schedule() {
    if (t) return;
    t = setTimeout(function () {
      t = null;
      var view = document.getElementById("view-workout");
      if (view && view.classList.contains("active")) ensureBtn(view);
    }, 60);
  }
  setInterval(function () {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var s = loadSess();
    var strip = view.querySelector("#sessStrip span");
    if (strip && s) strip.textContent = fmt(elapsed(s)) + (s.pausedAt ? " paused" : "");
  }, 1000);
  function boot() {
    var w = document.getElementById("view-workout");
    if (w) new MutationObserver(schedule).observe(w, { childList: true });
    schedule();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
