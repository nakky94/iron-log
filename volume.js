(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function workouts() { return load("il_workouts", []); }
  function volOf(w) {
    var n = 0;
    (w.exercises || []).forEach(function (e) {
      (e.sets || []).forEach(function (s) {
        if (s.done) n += (Number(s.w) || 0) * (Number(s.r) || 0);
      });
    });
    return Math.round(n);
  }
  function liftVol(e) {
    var n = 0;
    (e.sets || []).forEach(function (s) {
      if (s.done) n += (Number(s.w) || 0) * (Number(s.r) || 0);
    });
    return Math.round(n);
  }
  function fmt(n) {
    if (!n) return "0 kg";
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k kg";
    return n + " kg";
  }
  function paint() {
    var view = document.getElementById("view-home");
    if (!view || !view.classList.contains("active")) return;
    var extra = view.querySelector("#volWeek");
    if (extra) extra.style.display = "none";
    var feed = view.querySelector("#homeFeed .card");
    if (!feed || feed.querySelector(".sess-vol")) return;
    var last = workouts()[0];
    if (!last) return;
    var line = document.createElement("div");
    line.className = "row space sess-vol";
    line.style.marginTop = "8px";
    line.innerHTML = '<span class="tiny">Session volume</span><span class="tiny">' + fmt(volOf(last)) + "</span>";
    var title = feed.querySelector(".ex-name");
    if (title && title.nextSibling) feed.insertBefore(line, title.nextSibling);
    else feed.appendChild(line);
    Array.prototype.slice.call(feed.querySelectorAll(".row.space")).forEach(function (row) {
      if (row.classList.contains("sess-vol")) return;
      var name = row.querySelector(".grow");
      if (!name || !last.exercises) return;
      var ex = last.exercises.filter(function (e) {
        return String(e.n).replace(/^Dumbbell\s/, "").replace(/\sMachine$/, "") === name.textContent.trim();
      })[0];
      if (!ex) return;
      var v = liftVol(ex);
      var tiny = row.querySelector(".tiny");
      if (tiny && v && tiny.textContent.indexOf("kg") === tiny.textContent.lastIndexOf("kg")) {
        tiny.textContent = tiny.textContent + " \u00b7 " + fmt(v);
      }
    });
  }
  var t = null;
  function schedule() {
    if (t) return;
    t = setTimeout(function () { t = null; paint(); }, 120);
  }
  function boot() {
    var n = document.getElementById("view-home");
    if (n) new MutationObserver(schedule).observe(n, { childList: true });
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
