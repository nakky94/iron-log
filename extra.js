(function () {
  var REST = { default: 90, "Dumbbell Shoulder Press": 150, "Incline Dumbbell Press": 150, "Dumbbell Bench Press": 150, "Arnold Press": 120, "Dumbbell Row": 120, "Dumbbell Romanian Deadlift": 150, "Goblet Squat": 120, "Dumbbell Sumo Squat": 120, "Bulgarian Split Squat": 120, "Walking Lunge": 90, "Reverse Lunge": 90, "Dumbbell Lunge": 90, "Standing Calf Raise Machine": 60, "Dumbbell Calf Raise": 60, "Dumbbell Overhead Tricep Ext": 75, "Dumbbell Bicep Curl": 60, "Dumbbell Hammer Curl": 60, "Dumbbell Lateral Raise": 45, "Front Raise": 45, "Dumbbell Fly": 60, "Dumbbell Shrug": 75, "Dumbbell Side Bend": 45, "Lat Pulldown": 90 };
  var CHARTS = ["Dumbbell Shoulder Press", "Incline Dumbbell Press", "Dumbbell Bench Press", "Dumbbell Row", "Dumbbell Romanian Deadlift", "Goblet Squat"];
  var NAME_MAP = {"Leg Extension Machine":["Leg Extension","machine","Quads"],"Standing Calf Raise Machine":["Standing Calf Raise Machine","machine","Calves"],"Seated Leg Curl Machine":["Seated Leg Curl","machine","Hamstrings"],"Dumbbell Curl":["Dumbbell Bicep Curl","dumbbell","Biceps"],"Dumbbell Overhead Triceps Extension":["Dumbbell Overhead Tricep Ext","dumbbell","Triceps"],"Seated Dumbbell Press":["Dumbbell Shoulder Press","dumbbell","Shoulders"],"Flat Dumbbell Bench Press":["Dumbbell Bench Press","dumbbell","Chest"],"Dumbbell Row":["Dumbbell Row","dumbbell","Back"],"Tricep extension":["Tricep Pushdown","machine","Triceps"],"Hip Abduction (Open)":["Hip Abduction Machine","machine","Glutes"],"Hip Adduction":["Hip Adduction Machine","machine","Glutes"],"Glute Press":["Glute Kickback Machine","machine","Glutes"],"Arnold Dumbbell Press":["Arnold Press","dumbbell","Shoulders"],"Lat Pulldown":["Lat Pulldown","machine","Back"],"Dumbbell Goblet Squat":["Goblet Squat","dumbbell","Quads"],"Dumbbell Romanian Deadlift":["Dumbbell Romanian Deadlift","dumbbell","Hamstrings"],"Dumbbell Bulgarian Split Squats":["Bulgarian Split Squat","dumbbell","Quads"],"Dumbbell Lunges":["Walking Lunge","dumbbell","Quads"],"Dumbbell Reverse Lunges":["Reverse Lunge","dumbbell","Quads"],"Incline Dumbbell Bench Press":["Incline Dumbbell Press","dumbbell","Chest"],"Incline Dumbbell Fly":["Dumbbell Fly","dumbbell","Chest"],"Dumbbell Sumo Squat":["Dumbbell Sumo Squat","dumbbell","Quads"],"Seated Machine Curl":["Bicep Curl Machine","machine","Biceps"],"Lever Preacher Curl":["Preacher Curl","machine","Biceps"],"Dumbbell Side Bend":["Dumbbell Side Bend","dumbbell","Core"],"Dumbbell Calf Raise":["Dumbbell Calf Raise","dumbbell","Calves"],"Front Dumbbell Raise":["Front Raise","dumbbell","Shoulders"],"Dumbbell Shrug":["Dumbbell Shrug","dumbbell","Shoulders"],"Dumbbell Hammer Curl":["Dumbbell Hammer Curl","dumbbell","Biceps"],"Flat Dumbbell Fly":["Dumbbell Fly","dumbbell","Chest"]};
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c]; }); }
  function workouts() { return load("il_workouts", []); }
  function dateLabel(ts) { var d = new Date(ts); return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
  function setLine(sets) { return (sets || []).filter(function (s) { return s.done && s.w && s.r; }).map(function (s) { return s.w + "x" + s.r; }).join("  "); }
  function parseFitNotes(text) {
    var lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/); lines.shift(); var days = {};
    lines.forEach(function (line) { if (!line) return; var p = line.split(","); var date = p[0], raw = p[1], cat = p[2], w = p[3], reps = p[5]; if (!days[date]) days[date] = []; days[date].push({ raw: raw, cat: cat, w: w, r: reps }); });
    var out = [], prs = {};
    Object.keys(days).sort().forEach(function (date) {
      var exercises = [], cur = null;
      days[date].forEach(function (row) {
        var mapped = NAME_MAP[row.raw] || [row.raw, /dumbbell/i.test(row.raw) ? "dumbbell" : "machine", row.cat === "Abs" ? "Core" : row.cat];
        var n = mapped[0], t = mapped[1], m = mapped[2];
        var set = { id: uid(), w: row.w ? String(Number(row.w)) : "", r: row.r ? String(parseInt(row.r, 10)) : "", done: true };
        if (cur && cur.n === n) cur.sets.push(set); else { cur = { eid: "imp-" + n, n: n, t: t, m: m, sets: [set], note: "" }; exercises.push(cur); }
        var loadN = Number(row.w) || 0, repsN = Number(row.r) || 0;
        if (loadN && repsN) { var est = loadN * (1 + repsN / 30), curp = prs[n]; if (!curp || est > curp.est || loadN > curp.w) prs[n] = { w: loadN, r: repsN, est: est, ts: Date.parse(date + "T12:00:00"), unit: "kg" }; }
      });
      out.push({ id: "fn-" + date, name: "Gym " + date.slice(5), ts: Date.parse(date + "T12:00:00"), exercises: exercises, notes: "" });
    });
    out.sort(function (a, b) { return b.ts - a.ts; });
    return { workouts: out, prs: prs };
  }
  function seedTemplates() {
    if (load("il_routines", []).length) return;
    save("il_routines", [
      { id: "tpl-press", name: "Press day", exercises: [{ eid: "s", n: "Dumbbell Shoulder Press", t: "dumbbell", m: "Shoulders" }, { eid: "s", n: "Incline Dumbbell Press", t: "dumbbell", m: "Chest" }, { eid: "s", n: "Dumbbell Fly", t: "dumbbell", m: "Chest" }, { eid: "s", n: "Dumbbell Row", t: "dumbbell", m: "Back" }, { eid: "s", n: "Dumbbell Overhead Tricep Ext", t: "dumbbell", m: "Triceps" }] },
      { id: "tpl-legs", name: "Leg day", exercises: [{ eid: "s", n: "Goblet Squat", t: "dumbbell", m: "Quads" }, { eid: "s", n: "Dumbbell Romanian Deadlift", t: "dumbbell", m: "Hamstrings" }, { eid: "s", n: "Standing Calf Raise Machine", t: "machine", m: "Calves" }, { eid: "s", n: "Bulgarian Split Squat", t: "dumbbell", m: "Quads" }] }
    ]);
  }
  function migrate() {
    if (load("il_seeded", "") === "fitnotes-v2") { seedTemplates(); return; }
    fetch("fitnotes.csv").then(function (r) { return r.text(); }).then(function (t) {
      var seed = parseFitNotes(t);
      var keep = workouts().filter(function (w) { return String(w.id).indexOf("fn-") !== 0; });
      save("il_workouts", seed.workouts.concat(keep).sort(function (a, b) { return b.ts - a.ts; }));
      save("il_prs", seed.prs); save("il_seeded", "fitnotes-v2"); seedTemplates();
      var home = document.querySelector('.nav button[data-view="home"]'); if (home) home.click();
    }).catch(function () { seedTemplates(); });
  }
  function cloneWorkout(w, keepSets) {
    return { id: uid(), name: w.name || "Workout", ts: Date.now(), notes: "", editOf: keepSets ? w.id : null, exercises: (w.exercises || []).map(function (e) {
      var g = window.gymSuggest ? window.gymSuggest(e.n, e.t) : null;
      return { eid: e.eid, n: e.n, t: e.t, m: e.m, sets: (e.sets && e.sets.length ? e.sets : [{}, {}, {}]).map(function (s) {
        if (keepSets) return { id: uid(), w: s.w || "", r: s.r || "", done: false };
        return { id: uid(), w: (g && g.w) || s.w || "", r: (g && g.r) || s.r || "", done: false };
      }) };
    }) };
  }
  function findWork(id) { return workouts().filter(function (w) { return w.id === id; })[0]; }
  var histQ = "", histRange = "all", openIds = {};
  function filteredWorkouts() {
    var ws = workouts(), now = Date.now();
    if (histRange === "14") ws = ws.filter(function (w) { return now - w.ts < 14 * 864e5; });
    if (histQ) { var q = histQ.toLowerCase(); ws = ws.filter(function (w) { return (w.name || "").toLowerCase().indexOf(q) !== -1 || (w.exercises || []).some(function (e) { return e.n.toLowerCase().indexOf(q) !== -1; }); }); }
    return ws;
  }
  function enhanceHome() {
    var view = document.getElementById("view-home"); if (!view || !view.classList.contains("active")) return;
    if (view.querySelector("[data-act='repeat-last']")) return;
    var last = workouts()[0], start = view.querySelector("[data-act='start-fresh']");
    if (last && start) { var b = document.createElement("button"); b.className = "btn ghost"; b.type = "button"; b.setAttribute("data-act", "repeat-last"); b.style.marginTop = "8px"; b.textContent = "Repeat " + (last.name || "last workout"); start.insertAdjacentElement("afterend", b); }
  }
  function enhanceHistory(force) {
    var view = document.getElementById("view-history"); if (!view || !view.classList.contains("active")) return;
    if (!force && view.querySelector("#histSearch")) return;
    var ws = filteredWorkouts();
    var html = '<input id="histSearch" placeholder="Search lift or session" value="' + esc(histQ) + '" /><div class="chips">';
    html += '<button class="chip' + (histRange === "all" ? " on" : "") + '" type="button" data-act="hist-range" data-v="all">All</button>';
    html += '<button class="chip' + (histRange === "14" ? " on" : "") + '" type="button" data-act="hist-range" data-v="14">Last 14 days</button>';
    html += '<button class="btn sm ghost" type="button" data-act="export-json">Export JSON</button>';
    html += '<button class="btn sm ghost" type="button" data-act="export-csv">Export CSV</button></div>';
    html += '<div class="tiny" style="margin-bottom:8px">' + ws.length + ' sessions</div>';
    if (!ws.length) html += '<div class="card empty">No matching sessions.</div>';
    ws.forEach(function (w) {
      var open = !!openIds[w.id];
      html += '<div class="card"><div class="row space"><div><div class="ex-name">' + esc(w.name) + '</div><div class="tiny">' + dateLabel(w.ts) + '</div></div>';
      html += '<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm ghost" type="button" data-act="toggle-open" data-id="' + w.id + '">' + (open ? "Hide" : "Sets") + '</button>';
      html += '<button class="btn sm" type="button" data-act="copy-work" data-id="' + w.id + '">Use</button>';
      html += '<button class="btn sm ghost" type="button" data-act="edit-work" data-id="' + w.id + '">Edit</button>';
      html += '<button class="btn sm ghost" type="button" data-act="del-work" data-id="' + w.id + '">X</button></div></div>';
      w.exercises.forEach(function (e) {
        html += '<div style="margin-top:8px"><div>' + esc(e.n) + '</div>';
        html += open ? '<div class="tiny" style="text-transform:none;letter-spacing:0;margin-top:4px">' + esc(setLine(e.sets) || "No completed sets") + '</div>' : '<div class="tiny">' + e.sets.filter(function (s) { return s.done; }).length + ' sets</div>';
        html += '</div>';
      });
      html += '</div>';
    });
    view.innerHTML = html;
    var search = document.getElementById("histSearch");
    if (search) search.addEventListener("input", function () { histQ = search.value; enhanceHistory(true); });
  }
  function spark(points) {
    var max = Math.max.apply(null, points.map(function (p) { return p.w; })), min = Math.min.apply(null, points.map(function (p) { return p.w; }));
    var span = Math.max(1, max - min), w = 280, h = 64;
    var d = points.map(function (p, i) { var x = points.length === 1 ? w / 2 : (i / (points.length - 1)) * w; var y = h - ((p.w - min) / span) * (h - 8) - 4; return x.toFixed(1) + "," + y.toFixed(1); }).join(" ");
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="64" preserveAspectRatio="none"><polyline fill="none" stroke="#FFD400" stroke-width="2.5" points="' + d + '" /></svg>';
  }
  function enhanceProgress() {
    var view = document.getElementById("view-progress"); if (!view || !view.classList.contains("active")) return;
    if (view.querySelector(".chart-card")) return;
    var ws = workouts().slice().sort(function (a, b) { return a.ts - b.ts; }), block = document.createElement("div");
    CHARTS.forEach(function (name) {
      var pts = [];
      ws.forEach(function (w) { w.exercises.forEach(function (e) { if (e.n !== name) return; var best = 0; e.sets.forEach(function (s) { if (s.done && Number(s.w) > best) best = Number(s.w); }); if (best) pts.push({ w: best }); }); });
      if (pts.length < 2) return;
      var card = document.createElement("div"); card.className = "card chart-card";
      card.innerHTML = '<div class="row space"><div class="ex-name">' + esc(name) + '</div><div class="tiny">' + pts[0].w + ' → ' + pts[pts.length - 1].w + ' kg</div></div>' + spark(pts);
      block.appendChild(card);
    });
    if (block.childNodes.length) view.insertBefore(block, view.firstChild);
  }
  var myTimer = null, left = 0;
  function startRest(sec) { left = sec || 90; var wrap = document.getElementById("timer"); if (wrap) wrap.classList.add("show"); tick(); clearInterval(myTimer); myTimer = setInterval(tick, 1000); }
  function tick() { var clock = document.getElementById("clock"); if (!clock) return; var m = Math.floor(left / 60), s = String(left % 60); if (s.length < 2) s = "0" + s; clock.textContent = m + ":" + s; clock.classList.toggle("warn", left <= 10); if (left <= 0) { clearInterval(myTimer); return; } left -= 1; }
  function restFor(name) { return REST[name] || REST.default; }
  function download(name, text, type) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; a.click(); }
  function exportJSON() { download("gym-log.json", JSON.stringify({ workouts: workouts(), routines: load("il_routines", []), prs: load("il_prs", {}), unit: "kg" }, null, 2), "application/json"); }
  function exportCSV() { var rows = ["Date,Exercise,Category,Weight,Reps"]; workouts().forEach(function (w) { var day = new Date(w.ts).toISOString().slice(0, 10); w.exercises.forEach(function (e) { e.sets.forEach(function (s) { if (!s.done) return; rows.push([day, '"' + e.n.replace(/"/g, "") + '"', e.m || "", s.w || "", s.r || ""].join(",")); }); }); }); download("gym-log.csv", rows.join("\n"), "text/csv"); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]"); if (!t) return;
    var act = t.getAttribute("data-act"), id = t.getAttribute("data-id"), w;
    if (act === "repeat-last") { w = workouts()[0]; if (!w) return; save("il_session", cloneWorkout(w, false)); document.querySelector('.nav button[data-view="workout"]').click(); }
    if (act === "copy-work") { w = findWork(id); if (!w) return; save("il_session", cloneWorkout(w, false)); document.querySelector('.nav button[data-view="workout"]').click(); }
    if (act === "edit-work") { w = findWork(id); if (!w) return; save("il_session", cloneWorkout(w, true)); save("il_edit_of", w.id); document.querySelector('.nav button[data-view="workout"]').click(); }
    if (act === "toggle-open") { openIds[id] = !openIds[id]; enhanceHistory(true); }
    if (act === "hist-range") { histRange = t.getAttribute("data-v"); enhanceHistory(true); }
    if (act === "export-json") exportJSON();
    if (act === "export-csv") exportCSV();
    if (act === "timer-skip") clearInterval(myTimer);
    if (act === "finish") { setTimeout(function () { var oid = load("il_edit_of", null); if (!oid) return; var list = workouts(); if (!list.length) return; var neu = list[0]; neu.editOf = null; save("il_workouts", [neu].concat(list.slice(1).filter(function (x) { return x.id !== oid; }))); save("il_edit_of", null); }, 120); }
  });
  var obs = new MutationObserver(function () { enhanceHome(); if (document.getElementById("view-history") && document.getElementById("view-history").classList.contains("active")) enhanceHistory(false); enhanceProgress(); });
  setTimeout(function () { ["view-home", "view-history", "view-progress"].forEach(function (id) { var n = document.getElementById(id); if (n) obs.observe(n, { childList: true }); }); migrate(); enhanceHome(); }, 500);
})();
