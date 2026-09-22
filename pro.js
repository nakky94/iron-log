(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function workouts() { return load("il_workouts", []); }
  function sess() { return load("il_session", null); }
  function routines() { return load("il_routines", []); }
  function clock() { try { return JSON.parse(localStorage.getItem("il_clock") || "{}"); } catch (e) { return {}; } }
  function lastHit(name) {
    var ws = workouts();
    for (var i = 0; i < ws.length; i++) {
      var found = (ws[i].exercises || []).filter(function (e) { return e.n === name; })[0];
      if (found && found.sets && found.sets.length) return { sets: found.sets, ts: ws[i].ts };
    }
    return { sets: [], ts: 0 };
  }
  function lastSets(name) { return lastHit(name).sets; }
  function prevLine(name) {
    var hit = lastHit(name);
    var sets = (hit.sets || []).filter(function (s) { return s.w || s.r; });
    if (!sets.length) return "No previous";
    var weights = sets.map(function (s) { return String(s.w || ""); });
    var same = weights.every(function (w) { return w === weights[0]; });
    var reps = sets.map(function (s) { return s.r || "\u2014"; }).join(", ");
    var when = hit.ts ? new Date(hit.ts).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "";
    if (same && weights[0]) return "Previous: " + weights[0] + " kg \u00d7 " + reps + (when ? " \u00b7 " + when : "");
    var bits = sets.map(function (s) { return (s.w || "\u2014") + "\u00d7" + (s.r || "\u2014"); }).join(", ");
    return "Previous: " + bits + (when ? " \u00b7 " + when : "");
  }
  function weekStart(offset) {
    var now = new Date(), day = (now.getDay() + 6) % 7;
    var s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day - (offset || 0) * 7);
    s.setHours(0, 0, 0, 0);
    return s.getTime();
  }
  function weekDays() {
    var start = weekStart(0), out = [];
    for (var i = 0; i < 7; i++) out.push(new Date(start + i * 864e5));
    return out;
  }
  function trainedOn(ts) {
    var a = new Date(ts); a.setHours(0, 0, 0, 0);
    return workouts().some(function (w) {
      var b = new Date(w.ts); b.setHours(0, 0, 0, 0);
      return a.getTime() === b.getTime();
    });
  }
  function weekStreak() {
    var n = 0, i = 0;
    if (!workouts().some(function (w) { return w.ts >= weekStart(0); })) i = 1;
    while (true) {
      var from = weekStart(i), to = from + 7 * 864e5;
      var hit = workouts().some(function (w) { return w.ts >= from && w.ts < to; });
      if (!hit) break;
      n += 1; i += 1;
      if (i > 80) break;
    }
    return n;
  }
  function styles() {
    var s = document.getElementById("proStyle");
    if (!s) { s = document.createElement("style"); s.id = "proStyle"; document.head.appendChild(s); }
    s.textContent =
      ".nav button span{display:block;margin-top:2px;font-size:10px}" +
      "#view-workout .set-grid.tiny{grid-template-columns:24px 70px 1fr 70px 44px;font-size:10px;letter-spacing:.06em;color:#6a6a6a;text-transform:uppercase}" +
      "#view-workout .set-grid:not(.tiny){grid-template-columns:24px 70px minmax(96px,1.2fr) minmax(64px,.8fr) 44px}" +
      "#view-workout .prev-cell{font-size:11px;color:#6a6a6a;font-variant-numeric:tabular-nums}" +
      "#view-workout .prev-line{margin-top:6px;font-size:13px;color:#cfcfcf;font-weight:600}" +
      "#view-workout .ghost-set,#view-workout [data-act='del-set']{display:none!important}" +
      "#weekCal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:0 0 12px}" +
      "#weekCal .d{text-align:center;padding:8px 0;border-radius:12px;background:#141414;border:1px solid #1e1e1e}" +
      "#weekCal .d.on{background:#19160a;border-color:#2a2610}" +
      "#weekCal .d.on b{color:#FFD400}" +
      "#weekCal .d.today{border-color:#FFD400}" +
      "#weekCal .d span{display:block;font-size:9px;color:#6a6a6a;text-transform:uppercase}" +
      "#weekCal .d b{display:block;font-size:15px;margin-top:2px}" +
      ".finish-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}" +
      ".finish-stats div{background:#1a1a1a;border-radius:14px;padding:12px 8px;text-align:center}" +
      ".finish-stats b{display:block;font-size:18px}" +
      "#emptyStarts .btn{margin-top:8px}" +
      "#homeStreak{margin:0 0 12px;font-size:12px;color:#8d8d8d}" +
      "#view-home .heat{display:none!important}" +
      ".stat .tiny{font-size:9px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}";
  }
  function paintTrain() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var s = sess();
    Array.prototype.slice.call(view.querySelectorAll("#view-workout .card")).forEach(function (card) {
      if (card.id === "emptyStarts" || card.querySelector(".prev-line")) return;
      var wIn = card.querySelector("[data-act='set-w']");
      if (!wIn) return;
      var i = Number(wIn.getAttribute("data-i"));
      var name = s && s.exercises && s.exercises[i] ? s.exercises[i].n : "";
      var line = document.createElement("div");
      line.className = "prev-line";
      line.textContent = prevLine(name);
      var title = card.querySelector(".ex-name");
      if (title && title.parentNode) title.parentNode.appendChild(line);
      else card.insertBefore(line, card.firstChild.nextSibling);
    });
    Array.prototype.slice.call(view.querySelectorAll(".set-grid.tiny")).forEach(function (h) {
      if (h.getAttribute("data-pro")) return;
      h.setAttribute("data-pro", "1");
      h.innerHTML = "<div>SET</div><div>PREV</div><div>KG</div><div>REPS</div><div></div>";
    });
    Array.prototype.slice.call(view.querySelectorAll(".set-grid:not(.tiny)")).forEach(function (row) {
      if (row.querySelector(".prev-cell")) return;
      var wIn = row.querySelector("[data-act='set-w']");
      if (!wIn) return;
      var i = Number(wIn.getAttribute("data-i"));
      var si = Number(wIn.getAttribute("data-si"));
      var name = s && s.exercises && s.exercises[i] ? s.exercises[i].n : "";
      var prevList = lastSets(name);
      var prev = prevList[si] || prevList[prevList.length - 1] || {};
      var cell = document.createElement("div");
      cell.className = "prev-cell";
      cell.textContent = (prev.w || "\u2014") + "\u00d7" + (prev.r || "\u2014");
      var first = row.firstElementChild;
      if (first && first.nextSibling) row.insertBefore(cell, first.nextSibling);
      else row.appendChild(cell);
    });
    if (!s || !(s.exercises || []).length) {
      if (!view.querySelector("#emptyStarts")) {
        var box = document.createElement("div");
        box.id = "emptyStarts";
        box.className = "card";
        var rts = routines();
        var html = '<div class="ex-name">Start a session</div><div class="tiny" style="margin:6px 0 4px">Pick a routine, then tick sets.</div>';
        rts.forEach(function (r) {
          html += '<button class="btn" type="button" data-act="load-routine" data-id="' + r.id + '">Start ' + (r.name || "routine") + "</button>";
        });
        html += '<button class="btn ghost" type="button" data-act="go-library">Add from Gear</button>';
        box.innerHTML = html;
        view.appendChild(box);
      }
      Array.prototype.slice.call(view.querySelectorAll(".empty")).forEach(function (el) { el.style.display = "none"; });
    } else {
      var es = view.querySelector("#emptyStarts");
      if (es) es.remove();
    }
  }
  function paintLog() {
    var view = document.getElementById("view-history");
    if (!view || !view.classList.contains("active")) return;
    if (view.querySelector("#weekCal")) return;
    var days = ["M", "T", "W", "T", "F", "S", "S"];
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var cal = document.createElement("div");
    cal.id = "weekCal";
    cal.innerHTML = weekDays().map(function (d, i) {
      var on = trainedOn(d.getTime());
      var isToday = d.getTime() === today.getTime();
      return '<div class="d' + (on ? " on" : "") + (isToday ? " today" : "") + '"><span>' + days[i] + "</span><b>" + d.getDate() + "</b></div>";
    }).join("");
    var tools = view.querySelector("#backupTools");
    if (tools) tools.insertAdjacentElement("afterend", cal);
    else view.insertBefore(cal, view.firstChild);
  }
  function paintHome() {
    var view = document.getElementById("view-home");
    if (!view || !view.classList.contains("active")) return;
    Array.prototype.slice.call(view.querySelectorAll(".stat .tiny")).forEach(function (el) {
      var t = (el.textContent || "").trim().toLowerCase();
      if (t.indexOf("last") === 0) el.textContent = "Last";
      else if (t.indexOf("week") === 0 || t.indexOf("volume") >= 0) el.textContent = "Volume";
      else if (t.indexOf("lift") === 0) el.textContent = "Lifts";
    });
    var ws = workouts();
    var n = weekStreak();
    var text = ws.length ? (n ? n + " week streak \u00b7 " + ws.length + " sessions" : ws.length + " sessions logged") : "Start a template to begin";
    var el = view.querySelector("#homeStreak");
    if (!el) {
      el = document.createElement("div");
      el.id = "homeStreak";
      var stats = view.querySelector(".stats");
      if (stats) stats.insertAdjacentElement("afterend", el);
      else view.insertBefore(el, view.firstChild);
    }
    el.textContent = text;
    var stats = view.querySelector(".stats");
    if (stats && el.previousSibling !== stats) stats.insertAdjacentElement("afterend", el);
  }
  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = String(sec % 60);
    if (s.length < 2) s = "0" + s;
    return m + ":" + s;
  }
  function volOf(w) {
    var n = 0;
    (w.exercises || []).forEach(function (e) {
      (e.sets || []).forEach(function (s) { n += (Number(s.w) || 0) * (Number(s.r) || 0); });
    });
    return Math.round(n);
  }
  function summaryFrom(w) {
    var sets = 0, vol = 0, prs = 0, moves = 0;
    var bests = load("il_prs", {});
    (w.exercises || []).forEach(function (e) {
      var hit = false;
      (e.sets || []).forEach(function (s) {
        if (!s.done && !s.w) return;
        hit = true;
        sets += 1;
        vol += (Number(s.w) || 0) * (Number(s.r) || 0);
        var prev = bests[e.n] && Number(bests[e.n].w);
        if (prev && Number(s.w) > prev) prs += 1;
      });
      if (hit) moves += 1;
    });
    var c = clock();
    var dur = 0;
    if (c.startedAt) dur = Math.max(0, Date.now() - c.startedAt - (c.pauseMs || 0) - (c.pausedAt ? Date.now() - c.pausedAt : 0));
    else if (w.durationSec) dur = w.durationSec * 1000;
    var name = w.name || "Workout";
    var prev = workouts().filter(function (x) { return x.id !== w.id && (x.name || "Workout") === name; })[0] || workouts().filter(function (x) { return x.id !== w.id; })[0];
    var cmp = "";
    if (prev) {
      var pv = volOf(prev);
      if (pv) {
        var pct = Math.round((vol - pv) / pv * 100);
        var sign = pct >= 0 ? pct + "% more" : Math.abs(pct) + "% less";
        cmp = sign + " volume than your previous " + name + " workout.";
      }
    }
    return { sets: sets, vol: Math.round(vol), prs: prs, moves: moves, dur: Math.round(dur / 1000), name: name, cmp: cmp };
  }
  function showFinish(w) {
    var sm = summaryFrom(w);
    var sheet = document.getElementById("sheet"), modal = document.getElementById("modal");
    if (!sheet || !modal) return;
    sheet.innerHTML =
      '<div class="grab"></div><div class="ex-name">Workout saved</div>' +
      '<div class="tiny" style="margin-top:4px">' + sm.name + "</div>" +
      '<div class="finish-stats">' +
      "<div><b>" + fmtClock(sm.dur) + "</b><span class=\"tiny\">Duration</span></div>" +
      "<div><b>" + sm.moves + "</b><span class=\"tiny\">Lifts</span></div>" +
      "<div><b>" + sm.sets + "</b><span class=\"tiny\">Sets</span></div>" +
      "</div>" +
      '<div class="finish-stats">' +
      "<div><b>" + (sm.vol >= 1000 ? (sm.vol / 1000).toFixed(1) + "k" : sm.vol) + "</b><span class=\"tiny\">Volume kg</span></div>" +
      "<div><b>" + sm.prs + "</b><span class=\"tiny\">PRs</span></div>" +
      "<div><b>" + weekStreak() + "</b><span class=\"tiny\">Streak wk</span></div>" +
      "</div>" +
      (sm.cmp ? '<div style="margin:4px 0 8px;font-weight:700">' + sm.cmp + "</div>" : "") +
      '<button class="btn" type="button" data-act="close-sheet" style="margin-top:8px">Done</button>';
    modal.classList.add("show");
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-act='finish']")) {
      var snap = sess();
      setTimeout(function () {
        var last = workouts()[0] || snap;
        if (last) showFinish(last);
      }, 180);
    }
    if (e.target.closest("[data-act='close-sheet']") || e.target.id === "modal") {
      var modal = document.getElementById("modal");
      if (modal) modal.classList.remove("show");
    }
  }, true);
  var t = null;
  function schedule() {
    if (t) return;
    t = setTimeout(function () {
      t = null;
      styles();
      paintTrain();
      paintLog();
      paintHome();
    }, 50);
  }
  function boot() {
    ["view-workout", "view-history", "view-home"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) new MutationObserver(schedule).observe(n, { childList: true });
    });
    schedule();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
