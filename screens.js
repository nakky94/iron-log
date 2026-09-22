(function () {
  var homeLock = false;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function workouts() { return load("il_workouts", []); }
  function routines() { return load("il_routines", []); }
  function session() { return load("il_session", null); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c];
    });
  }
  function shortName(n) {
    return String(n || "").replace(/^Dumbbell\s/i, "").replace(/\sMachine$/i, "");
  }
  function title(s) {
    return String(s || "").replace(/\w\S*/g, function (w) { return w.charAt(0).toUpperCase() + w.slice(1); });
  }
  function ago(ts) {
    var d = Math.floor((Date.now() - ts) / 864e5);
    if (d <= 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 8) return d + " days ago";
    return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  function weekStart() {
    var now = new Date(), day = (now.getDay() + 6) % 7;
    var s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    s.setHours(0, 0, 0, 0);
    return s.getTime();
  }
  function streak() {
    var n = 0, i = 0, ws = workouts();
    if (!ws.some(function (w) { return w.ts >= weekStart(); })) i = 1;
    while (i < 80) {
      var from = weekStart() - i * 7 * 864e5, to = from + 7 * 864e5;
      if (!ws.some(function (w) { return w.ts >= from && w.ts < to; })) break;
      n += 1; i += 1;
    }
    return n;
  }
  function latestPr() {
    var prs = load("il_prs", {}), best = null;
    Object.keys(prs).forEach(function (n) {
      var p = prs[n] || {};
      if (!best || (p.ts || 0) > (best.ts || 0)) best = { n: n, w: p.w, r: p.r, ts: p.ts };
    });
    return best;
  }
  function lastLoad(name) {
    var ws = workouts();
    for (var i = 0; i < ws.length; i++) {
      var e = (ws[i].exercises || []).filter(function (x) { return x.n === name; })[0];
      if (!e) continue;
      var best = 0, r = 0;
      (e.sets || []).forEach(function (s) {
        if (Number(s.w) > best) { best = Number(s.w); r = Number(s.r) || 0; }
      });
      if (best) return best + " kg" + (r ? " \u00d7 " + r : "");
    }
    return "";
  }
  function liveInfo() {
    var s = session();
    if (!s || !(s.exercises || []).length) return null;
    var done = (s.exercises || []).filter(function (e) {
      var sets = e.sets || [];
      return sets.length && sets.every(function (x) { return x.done; });
    }).length;
    return { name: s.name || "Workout", done: done, total: s.exercises.length };
  }
  function go(view) {
    var b = document.querySelector('.nav button[data-view="' + view + '"]');
    if (b) b.click();
  }
  function paintHome() {
    var view = document.getElementById("view-home");
    if (!view || !view.classList.contains("active") || homeLock) return;
    homeLock = true;
    Array.prototype.slice.call(view.children).forEach(function (el) {
      if (el.id !== "homeScreen") el.style.display = "none";
    });
    var box = view.querySelector("#homeScreen");
    if (!box) {
      box = document.createElement("div");
      box.id = "homeScreen";
      view.insertBefore(box, view.firstChild);
    }
    var last = workouts()[0];
    var live = liveInfo();
    var pr = latestPr();
    var n = streak();
    var html = "";
    if (live) {
      html += '<button class="card" type="button" id="hsLive" style="width:100%;text-align:left;border-color:#2a2610;background:#19160a">' +
        '<div class="tiny">Workout in progress</div><div class="ex-name" style="margin-top:4px">' +
        live.done + " / " + live.total + " lifts done</div><div class="tiny" style="margin-top:4px">Tap to resume 