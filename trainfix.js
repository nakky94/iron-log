(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function shortName(n) { return String(n || "").replace(/^Dumbbell\s/i, "").replace(/\sMachine$/i, ""); }
  function css() {
    var s = document.getElementById("trainFix");
    if (!s) { s = document.createElement("style"); s.id = "trainFix"; document.head.appendChild(s); }
    s.textContent = [
      "#sessStrip span:first-child{display:none!important}",
      "#view-workout [data-act='toggle-set']:not(.ghost){background:#f4f4f5!important;color:#111!important;border-color:#f4f4f5!important}",
      "#view-workout .set-grid{grid-template-columns:28px minmax(0,1fr) 64px 44px!important;align-items:center}",
      "#view-workout .kg-step{display:flex;gap:4px;align-items:center}",
      "#view-workout .kg-step button{width:36px;height:40px;border-radius:10px;background:#1c1c1c;border:1px solid #2a2a2e;font-weight:800}",
      "#view-workout .ghost-set{display:none!important}",
      ".last-line{color:#8d8d8d;font-size:12px;margin-top:4px;font-variant-numeric:tabular-nums}",
      ".set-row-done{opacity:.55;max-height:none!important;overflow:visible!important;margin-top:8px!important}",
      "#view-workout.empty-train #restBar,#view-workout.empty-train #continueBox,#view-workout.empty-train .rir-row,#view-workout.empty-train #restDock{display:none!important}",
      "#restBar .rest-num{display:none!important}",
      "#emptyTrain{padding:8px 0 12px}",
      "#emptyTrain .btn{margin-top:8px}"
    ].join("");
  }
  function lastOf(name) {
    var ws = load("il_workouts", []);
    for (var i = 0; i < ws.length; i++) {
      var e = (ws[i].exercises || []).filter(function (x) { return x.n === name; })[0];
      if (!e) continue;
      var sets = e.sets || [];
      for (var j = sets.length - 1; j >= 0; j--) if (sets[j].w || sets[j].r) return sets[j];
    }
    return null;
  }
  function paint() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    css();
    var grids = view.querySelectorAll(".set-grid");
    view.classList.toggle("empty-train", grids.length === 0);
    view.querySelectorAll(".set-grid").forEach(function (row) {
      var wIn = row.querySelector("[data-act='set-w']");
      if (!wIn) return;
      var si = Number(wIn.getAttribute("data-si"));
      var num = row.querySelector("div");
      if (num && !num.querySelector("input")) num.textContent = String(si + 1);
    });
    view.querySelectorAll(".card").forEach(function (card) {
      var nameEl = card.querySelector(".ex-name");
      if (!nameEl || card.querySelector(".last-line")) return;
      var name = nameEl.textContent.replace(/\s+/g, " ").trim();
      var sess = load("il_session", null);
      var full = name;
      if (sess) (sess.exercises || []).forEach(function (e) { if (shortName(e.n) === name) full = e.n; });
      var prev = lastOf(full) || lastOf(name);
      if (!prev) return;
      var line = document.createElement("div");
      line.className = "last-line";
      line.textContent = "Last " + (prev.w || "\u2014") + " \u00d7 " + (prev.r || "\u2014");
      nameEl.insertAdjacentElement("afterend", line);
    });
    if (grids.length === 0 && !view.querySelector("#emptyTrain")) {
      var box = document.createElement("div");
      box.id = "emptyTrain";
      var s = load("il_session", null);
      box.innerHTML = '<div class="ex-name">' + (s && s.name ? s.name : "Workout") + '</div>' +
        '<button class="btn" type="button" id="emptyRepeat">Repeat last workout</button>' +
        '<button class="btn ghost" type="button" data-act="go-library">All exercises</button>';
      view.insertBefore(box, view.firstChild);
    }
    if (grids.length && view.querySelector("#emptyTrain")) view.querySelector("#emptyTrain").remove();
  }
  document.addEventListener("click", function (e) {
    if (e.target.id === "emptyRepeat") {
      var again = document.getElementById("repeatLast");
      if (again) again.click();
      else {
        var ws = load("il_workouts", []);
        if (!ws[0]) return;
        var w = ws[0];
        localStorage.setItem("il_session", JSON.stringify({
          id: "s" + Date.now(), name: w.name || "Workout", ts: Date.now(),
          exercises: (w.exercises || []).map(function (ex) {
            var sets = ex.sets || [];
            var prev = sets[sets.length - 1] || {};
            return { n: ex.n, t: ex.t || "", m: ex.m || "", sets: [0, 1, 2].map(function () { return { w: prev.w || "", r: prev.r || "", done: false }; }) };
          })
        }));
        var btn = document.querySelector('.nav button[data-view="workout"]');
        if (btn) btn.click();
      }
      return;
    }
    var tog = e.target.closest("[data-act='toggle-set']");
    if (!tog) return;
    setTimeout(function () {
      var i = tog.getAttribute("data-i");
      var si = Number(tog.getAttribute("data-si"));
      var next = document.querySelector("[data-act='set-w'][data-i='" + i + "'][data-si='" + (si + 1) + "']");
      if (!next) next = document.querySelector("[data-act='set-w'][data-i='" + (Number(i) + 1) + "'][data-si='0']");
      if (next) {
        next.focus();
        try { next.scrollIntoView({ block: "center" }); } catch (err) {}
      }
    }, 80);
  }, true);
  css();
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(paint, 90); });
  });
  setInterval(function () {
    if (document.getElementById("view-workout") && document.getElementById("view-workout").classList.contains("active")) paint();
  }, 1200);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
})();
