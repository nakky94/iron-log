(function () {
  var BOWFLEX = [2.3,3.4,4.5,5.7,6.8,7.9,9.1,10.2,11.3,12.5,13.6,14.7,15.9,18.1,20.4,22.7,23.8,24.9,27.2,29.5,31.8,34.0,36.3,38.6,40.8];
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  save("il_unit", "kg");
  function nearestStep(w, steps) {
    var n = Number(w), best = steps[0], d = Math.abs(n - best);
    steps.forEach(function (s) { var x = Math.abs(n - s); if (x < d) { d = x; best = s; } });
    return best;
  }
  function nextDumbbell(w) {
    var n = Number(w) || 0, snap = nearestStep(n, BOWFLEX), i = BOWFLEX.indexOf(snap);
    if (n > snap + 0.15 && i < BOWFLEX.length - 1) i += 1;
    if (i < BOWFLEX.length - 1) return BOWFLEX[i + 1];
    return BOWFLEX[BOWFLEX.length - 1];
  }
  function nextMachine(w) { return Math.round(((Number(w) || 0) + 2.5) * 2) / 2; }
  function workingSets(ex) {
    return (ex.sets || []).filter(function (s) { return Number(s.w) > 0 && Number(s.r) > 0 && (s.done !== false || s.done === true); });
  }
  function lastLogged(name) {
    var ws = load("il_workouts", []), i, e, sets;
    for (i = 0; i < ws.length; i++) {
      e = (ws[i].exercises || []).filter(function (x) { return x.n === name; })[0];
      if (!e) continue;
      sets = workingSets(e);
      if (sets.length) return { sets: sets, w: e };
    }
    return null;
  }
  function planFrom(sets, kind) {
    if (!sets || !sets.length) return { tip: "No history yet" };
    var top = 0;
    sets.forEach(function (s) { if (Number(s.w) > top) top = Number(s.w); });
    var atTop = sets.filter(function (s) { return Number(s.w) === top; });
    var minR = Math.min.apply(null, atTop.map(function (s) { return Number(s.r); }));
    var allHit = atTop.every(function (s) { return Number(s.r) >= 8; });
    var allTen = atTop.every(function (s) { return Number(s.r) >= 10; });
    if (allHit) {
      var nw = kind === "dumbbell" ? nextDumbbell(top) : nextMachine(top);
      if (nw === top && kind === "dumbbell") {
        return { w: top, r: Math.min(12, minR + 1), tip: "Repeat " + top + " kg \u2014 aim for " + Math.min(12, minR + 1) + " reps" };
      }
      return { w: nw, r: allTen ? 8 : minR, tip: "Next time: " + nw + " kg \u00d7 " + (allTen ? 8 : minR) };
    }
    return { w: top, r: minR + 1, tip: "Repeat " + top + " kg \u2014 aim for " + (minR + 1) + " reps" };
  }
  window.gymSuggest = function (name, kind, liveEx) {
    var live = liveEx ? workingSets(liveEx).filter(function (s) { return s.done; }) : [];
    var source = live.length ? live : (lastLogged(name) || {}).sets;
    var p = planFrom(source, kind);
    return { w: p.w != null ? String(p.w) : "", r: p.r != null ? String(p.r) : "8", nSets: 3, tip: p.tip };
  };
  function fillSession(force) {
    var s = load("il_session", null);
    if (!s || !s.exercises) return false;
    var changed = false;
    s.exercises.forEach(function (ex) {
      var g = window.gymSuggest(ex.n, ex.t);
      (ex.sets || []).forEach(function (set) {
        if (set.done) return;
        if (force || !set.w || !set.r) {
          if (g.w) set.w = g.w;
          if (g.r) set.r = g.r;
          changed = true;
        }
      });
    });
    if (changed) save("il_session", s);
    return changed;
  }
  function paintTips() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var s = load("il_session", null);
    if (!s || !s.exercises) return;
    Array.prototype.slice.call(view.querySelectorAll(".card")).forEach(function (card) {
      var wIn = card.querySelector("[data-act='set-w']");
      if (!wIn) return;
      var i = Number(wIn.getAttribute("data-i"));
      var ex = s.exercises[i];
      if (!ex) return;
      var g = window.gymSuggest(ex.n, ex.t, ex);
      var tip = card.querySelector(".sg-tip");
      if (!tip) {
        tip = document.createElement("div");
        tip.className = "sg-tip";
        tip.style.cssText = "margin-top:8px;font-size:13px;font-weight:700;color:#FFD400";
        var grid = card.querySelector(".set-grid");
        if (grid) card.insertBefore(tip, grid);
        else card.appendChild(tip);
      }
      tip.textContent = g.tip || "";
    });
  }
  function applySoon(force) {
    setTimeout(function () {
      fillSession(!!force);
      paintTips();
    }, 30);
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act], [data-view]");
    if (!t) return;
    var act = t.getAttribute("data-act");
    var view = t.getAttribute("data-view");
    if (act === "add-ex" || act === "load-routine") applySoon(false);
    if (act === "toggle-set" || act === "add-set") setTimeout(paintTips, 80);
    if (view === "workout") setTimeout(paintTips, 40);
  }, true);
  setTimeout(paintTips, 400);
  setInterval(function () {
    var view = document.getElementById("view-workout");
    if (view && view.classList.contains("active")) paintTips();
  }, 1500);
})();
