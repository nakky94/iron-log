(function () {
  var until = 0, tick = null, paused = false, hold = 0, chip = null;
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
  function killForeign() {
    Array.prototype.slice.call(document.querySelectorAll(".rest-chip:not([data-ctl])")).forEach(function (c) { c.remove(); });
  }
  function paint() {
    if (!chip || !chip.isConnected) return;
    if (!until && !paused) {
      chip.innerHTML = "Start rest";
      chip.classList.remove("warn");
      return;
    }
    var n = paused ? hold : left();
    chip.innerHTML = '<span class="rest-num">' + fmt(n) + '</span>' +
      '<span class="rest-adj"><button type="button" data-act="pause-rest">' + (paused ? "Resume" : "Pause") + "</button>" +
      '<button type="button" data-act="skip-rest">Skip</button></span>';
    if (!paused && n <= 10) chip.classList.add("warn");
    else chip.classList.remove("warn");
    if (!paused && n <= 0) {
      stopTick(); until = 0; paused = false;
      chip.innerHTML = "Go";
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    }
  }
  function offer(card) {
    if (!card) return;
    killForeign();
    stopTick(); until = 0; paused = false;
    chip = card.querySelector(".rest-chip[data-ctl]");
    if (!chip) {
      chip = document.createElement("button");
      chip.type = "button";
      chip.className = "rest-chip";
      chip.setAttribute("data-ctl", "1");
      chip.setAttribute("data-act", "arm-rest");
      card.appendChild(chip);
    }
    chip.setAttribute("data-act", "arm-rest");
    paint();
  }
  function start() {
    if (!chip) return;
    paused = false;
    until = Date.now() + restSec() * 1000;
    chip.setAttribute("data-act", "skip-rest");
    stopTick();
    tick = setInterval(paint, 200);
    paint();
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-act='pause-rest']")) {
      e.preventDefault(); e.stopPropagation();
      if (paused) {
        paused = false;
        until = Date.now() + hold * 1000;
        stopTick(); tick = setInterval(paint, 200);
      } else {
        hold = left() || hold || restSec();
        paused = true; until = 0; stopTick();
      }
      paint();
      return;
    }
    if (e.target.closest("[data-act='arm-rest']") && !e.target.closest("[data-act='pause-rest'], [data-act='skip-rest']")) {
      e.preventDefault(); e.stopPropagation();
      start();
      return;
    }
    if (e.target.closest("[data-act='skip-rest']")) {
      e.preventDefault(); e.stopPropagation();
      stopTick(); until = 0; paused = false;
      if (chip) chip.remove();
      chip = null;
      return;
    }
    var tog = e.target.closest("[data-act='toggle-set']");
    if (tog) {
      var card = tog.closest(".card");
      setTimeout(function () {
        killForeign();
        var s = null;
        try { s = JSON.parse(localStorage.getItem("il_session") || "null"); } catch (err) {}
        var i = Number(tog.getAttribute("data-i"));
        var si = Number(tog.getAttribute("data-si"));
        var set = s && s.exercises && s.exercises[i] && s.exercises[i].sets[si];
        if (set && set.done) offer(card);
      }, 60);
    }
  }, true);
})();
