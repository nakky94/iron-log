(function () {
  const MUSCLES = ["Chest","Back","Shoulders","Biceps","Triceps","Quads","Hamstrings","Glutes","Calves","Core","Full Body"];
  const RAW = [
    ["Dumbbell Bench Press","dumbbell","Chest"],["Incline Dumbbell Press","dumbbell","Chest"],
    ["Dumbbell Fly","dumbbell","Chest"],["Dumbbell Pullover","dumbbell","Chest"],
    ["Chest Press Machine","machine","Chest"],["Pec Deck / Chest Fly Machine","machine","Chest"],
    ["Incline Chest Press Machine","machine","Chest"],["Cable Chest Fly","machine","Chest"],
    ["Dumbbell Row","dumbbell","Back"],["Single-Arm Dumbbell Row","dumbbell","Back"],
    ["Lat Pulldown","machine","Back"],["Seated Cable Row","machine","Back"],
    ["Assisted Pull-Up","machine","Back"],["Cable Face Pull","machine","Back"],
    ["Dumbbell Shoulder Press","dumbbell","Shoulders"],["Dumbbell Lateral Raise","dumbbell","Shoulders"],
    ["Dumbbell Rear Delt Fly","dumbbell","Shoulders"],["Arnold Press","dumbbell","Shoulders"],
    ["Shoulder Press Machine","machine","Shoulders"],["Lateral Raise Machine","machine","Shoulders"],
    ["Dumbbell Bicep Curl","dumbbell","Biceps"],["Dumbbell Hammer Curl","dumbbell","Biceps"],
    ["Incline Dumbbell Curl","dumbbell","Biceps"],["Bicep Curl Machine","machine","Biceps"],
    ["Cable Bicep Curl","machine","Biceps"],["Dumbbell Overhead Tricep Ext","dumbbell","Triceps"],
    ["Dumbbell Kickback","dumbbell","Triceps"],["Dumbbell Skull Crusher","dumbbell","Triceps"],
    ["Tricep Pushdown","machine","Triceps"],["Overhead Cable Extension","machine","Triceps"],
    ["Goblet Squat","dumbbell","Quads"],["Dumbbell Lunge","dumbbell","Quads"],
    ["Dumbbell Step-Up","dumbbell","Quads"],["Leg Press","machine","Quads"],
    ["Leg Extension","machine","Quads"],["Hack Squat Machine","machine","Quads"],
    ["Smith Machine Squat","machine","Quads"],["Dumbbell Romanian Deadlift","dumbbell","Hamstrings"],
    ["Lying Leg Curl","machine","Hamstrings"],["Seated Leg Curl","machine","Hamstrings"],
    ["Dumbbell Hip Thrust","dumbbell","Glutes"],["Hip Abduction Machine","machine","Glutes"],
    ["Hip Adduction Machine","machine","Glutes"],["Glute Kickback Machine","machine","Glutes"],
    ["Dumbbell Calf Raise","dumbbell","Calves"],["Standing Calf Raise Machine","machine","Calves"],
    ["Seated Calf Raise","machine","Calves"],["Dumbbell Side Bend","dumbbell","Core"],
    ["Weighted Crunch","dumbbell","Core"],["Cable Crunch","machine","Core"],
    ["Ab Machine","machine","Core"],["Dumbbell Thruster","dumbbell","Full Body"],
    ["Dumbbell Clean","dumbbell","Full Body"],["Smith Machine Deadlift","machine","Full Body"]
  ];
  const STOCK = RAW.map(function (e, i) { return { id: "s" + i, n: e[0], t: e[1], m: e[2], custom: false }; });
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (err) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ amp: "&#38;", lt: "&#60;", gt: "&#62;", quot: "&#34;" }[c === "&" ? "amp" : c === "<" ? "lt" : c === ">" ? "gt" : "quot"]); }); }
  function st() { return { unit: load("il_unit", "kg"), custom: load("il_custom", []), workouts: load("il_workouts", []), routines: load("il_routines", []), session: load("il_session", null), restSec: load("il_rest", 90) }; }
  function allEx() { return STOCK.concat(st().custom); }
  function saveSession(s) { save("il_session", s); }
  function el(id) { return document.getElementById(id); }
  function defaultSets() { return [1, 2, 3].map(function () { return { id: uid(), w: "", r: "", done: false }; }); }
  function ensureSession() { var s = st().session; if (!s) { s = { id: uid(), name: "Workout", ts: Date.now(), exercises: [], notes: "" }; saveSession(s); } return s; }
  var libType = "all", libMuscle = "all", libQ = "", timerLeft = 0, timerId = null, deferredPrompt = null;
  function showView(name) {
    document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
    document.querySelectorAll(".nav button").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-view") === name); });
    el("view-" + name).classList.add("active");
    if (name === "home") renderHome();
    if (name === "library") renderLibrary();
    if (name === "workout") renderWorkout();
    if (name === "history") renderHistory();
    if (name === "progress") renderProgress();
  }
  function renderHome() {
    var s = st(), weekAgo = Date.now() - 7 * 864e5, recent = s.workouts.filter(function (w) { return w.ts >= weekAgo; }), sets = 0;
    recent.forEach(function (w) { w.exercises.forEach(function (e) { e.sets.forEach(function (x) { if (x.done) sets += 1; }); }); });
    var html = '<div class="stats"><div class="card stat"><b>' + recent.length + '</b><span class="tiny">Sessions / 7d</span></div><div class="card stat"><b>' + sets + '</b><span class="tiny">Sets / 7d</span></div><div class="card stat"><b>' + s.routines.length + '</b><span class="tiny">Templates</span></div></div>';
    if (s.session && s.session.exercises && s.session.exercises.length) {
      html += '<div class="card"><div class="tiny">Workout in progress</div><div class="ex-name" style="margin:4px 0 10px">' + esc(s.session.name || "Open session") + " · " + s.session.exercises.length + ' moves</div><button class="btn" type="button" data-act="go-workout">Resume</button></div>';
    } else {
      html += '<button class="btn" type="button" data-act="start-fresh">Start empty workout</button><div style="height:8px"></div>';
    }
    html += '<div class="tiny" style="margin:14px 0 8px">Templates</div>';
    if (!s.routines.length) html += '<div class="card empty">No saved routines yet. Build a session and tap Save as template.</div>';
    else s.routines.forEach(function (r) {
      html += '<div class="card"><div class="row space"><div><div class="ex-name">' + esc(r.name) + '</div><div class="tiny">' + r.exercises.length + ' exercises</div></div><div class="row"><button class="btn sm" type="button" data-act="load-routine" data-id="' + r.id + '">Load</button><button class="btn sm ghost" type="button" data-act="del-routine" data-id="' + r.id + '">X</button></div></div></div>';
    });
    html += '<div class="tiny" style="margin:14px 0 8px">Quick add from gear</div><button class="btn ghost" type="button" data-act="go-library">Browse dumbbells and machines</button><div class="card install-banner" id="iosHint" style="margin-top:10px"><div class="tiny">Install on iPhone</div><div style="margin-top:6px">Share then Add to Home Screen.</div></div>';
    el("view-home").innerHTML = html;
    var isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (isiOS && !standalone) { var hint = el("iosHint"); if (hint) hint.classList.add("show"); }
  }
  function renderLibrary() {
    var list = allEx().filter(function (e) {
      if (libType !== "all" && e.t !== libType) return false;
      if (libMuscle !== "all" && e.m !== libMuscle) return false;
      if (libQ && e.n.toLowerCase().indexOf(libQ.toLowerCase()) === -1) return false;
      return true;
    });
    var html = '<input id="libSearch" placeholder="Search exercises" value="' + esc(libQ) + '" /><div class="chips">';
    [["all","All"],["dumbbell","Dumbbells"],["machine","Machines"]].forEach(function (p) {
      html += '<button class="chip' + (libType === p[0] ? " on" : "") + '" type="button" data-act="lib-type" data-v="' + p[0] + '">' + p[1] + "</button>";
    });
    html += '</div><div class="chips"><button class="chip' + (libMuscle === "all" ? " on" : "") + '" type="button" data-act="lib-muscle" data-v="all">All muscles</button>';
    MUSCLES.forEach(function (m) { html += '<button class="chip' + (libMuscle === m ? " on" : "") + '" type="button" data-act="lib-muscle" data-v="' + m + '">' + m + "</button>"; });
    html += '</div><button class="btn ghost" type="button" data-act="open-custom" style="margin-bottom:10px">+ Custom exercise</button>';
    if (!list.length) html += '<div class="empty">No matches.</div>';
    list.forEach(function (e) {
      html += '<div class="card"><div class="row space"><div class="grow"><div class="ex-name">' + esc(e.n) + '</div><div class="row" style="gap:6px;margin-top:6px"><span class="tag ' + (e.t === "dumbbell" ? "db" : "mc") + '">' + e.t + '</span><span class="tag">' + e.m + "</span>" + (e.custom ? '<span class="tag">custom</span>' : "") + '</div></div><button class="btn sm" type="button" data-act="add-ex" data-id="' + e.id + '">Add</button></div>';
      if (e.custom) html += '<button class="tiny" type="button" data-act="del-custom" data-id="' + e.id + '" style="margin-top:8px;color:var(--warn)">Remove custom</button>';
      html += "</div>";
    });
    el("view-library").innerHTML = html;
    var search = el("libSearch");
    if (search) search.addEventListener("input", function () { libQ = search.value; renderLibrary(); });
  }
  function renderWorkout() {
    var s = st().session || ensureSession();
    var unit = st().unit;
    var html = '<input id="sessName" value="' + esc(s.name) + '" placeholder="Session name" /><div class="row space" style="margin:10px 0"><span class="tiny">' + s.exercises.length + ' exercises</span><div class="row" style="gap:6px"><button class="btn sm ghost" type="button" data-act="rest-pref">Rest ' + st().restSec + 's</button><button class="btn sm ghost" type="button" data-act="go-library">+ Move</button></div></div>';
    if (!s.exercises.length) html += '<div class="card empty">Add dumbbells or machines from Gear.</div>';
    s.exercises.forEach(function (ex, i) {
      html += '<div class="card"><div class="row space"><div><div class="ex-name">' + esc(ex.n) + '</div><div class="tiny">' + ex.t + " · " + ex.m + '</div></div><button class="btn icon ghost" type="button" data-act="rm-move" data-i="' + i + '">X</button></div>';
      html += '<div class="set-grid tiny" style="margin-top:10px"><div>#</div><div>' + unit.toUpperCase() + "</div><div>REPS</div><div></div></div>";
      ex.sets.forEach(function (set, si) {
        html += '<div class="set-grid' + (set.done ? " done" : "") + '"><div class="muted">' + (si + 1) + '</div><input inputmode="decimal" data-act="set-w" data-i="' + i + '" data-si="' + si + '" value="' + esc(set.w) + '" /><input inputmode="numeric" data-act="set-r" data-i="' + i + '" data-si="' + si + '" value="' + esc(set.r) + '" /><button class="btn icon' + (set.done ? "" : " ghost") + '" type="button" data-act="toggle-set" data-i="' + i + '" data-si="' + si + '">' + (set.done ? "OK" : "o") + "</button></div>";
      });
      html += '<div class="row" style="margin-top:8px;gap:8px"><button class="btn sm ghost grow" type="button" data-act="add-set" data-i="' + i + '">+ Set</button><button class="btn sm ghost" type="button" data-act="start-timer">Rest</button></div></div>';
    });
    html += '<textarea id="sessNotes" placeholder="Session notes">' + esc(s.notes || "") + '</textarea><div style="height:10px"></div><button class="btn" type="button" data-act="finish">Save workout</button><div style="height:8px"></div><button class="btn ghost" type="button" data-act="save-template">Save as template</button><div style="height:8px"></div><button class="btn ghost warn" type="button" data-act="discard">Discard</button>';
    el("view-workout").innerHTML = html;
    var name = el("sessName");
    if (name) name.addEventListener("change", function () { var sess = ensureSession(); sess.name = name.value; saveSession(sess); });
    var notes = el("sessNotes");
    if (notes) notes.addEventListener("change", function () { var sess = ensureSession(); sess.notes = notes.value; saveSession(sess); });
  }
  function renderHistory() {
    var unit = st().unit, ws = st().workouts;
    var html = '<div class="tiny" style="margin-bottom:8px">' + ws.length + " saved sessions</div>";
    if (!ws.length) html += '<div class="card empty">Finish a workout to see it here.</div>';
    ws.forEach(function (w) {
      html += '<div class="card"><div class="row space"><div><div class="ex-name">' + esc(w.name) + '</div><div class="tiny">' + new Date(w.ts).toLocaleString() + '</div></div><button class="btn sm ghost" type="button" data-act="del-work" data-id="' + w.id + '">X</button></div>';
      w.exercises.forEach(function (e) {
        var done = e.sets.filter(function (x) { return x.done && x.w && x.r; }), best = 0;
        done.forEach(function (x) { best = Math.max(best, Number(x.w) || 0); });
        html += '<div class="row space" style="margin-top:8px"><div class="grow"><div>' + esc(e.n) + '</div><div class="tiny">' + done.length + ' sets</div></div><div class="tiny">' + (best ? best + " " + unit : "-") + "</div></div>";
      });
      if (w.notes) html += '<div class="tiny" style="margin-top:8px;text-transform:none;letter-spacing:0">' + esc(w.notes) + "</div>";
      html += "</div>";
    });
    el("view-history").innerHTML = html;
  }
  function renderProgress() {
    var prs = load("il_prs", {}), names = Object.keys(prs).sort(), workouts = st().workouts;
    var html = '<div class="tiny" style="margin-bottom:8px">Best estimated loads</div>';
    if (!names.length) html += '<div class="card empty">PRs appear after you log completed sets.</div>';
    names.forEach(function (n) {
      var p = prs[n], hist = [];
      workouts.forEach(function (w) { w.exercises.forEach(function (e) { if (e.n === n) e.sets.forEach(function (s) { if (s.done && s.w) hist.push(Number(s.w) || 0); }); }); });
      var max = Math.max.apply(null, hist.concat([p.w, 1]));
      html += '<div class="card"><div class="row space"><div class="ex-name">' + esc(n) + "</div><div><b>" + p.w + '</b> <span class="tiny">' + (p.unit || st().unit) + " x " + p.r + '</span></div></div><div class="bar"><i style="width:' + Math.min(100, (p.w / max) * 100) + '%"></i></div><div class="tiny" style="margin-top:6px">' + hist.length + " logged working sets</div></div>";
    });
    el("view-progress").innerHTML = html;
  }
  function updatePRs(w) {
    var prs = load("il_prs", {});
    w.exercises.forEach(function (e) {
      e.sets.forEach(function (s) {
        if (!s.done) return;
        var loadN = Number(s.w) || 0, reps = Number(s.r) || 0;
        if (!loadN || !reps) return;
        var est = loadN * (1 + reps / 30), cur = prs[e.n] || { w: 0, r: 0, est: 0 };
        if (est > (cur.est || 0) || loadN > cur.w) prs[e.n] = { w: loadN, r: reps, est: est, ts: Date.now(), unit: st().unit };
      });
    });
    save("il_prs", prs);
  }
  function closeModal() { el("modal").classList.remove("show"); }
  function openSheet(html) { el("sheet").innerHTML = html; el("modal").classList.add("show"); }
  function startTimer() { timerLeft = st().restSec; el("timer").classList.add("show"); tick(); clearInterval(timerId); timerId = setInterval(tick, 1000); }
  function tick() {
    var m = Math.floor(timerLeft / 60), s = String(timerLeft % 60);
    if (s.length < 2) s = "0" + s;
    var clock = el("clock");
    clock.textContent = m + ":" + s;
    clock.classList.toggle("warn", timerLeft <= 10);
    if (timerLeft <= 0) { clearInterval(timerId); if (navigator.vibrate) navigator.vibrate([200, 80, 200]); return; }
    timerLeft -= 1;
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act], [data-view]");
    if (!t) { if (e.target.id === "modal") closeModal(); return; }
    var view = t.getAttribute("data-view");
    if (view) { showView(view); return; }
    var act = t.getAttribute("data-act"), s, list, ex, i, si, r, n;
    if (act === "go-workout") showView("workout");
    if (act === "go-library") showView("library");
    if (act === "start-fresh") { saveSession({ id: uid(), name: "Workout", ts: Date.now(), exercises: [], notes: "" }); showView("workout"); }
    if (act === "load-routine") {
      r = st().routines.filter(function (x) { return x.id === t.getAttribute("data-id"); })[0];
      if (!r) return;
      saveSession({ id: uid(), name: r.name, ts: Date.now(), exercises: r.exercises.map(function (e2) { return { eid: e2.eid, n: e2.n, t: e2.t, m: e2.m, sets: defaultSets(), note: "" }; }) });
      showView("workout");
    }
    if (act === "del-routine") { save("il_routines", st().routines.filter(function (x) { return x.id !== t.getAttribute("data-id"); })); renderHome(); }
    if (act === "lib-type") { libType = t.getAttribute("data-v"); renderLibrary(); }
    if (act === "lib-muscle") { libMuscle = t.getAttribute("data-v"); renderLibrary(); }
    if (act === "add-ex") {
      ex = allEx().filter(function (x) { return x.id === t.getAttribute("data-id"); })[0];
      if (!ex) return;
      s = ensureSession();
      s.exercises.push({ eid: ex.id, n: ex.n, t: ex.t, m: ex.m, sets: defaultSets(), note: "" });
      saveSession(s);
      showView("workout");
    }
    if (act === "del-custom") { save("il_custom", st().custom.filter(function (x) { return x.id !== t.getAttribute("data-id"); })); renderLibrary(); }
    if (act === "open-custom") {
      openSheet('<div class="grab"></div><div class="brand" style="font-size:28px;margin-bottom:10px">Custom exercise</div><input id="cxn" placeholder="Name" /><div style="height:8px"></div><select id="cxt"><option value="dumbbell">Dumbbell</option><option value="machine">Weight machine</option></select><div style="height:8px"></div><select id="cxm">' + MUSCLES.map(function (m) { return "<option>" + m + "</option>"; }).join("") + '</select><div style="height:12px"></div><button class="btn" type="button" data-act="save-custom">Add to library</button>');
    }
    if (act === "save-custom") {
      n = el("cxn").value.trim();
      if (!n) return;
      list = st().custom;
      list.push({ id: uid(), n: n, t: el("cxt").value, m: el("cxm").value, custom: true });
      save("il_custom", list);
      closeModal();
      renderLibrary();
    }
    if (act === "rm-move") { s = ensureSession(); s.exercises.splice(Number(t.getAttribute("data-i")), 1); saveSession(s); renderWorkout(); }
    if (act === "add-set") { s = ensureSession(); s.exercises[Number(t.getAttribute("data-i"))].sets.push({ id: uid(), w: "", r: "", done: false }); saveSession(s); renderWorkout(); }
    if (act === "toggle-set") {
      s = ensureSession(); i = Number(t.getAttribute("data-i")); si = Number(t.getAttribute("data-si"));
      s.exercises[i].sets[si].done = !s.exercises[i].sets[si].done; saveSession(s); renderWorkout();
      if (s.exercises[i].sets[si].done) startTimer();
    }
    if (act === "start-timer") startTimer();
    if (act === "timer-adj") { timerLeft = Math.max(0, timerLeft + Number(t.getAttribute("data-d"))); tick(); }
    if (act === "timer-skip") { clearInterval(timerId); el("timer").classList.remove("show"); }
    if (act === "rest-pref") {
      openSheet('<div class="grab"></div><div class="brand" style="font-size:28px;margin-bottom:10px">Default rest</div><div class="row" style="gap:8px;flex-wrap:wrap">' + [45,60,90,120,180].map(function (sec) { return '<button class="btn sm ghost" type="button" data-act="set-rest" data-s="' + sec + '">' + sec + "s</button>"; }).join("") + "</div>");
    }
    if (act === "set-rest") { save("il_rest", Number(t.getAttribute("data-s"))); closeModal(); renderWorkout(); }
    if (act === "finish") {
      s = st().session;
      if (!s || !s.exercises.length) { alert("Nothing to save."); return; }
      s.ts = Date.now(); s.finished = true;
      list = st().workouts; list.unshift(s); save("il_workouts", list); updatePRs(s); saveSession(null); showView("history");
    }
    if (act === "save-template") {
      s = ensureSession();
      if (!s.exercises.length) return;
      n = prompt("Template name", s.name || "My routine");
      if (!n) return;
      list = st().routines;
      list.unshift({ id: uid(), name: n, exercises: s.exercises.map(function (e2) { return { eid: e2.eid, n: e2.n, t: e2.t, m: e2.m }; }) });
      save("il_routines", list); alert("Template saved."); showView("home");
    }
    if (act === "discard") { if (!confirm("Discard this session?")) return; saveSession(null); renderWorkout(); }
    if (act === "del-work") { if (!confirm("Delete this session?")) return; save("il_workouts", st().workouts.filter(function (w) { return w.id !== t.getAttribute("data-id"); })); renderHistory(); }
  });
  document.addEventListener("change", function (e) {
    var t = e.target, act = t.getAttribute("data-act");
    if (act !== "set-w" && act !== "set-r") return;
    var s = ensureSession();
    s.exercises[Number(t.getAttribute("data-i"))].sets[Number(t.getAttribute("data-si"))][act === "set-w" ? "w" : "r"] = t.value;
    saveSession(s);
  });
  el("unitBtn").addEventListener("click", function () {
    var u = st().unit === "kg" ? "lb" : "kg";
    save("il_unit", u);
    el("unitBtn").textContent = u.toUpperCase();
    showView(document.querySelector(".view.active").id.replace("view-", ""));
  });
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); deferredPrompt = e; el("installBtn").style.display = "inline-block";
  });
  el("installBtn").addEventListener("click", function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () { deferredPrompt = null; el("installBtn").style.display = "none"; });
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function () {});
  el("dateLabel").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  el("unitBtn").textContent = st().unit.toUpperCase();
  renderHome();
})();
