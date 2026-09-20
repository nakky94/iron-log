(function(){
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
  function lastLogged(name) {
    var ws = load("il_workouts", []), i, e, sets, maxW = 0, reps = 0;
    for (i = 0; i < ws.length; i++) {
      e = (ws[i].exercises || []).filter(function (x) { return x.n === name; })[0];
      if (!e) continue;
      sets = (e.sets || []).filter(function (s) { return s.done && Number(s.w) > 0 && Number(s.r) > 0; });
      if (!sets.length) continue;
      sets.forEach(function (s) { if (Number(s.w) > maxW) maxW = Number(s.w); });
      sets.filter(function (s) { return Number(s.w) === maxW; }).forEach(function (s) { reps = Math.max(reps, Number(s.r)); });
      return { w: maxW, r: reps, nSets: sets.length };
    }
    return null;
  }
  window.gymSuggest = function (name, kind) {
    var last = lastLogged(name);
    if (!last) return { w: "", r: "10", nSets: 3, tip: "No history. Start at a comfortable 10 kg x 10." };
    var hit = last.r >= 10, w, r, tip;
    if (kind === "dumbbell") {
      if (hit) { w = nextDumbbell(last.w); r = "8"; tip = "Hit " + last.w + " kg x " + last.r + ". Next Bowflex: " + w + " kg x 8."; }
      else { w = nearestStep(last.w, BOWFLEX); r = String(Math.min(12, last.r + 1)); tip = "Stay " + w + " kg and chase " + r + " (last " + last.r + ")."; }
    } else {
      if (hit) { w = nextMachine(last.w); r = "8"; tip = "Hit " + last.w + " kg x " + last.r + ". Next stack: " + w + " kg x 8."; }
      else { w = last.w; r = String(Math.min(12, last.r + 1)); tip = "Stay " + w + " kg and chase " + r + "."; }
    }
    return { w: String(w), r: r, nSets: Math.max(3, last.nSets || 3), tip: tip };
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
    var cards = view.querySelectorAll(".card");
    s.exercises.forEach(function (ex, i) {
      var card = cards[i];
      if (!card) return;
      if (card.querySelector(".sg-tip")) return;
      var g = window.gymSuggest(ex.n, ex.t);
      if (!g.tip) return;
      var tip = document.createElement("div");
      tip.className = "tiny sg-tip";
      tip.style.cssText = "margin-top:8px;text-transform:none;letter-spacing:0";
      tip.textContent = g.tip;
      var grid = card.querySelector(".set-grid");
      if (grid) card.insertBefore(tip, grid);
      else card.appendChild(tip);
    });
  }
  function applySoon(force) {
    setTimeout(function () {
      fillSession(!!force);
      var view = document.getElementById("view-workout");
      if (view && view.classList.contains("active")) {
        var btn = document.querySelector('.nav button[data-view="workout"]');
        if (btn) btn.click();
        setTimeout(paintTips, 30);
      } else paintTips();
    }, 20);
  }
  document.addEventListener("click", function (e) {
    if (e.target && (e.target.id === "unitBtn" || (e.target.closest && e.target.closest("#unitBtn")))) {
      e.stopPropagation();
      save("il_unit", "kg");
      var lab = document.getElementById("unitBtn");
      if (lab) lab.textContent = "KG";
      return;
    }
    var t = e.target.closest("[data-act], [data-view]");
    if (!t) return;
    var act = t.getAttribute("data-act");
    var view = t.getAttribute("data-view");
    if (act === "add-ex" || act === "load-routine") applySoon(false);
    if (act === "apply-sg") applySoon(true);
    if (view === "workout") setTimeout(paintTips, 40);
  }, true);
  setTimeout(function () {
    var lab = document.getElementById("unitBtn");
    if (lab) lab.textContent = "KG";
    paintTips();
  }, 400);
})();
