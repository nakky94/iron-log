(function () {
  var was = false;
  function beep() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.value = 0.04;
      o.start(); o.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }
  setInterval(function () {
    var el = document.getElementById("sessionTimer");
    var resting = el && /Rest/.test(el.textContent || "");
    if (was && !resting) beep();
    was = !!resting;
  }, 500);
})();
