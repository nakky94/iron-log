(function () {
  var until = 0, tick = null, paused = false, hold = 0, bar = null;
  function restSec() {
    try { return Number(JSON.parse(localStorage.getItem("il_rest") || "90")) || 90; } catch (e) { return 90; }
  }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = String(sec % 60);
    if (s.length < 2) s = "0" + s;
    return m + ":" + s;
  }
  function left() { return Math.max(0, Math.ceil((until - Date.now()) / 1000)); }
  function stopTick() { clearInterval(tick); tick = null; }
  function mount() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    bar = document.getElementById("restBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "restBar";
      bar.className = "rest-bar";
      view.insertBefore(bar, view.firstChild);
    }
    paint();
  }
  function paint() {
    if (!bar || !bar.isConnected) return;
    if (!until && !paused) {
      bar.innerHTML = '<button type="button" class="btn" data-act="arm-rest">Start rest</button>';
      bar.classList.remove("warn");
      return;
    }
    var n = paused ? hold : left();
    if (!paused && n <= 0) {
      stopTick(); until = 0; paused = false;
      bar.innerHTML = '<button type="button" class="btn" data-act="arm-rest">Go · start rest</button>';
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      return;
    }
    bar.classList.toggle("warn", !paused && n <= 10);
    bar.innerHTML =
      '<span class="rest-num">' + fmt(n) + '</span>' +
      '<button type="button" data-act="pause-rest">' + (paused ? "Resume" : "Pause") + '</button>' +
      '<button type="button" data-act="skip-rest">Skip</button>';
  }
  function start() {
    paused = false;
    until = Date.now() + restSec() * 1000;
    stopTick();
    tick = setInterval(paint, 200);
    paint();
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-act='pause-rest']")) {
      e.preventDefault(); e.stopPropagation();
      if (paused) {
        paused = false;
        until = Date.now() + (hold || restSec()) * 1000;
        stopTick(); tick = setInterval(paint, 200);
      } else {
        hold = left() || hold || restSec();
        paused = true; until = 0; stopTick();
      }
      paint();
      return;
    }
    if (e.target.closest("[data-act='arm-rest']")) {
      e.preventDefault(); e.stopPropagation();
      mount();
      start();
      return;
    }
    if (e.target.closest("[data-act='skip-rest']")) {
      e.preventDefault(); e.stopPropagation();
      stopTick(); until = 0; paused = false; hold = 0;
      paint();
      return;
    }
  }, true);
  document.addEventListener("click", function (e) {
    if (e.target.closest('.nav button[data-view="workout"]')) setTimeout(mount, 80);
  });
  var t = null;
  function boot() {
    var w = document.getElementById("view-workout");
    if (w) new MutationObserver(function () {
      if (t) return;
      t = setTimeout(function () { t = null; mount(); }, 80);
    }).observe(w, { childList: true });
    mount();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
