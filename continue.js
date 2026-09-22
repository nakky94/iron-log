(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function shortName(n) {
    return String(n || "").replace(/^Dumbbell\s/, "").replace(/\sMachine$/, "");
  }
  function lastMoves() {
    var ws = load("il_workouts", []);
    var seen = {}, out = [];
    ws.forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        if (!e.n || seen[e.n]) return;
        seen[e.n] = true;
        out.push(e);
      });
    });
    return out.slice(0, 8);
  }
  function session() { return load("il_session", null); }
  function inSession(name) {
    var s = session();
    return !!(s && (s.exercises || []).some(function (e) { return e.n === name; }));
  }
  function blankSets(ex) {
    var n = Math.max(3, (ex.sets || []).length || 3);
    var sets = [];
    for (var i = 0; i < n; i++) sets.push({ w: "", r: "", done: false });
    if (window.gymSuggest) {
      var g = window.gymSuggest(ex.n, ex.t);
      sets.forEach(function (s) { if (g.w) s.w = g.w; if (g.r) s.r = g.r; });
    }
    return sets;
  }
  function addMove(ex) {
    var s = session() || { id: "s" + Date.now(), name: "Workout", ts: Date.now(), exercises: [] };
    if ((s.exercises || []).some(function (e) { return e.n === ex.n; })) return;
    s.exercises.push({ n: ex.n, t: ex.t || "", m: ex.m || "", sets: blankSets(ex) });
    save("il_session", s);
    var btn = document.querySelector('.nav button[data-view="workout"]');
    if (btn) btn.click();
  }
  function addAll(list) {
    list.forEach(addMove);
  }
  function paint() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var moves = lastMoves().filter(function (e) { return !inSession(e.n); });
    var box = view.querySelector("#continueBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "continueBox";
      var rest = view.querySelector("#restBar");
      if (rest) rest.insertAdjacentElement("afterend", box);
      else view.insertBefore(box, view.firstChild);
    }
    if (!moves.length) {
      box.innerHTML = '<button class="btn ghost" type="button" data-act="go-library" style="margin-bottom:8px">All exercises</button>';
      return;
    }
    var html = '<div class="tiny" style="margin:4px 0 8px">Continue</div>';
    moves.forEach(function (e) {
      html += '<button class="card" type="button" data-cont-n="' + encodeURIComponent(e.n) + '" style="width:100%;text-align:left">' +
        '<div class="ex-name">' + shortName(e.n) + '</div>' +
        '<div class="tiny">' + (e.t || e.m || "") + '</div></button>';
    });
    html += '<button class="btn" type="button" id="contAll" style="margin:4px 0 8px">Add all</button>';
    html += '<button class="btn ghost" type="button" data-act="go-library">All exercises</button>';
    box.innerHTML = html;
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cont-n]");
    if (btn) {
      e.preventDefault();
      var name = decodeURIComponent(btn.getAttribute("data-cont-n"));
      var ex = lastMoves().filter(function (x) { return x.n === name; })[0];
      if (ex) addMove(ex);
      setTimeout(paint, 80);
      return;
    }
    if (e.target.id === "contAll") {
      addAll(lastMoves().filter(function (e2) { return !inSession(e2.n); }));
      setTimeout(paint, 80);
    }
  }, true);
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(paint, 80); });
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(paint, 120); });
  else setTimeout(paint, 120);
})();
