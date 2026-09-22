(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function workouts() { return load("il_workouts", []); }
  function sess() { return load("il_session", null); }
  function routines() { return load("il_routines", []); }
  function clock() { try { return JSON.parse(localStorage.getItem("il_clock") || "{}"); } catch (e) { return {}; } }
  function lastSets(name) {
    var ws = workouts();
    for (var i = 0; i < ws.length; i++) {
      var found = (ws[i].exercises || []).filter(function (e) { return e.n === name; })[0];
      if (found && found.sets && found.sets.length) return found.sets;
    }
    return [];
  }
  function weekDays() {
    var now = new Date(), day = (now.getDay() + 6) % 7;
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    var out = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(start.getTime() + i * 864e5);
      out.push(d);
    }
    return out;
  }
  function trainedOn(ts) {
    var a = new Date(ts); a.setHours(0, 0, 0, 0);
    return workouts().some(function (w) {
      var b = new Date(w.ts); b.setHours(0, 0, 0, 0);
      return a.getTime() === b.getTime();
    });
  }
  function streak() {
    var days = {};
    workouts().forEach(function (w) {
      var d = new Date(w.ts); d.setHours(0, 0, 0, 0);
      days[d.getTime()] = true;
    });
    var n = 0, cur = new Date(); cur.setHours(0, 0, 0, 0);
    if (!days[cur.getTime()]) cur = new Date(cur.getTime() - 864e5);
    while (days[cur.getTime()]) { n += 1; cur = new Date(cur.getTime() - 864e5); }
    return n;
  }
  function styles() {
    if (document.getElementById("proStyle")) return;
    var s = document.createElement("style");
    s.id = "proStyle";
    s.textContent =
      "#view-workout .set-grid.tiny{grid-template-columns:24px 70px 1fr 70px 44px;font-size:10px;letter-spacing:.06em;color:#6a6a6a;text-transform:uppercase}" +
      "#view-workout .set-grid:not(.tiny){grid-template-columns:24px 70px minmax(96px,1.2fr) minmax(64px,.8fr) 44px}" +
      "#view-workout .prev-cell{font-size:11px;color:#6a6a6a;font-variant-numeric:tabular-nums;line-height:1.2}" +
      "#view-workout .ghost-set,#view-workout [data-act='del-set']{display:none!important}" +
      "#weekCal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:0 0 12px}" +
      "#weekCal .d{text-align:center;padding:8px 0;border-radius:12px;background:#141414;border:1px solid #1e1e1e}" +
      "#weekCal .d.on{background:#19160a;border-color:#2a2610}" +
      "#weekCal .d.on b{color:#FFD400}" +
      "#weekCal .d.today{border-color:#FFD400}" +
      "#weekCal .d span{display:block;font-size:9px;color:#6a6a6a;text-transform:uppercase;letter-spacing:.06em}" +
      "#weekCal .d b{display:block;font-size:15px;margin-top:2px}" +
      ".finish-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}" +
      ".finish-stats div{background:#1a1a1a;border-radius:14px;padding:12px 8px;text-align:center}" +
      ".finish-stats b{display:block;font-size:18px}" +
      "#emptyStarts .btn{margin-top:8px}" +
      "#homeStreak{margin:0 0 10px;font-size:13px;color:#8d8d8d}";
    document.head.appendChild(s);
  }
  function paintTrain() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var s = sess();
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
      cell.textContent = (prev.w || "—") + "×" + (prev.r || "—");
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
        var html = '<div class="ex-name">Start a session</div><div class="tiny" style="margin:6px 0 4px">Same flow as Strong — pick a routine, log sets, tick them off.</div>';
        rts.forEach(function (r) {
          html += '<button class="btn" type="button" data-act="load-routine" data-id="' + r.id + '">Start ' + (r.name || "routine") + "</button>";
        });
        html += '<button class="btn ghost" type="button" data-act="go-library">Add from Gear</button>';
        box.innerHTML = html;
        var empty = view.querySelector(".empty, .card");
        if (empty) empty.insertAdjacentElement("afterend", box);
        else view.appendChild(box);
      }
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
    if (view.querySelector("#homeStreak")) return;
    var n = streak();
    var el = document.createElement("div");
    el.id = "homeStreak";
    el.textContent = n ? n + " day streak" : "Log a session to start a streak";
    var stats = view.querySelector(".stats");
    if (stats) stats.insertAdjacentElement("afterend", el);
    else view.insertBefore(el, view.firstChild);
  }
  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = String(sec % 60);
    if (s.length < 2) s = "0" + s;
    return m + ":" + s;
  }
  function summaryFrom(w) {
    var sets = 0, vol = 0, prs = 0;
    var bests = load("il_prs", {});
    (w.exercises || []).forEach(function (e) {
      (e.sets || []).forEach(function (s) {
        if (!s.done) return;
        sets += 1;
        vol += (Number(s.w) || 0) * (Number(s.r) || 0);
        var prev = bests[e.n] && Number(bests[e.n].w);
        if (prev && Number(s.w) > prev) prs += 1;
      });
    });
    var c = clock();
    var dur = 0;
    if (c.startedAt) dur = Math.max(0, Date.now() - c.startedAt - (c.pauseMs || 0) - (c.pausedAt ? Date.now() - c.pausedAt : 0));
    else if (w.durationSec) dur = w.durationSec * 1000;
    return { sets: sets, vol: Math.round(vol), prs: prs, dur: Math.round(dur / 1000), name: w.name || "Workout" };
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
      "<div><b>" + sm.sets + "</b><span class=\"tiny\">Sets</span></div>" +
      "<div><b>" + (sm.vol >= 1000 ? (sm.vol / 1000).toFixed(1) + "k" : sm.vol) + "</b><span class=\"tiny\">Volume kg</span></div>" +
      "</div>" +
      (sm.prs ? '<div class="tiny">' + sm.prs + " new best" + (sm.prs > 1 ? "s" : "") + "</div>" : "") +
      '<button class="btn" type="button" data-act="close-sheet" style="margin-top:12px">Done</button>';
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
