(function () {
  var BOWFLEX = [2.3,3.4,4.5,5.7,6.8,7.9,9.1,10.2,11.3,12.5,13.6,14.7,15.9,18.1,20.4,22.7,23.8,24.9,27.2,29.5,31.8,34.0,36.3,38.6,40.8];
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c]; }); }
  function snap(w) {
    var n = Number(w) || 0, best = BOWFLEX[0], d = Math.abs(n - best);
    BOWFLEX.forEach(function (s) { var x = Math.abs(n - s); if (x < d) { d = x; best = s; } });
    return best;
  }
  function workouts() { return load("il_workouts", []); }
  function session() { return load("il_session", null); }
  function lastMaxes(name, n) {
    var out = [];
    workouts().forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        if (e.n !== name) return;
        var best = 0;
        (e.sets || []).forEach(function (s) { if (s.done && Number(s.w) > best) best = Number(s.w); });
        if (best) out.push({ ts: w.ts, w: best, sets: e.sets });
      });
    });
    return out.slice(0, n || 5);
  }
  function plateau(name) {
    var m = lastMaxes(name, 3);
    if (m.length < 3) return null;
    if (m[0].w === m[1].w && m[1].w === m[2].w) return m[0].w;
    return null;
  }
  function workingWeight(ex) {
    var done = (ex.sets || []).filter(function (s) { return Number(s.w) > 0; });
    if (!done.length) { var last = lastMaxes(ex.n, 1)[0]; return last ? last.w : 0; }
    return Math.max.apply(null, done.map(function (s) { return Number(s.w) || 0; }));
  }
  function weekBounds(offset) {
    var now = new Date(); var day = (now.getDay() + 6) % 7;
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day - offset * 7);
    start.setHours(0,0,0,0); return [start.getTime(), start.getTime() + 7 * 864e5];
  }
  function volumeByMuscle(from, to) {
    var map = {};
    workouts().forEach(function (w) {
      if (w.ts < from || w.ts >= to) return;
      (w.exercises || []).forEach(function (e) {
        var m = e.m || "Other";
        (e.sets || []).forEach(function (s) { if (s.done) map[m] = (map[m] || 0) + (Number(s.w) || 0) * (Number(s.r) || 0); });
      });
    });
    return map;
  }
  var clockId = null;
  function clockText(ms) {
    var s = Math.floor(ms / 1000), m = Math.floor(s / 60); s = s % 60; var h = Math.floor(m / 60); m = m % 60;
    function z(n) { return (n < 10 ? "0" : "") + n; }
    return h ? h + ":" + z(m) + ":" + z(s) : z(m) + ":" + z(s);
  }
  function ensureClockStart() {
    var s = session(); if (!s || !s.exercises || !s.exercises.length) return;
    if (!s.clockStart) { s.clockStart = Date.now(); save("il_session", s); }
  }
  function paintClock() {
    var view = document.getElementById("view-workout"); if (!view || !view.classList.contains("active")) return;
    var s = session(); if (!s || !s.clockStart) return;
    var el = document.getElementById("sessClock");
    if (!el) {
      var row = view.querySelector(".row.space"); if (!row) return;
      el = document.createElement("span"); el.id = "sessClock"; el.className = "tiny"; el.style.letterSpacing = "0.04em";
      row.insertBefore(el, row.firstChild);
    }
    el.textContent = clockText(Date.now() - s.clockStart);
  }
  function enhanceHomeMore() {
    var view = document.getElementById("view-home"); if (!view || !view.classList.contains("active")) return;
    if (view.querySelector("#volWeek")) return;
    var tw = weekBounds(0), lw = weekBounds(1), nowV = volumeByMuscle(tw[0], tw[1]), lastV = volumeByMuscle(lw[0], lw[1]);
    var muscles = ["Chest","Back","Shoulders","Quads","Hamstrings","Calves","Biceps","Triceps","Core","Glutes"];
    var card = document.createElement("div"); card.id = "volWeek"; card.className = "card";
    var rows = muscles.filter(function (m) { return (nowV[m] || 0) + (lastV[m] || 0); }).map(function (m) {
      var a = Math.round(nowV[m] || 0), b = Math.round(lastV[m] || 0);
      var delta = b ? Math.round((a - b) / b * 100) : (a ? 100 : 0);
      return '<div class="row space" style="margin-top:8px"><div>' + m + '</div><div class="tiny">' + a + " this wk" + (b ? " · " + (delta >= 0 ? "+" : "") + delta + "%" : "") + "</div></div>";
    }).join("");
    card.innerHTML = '<div class="tiny">Weekly volume (kg x reps)</div>' + (rows || '<div class="tiny" style="margin-top:8px">No sets this week yet.</div>');
    var stats = view.querySelector(".stats"); if (stats) stats.insertAdjacentElement("afterend", card); else view.appendChild(card);
  }
  function enhanceTrainMore() {
    var view = document.getElementById("view-workout"); if (!view || !view.classList.contains("active")) return;
    var s = session(); if (!s) return;
    ensureClockStart(); paintClock();
    var cards = view.querySelectorAll(".card");
    (s.exercises || []).forEach(function (ex, i) {
      var card = cards[i]; if (!card) return;
      var nameEl = card.querySelector(".ex-name");
      if (nameEl && !nameEl.getAttribute("data-act")) { nameEl.setAttribute("data-act", "lift-hist"); nameEl.setAttribute("data-i", String(i)); nameEl.style.cursor = "pointer"; }
      if (!card.querySelector("[data-act='add-wu']")) {
        var lastRow = card.querySelectorAll(".row"); lastRow = lastRow[lastRow.length - 1];
        if (lastRow) { var wu = document.createElement("button"); wu.className = "btn sm ghost"; wu.type = "button"; wu.setAttribute("data-act", "add-wu"); wu.setAttribute("data-i", String(i)); wu.textContent = "Warm-up"; lastRow.appendChild(wu); }
      }
      if (!card.querySelector(".stall-flag")) {
        var stall = plateau(ex.n);
        if (stall) {
          var flag = document.createElement("div"); flag.className = "tiny stall-flag";
          flag.style.cssText = "margin-top:8px;text-transform:none;letter-spacing:0;color:#ff6b3d";
          flag.textContent = "Stalled at " + stall + " kg for 3 sessions. Add a rep or the next click.";
          var grid = card.querySelector(".set-grid"); if (grid) card.insertBefore(flag, grid); else card.appendChild(flag);
        }
      }
    });
  }
  function showHist(i) {
    var s = session(); if (!s || !s.exercises[i]) return;
    var name = s.exercises[i].n, rows = lastMaxes(name, 5);
    var html = '<div class="grab"></div><div class="ex-name" style="margin-bottom:8px">' + esc(name) + "</div>";
    if (!rows.length) html += '<div class="tiny">No previous sets.</div>';
    rows.forEach(function (r) {
      var line = (r.sets || []).filter(function (x) { return x.done && x.w && x.r; }).map(function (x) { return x.w + "x" + x.r; }).join("  ");
      html += '<div class="card"><div class="tiny">' + new Date(r.ts).toLocaleDateString(undefined, { day: "numeric", month: "short" }) + '</div><div style="margin-top:6px">' + esc(line || (r.w + " kg")) + "</div></div>";
    });
    var sheet = document.getElementById("sheet"), modal = document.getElementById("modal");
    if (sheet && modal) { sheet.innerHTML = html; modal.classList.add("show"); }
  }
  function addWarmups(i) {
    var s = session(); if (!s || !s.exercises[i]) return;
    var ex = s.exercises[i], top = workingWeight(ex); if (!top) return;
    var w1 = snap(top * 0.5), w2 = snap(top * 0.75); if (w2 >= top) w2 = snap(top * 0.7);
    if ((ex.sets || []).some(function (x) { return x.wu; })) return;
    ex.sets = [{ id: uid(), w: String(w1), r: "8", done: false, wu: true }, { id: uid(), w: String(w2), r: "5", done: false, wu: true }].concat(ex.sets || []);
    save("il_session", s);
    document.querySelector('.nav button[data-view="workout"]').click();
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]"); if (!t) return;
    var act = t.getAttribute("data-act");
    if (act === "add-wu") addWarmups(Number(t.getAttribute("data-i")));
    if (act === "lift-hist") showHist(Number(t.getAttribute("data-i")));
    if (act === "start-fresh" || act === "repeat-last" || act === "load-routine" || act === "copy-work" || act === "edit-work") {
      setTimeout(function () { var s = session(); if (s && !s.clockStart) { s.clockStart = Date.now(); save("il_session", s); } }, 40);
    }
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-act='finish']")) return;
    var s = session(); if (s && s.clockStart) save("il_clock_snap", Math.round((Date.now() - s.clockStart) / 1000));
  }, true);
  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-act='finish']")) return;
    setTimeout(function () {
      var sec = load("il_clock_snap", null); if (!sec) return;
      var list = workouts(); if (list[0] && !list[0].durationSec) { list[0].durationSec = sec; save("il_workouts", list); }
      save("il_clock_snap", null);
    }, 150);
  });
  if (!clockId) clockId = setInterval(paintClock, 1000);
  var obs = new MutationObserver(function () { enhanceHomeMore(); enhanceTrainMore(); });
  setTimeout(function () {
    ["view-home", "view-workout"].forEach(function (id) { var n = document.getElementById(id); if (n) obs.observe(n, { childList: true }); });
    enhanceHomeMore(); enhanceTrainMore();
  }, 600);
})();
