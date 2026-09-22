(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function workouts() { return load("il_workouts", []); }
  function session() { return load("il_session", null); }
  function clock() { try { return JSON.parse(localStorage.getItem("il_clock") || "{}"); } catch (e) { return {}; } }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c];
    });
  }
  function shortName(n) {
    return String(n || "").replace(/^Dumbbell\s/, "").replace(/\sMachine$/, "");
  }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = String(sec % 60);
    if (s.length < 2) s = "0" + s;
    return m + ":" + s;
  }
  function elapsed() {
    var c = clock();
    if (!c.startedAt) return 0;
    var extra = c.pausedAt ? Date.now() - c.pausedAt : 0;
    return Math.max(0, Date.now() - c.startedAt - (c.pauseMs || 0) - extra);
  }
  function styles() {
    if (document.getElementById("polStyle")) return;
    var s = document.createElement("style");
    s.id = "polStyle";
    s.textContent =
      "#liveHead{display:none;background:#19160a;border:1px solid #2a2610;border-radius:16px;padding:10px 12px;margin:0 0 10px}" +
      "body.live-on #liveHead{display:block}" +
      "body.live-on header.top .brand{font-size:13px}" +
      "#undoBar2{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--nav-h)+var(--safe-b)+12px);background:#FFD400;color:#111;font-weight:800;padding:12px 16px;border-radius:14px;z-index:75;display:none}" +
      "#undoBar2.on{display:block}" +
      ".hist-btn{font-size:12px;font-weight:700;color:#FFD400}" +
      ".empty-hero{text-align:left;padding:18px 16px}" +
      "#recentGear .ex-name{font-size:15px}";
    document.head.appendChild(s);
  }
  function liftTimeline(name) {
    var rows = [];
    workouts().forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        if (e.n !== name) return;
        var sets = (e.sets || []).filter(function (s) { return s.w || s.r; });
        if (!sets.length) return;
        var top = sets[0];
        sets.forEach(function (s) { if (Number(s.w) > Number(top.w || 0)) top = s; });
        rows.push({ ts: w.ts, w: top.w, r: top.r });
      });
    });
    return rows.slice(0, 8);
  }
  function openHist(name) {
    var rows = liftTimeline(name);
    var html = '<div class="grab"></div><div class="ex-name">' + esc(shortName(name)) + '</div><div class="tiny" style="margin:4px 0 10px">History</div>';
    if (!rows.length) html += '<div class="tiny">No past sets yet.</div>';
    rows.forEach(function (r) {
      html += '<div class="row space" style="margin-top:8px"><div>' + new Date(r.ts).toLocaleDateString(undefined, { day: "numeric", month: "short" }) +
        '</div><div>' + (r.w || "\u2014") + " \u00d7 " + (r.r || "\u2014") + "</div></div>";
    });
    html += '<button class="btn ghost" type="button" data-act="close-sheet" style="margin-top:14px">Close</button>';
    var sheet = document.getElementById("sheet"), modal = document.getElementById("modal");
    if (sheet && modal) { sheet.innerHTML = html; modal.classList.add("show"); }
  }
  function paintHistBtns() {
    var view = document.getElementById("view-workout");
    var s = session();
    if (!view || !view.classList.contains("active") || !s) return;
    Array.prototype.slice.call(view.querySelectorAll(".card")).forEach(function (card) {
      if (card.querySelector(".hist-btn") || card.id === "emptyStarts" || card.id === "continueBox") return;
      var wIn = card.querySelector("[data-act='set-w']");
      if (!wIn) return;
      var i = Number(wIn.getAttribute("data-i"));
      var name = s.exercises && s.exercises[i] ? s.exercises[i].n : "";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hist-btn";
      btn.textContent = "History";
      btn.setAttribute("data-hist-name", name);
      var title = card.querySelector(".ex-name");
      if (title && title.parentNode) title.parentNode.appendChild(btn);
      else card.appendChild(btn);
    });
  }
  function paintEmpty() {
    var ws = workouts();
    function hero(view, title, sub, act, label) {
      if (!view || !view.classList.contains("active")) return;
      if (view.querySelector(".empty-hero")) return;
      var has = view.querySelector(".card, .h-card, #prBoard .card, #startWork");
      if (ws.length && view.id !== "view-workout") return;
      if (view.id === "view-workout" && session() && (session().exercises || []).length) return;
      if (view.id === "view-home" && ws.length) return;
      if (has && view.id !== "view-progress" && view.id !== "view-history") return;
      if (view.id === "view-progress" && Object.keys(load("il_prs", {})).length) return;
      if (view.id === "view-history" && ws.length) return;
      var box = document.createElement("div");
      box.className = "card empty-hero";
      box.innerHTML = '<div class="ex-name">' + title + '</div><div class="tiny" style="margin:8px 0 12px">' + sub + '</div>' +
        (act ? '<button class="btn" type="button" data-act="' + act + '">' + label + "</button>" : "");
      view.insertBefore(box, view.firstChild);
    }
    hero(document.getElementById("view-home"), "No workouts yet", "Start your first session from a template or an empty Train screen.", "start-home", "Start your first workout");
    hero(document.getElementById("view-workout"), "Ready when you are", "Load last lifts from Continue, or pick a template on Home.", "go-library", "All exercises");
    hero(document.getElementById("view-history"), "Log is empty", "Finish a session and it lands here with sets and volume.", "go-workout", "Start a workout");
    hero(document.getElementById("view-progress"), "Your PR board is empty", "Complete your first workout to start tracking PRs.", "go-workout", "Train now");
  }
  function paintRecentGear() {
    var view = document.getElementById("view-library");
    if (!view || !view.classList.contains("active")) return;
    var names = [];
    workouts().forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        var tag = e.t || e.m || e.n;
        if (tag && names.indexOf(tag) === -1) names.push(tag);
      });
    });
    names = names.slice(0, 6);
    var box = view.querySelector("#recentGear");
    if (!box) {
      box = document.createElement("div");
      box.id = "recentGear";
      var locker = view.querySelector("#gearLocker");
      if (locker) locker.insertAdjacentElement("afterend", box);
      else view.insertBefore(box, view.firstChild);
    }
    if (!names.length) { box.innerHTML = ""; return; }
    var html = '<div class="tiny" style="margin:8px 0">Recently used</div>';
    names.forEach(function (n) {
      html += '<div class="card"><div class="ex-name">' + esc(shortName(n)) + "</div></div>";
    });
    html += '<div class="tiny" style="margin:8px 0 6px">All equipment</div>';
    box.innerHTML = html;
  }
  function undoBar(label, fn) {
    var bar = document.getElementById("undoBar2");
    if (!bar) {
      bar = document.createElement("button");
      bar.id = "undoBar2";
      bar.type = "button";
      document.body.appendChild(bar);
    }
    bar.textContent = label + " \u00b7 Undo";
    bar._fn = fn;
    bar.classList.add("on");
    clearTimeout(bar._t);
    bar._t = setTimeout(function () { bar.classList.remove("on"); bar._fn = null; }, 6000);
  }
  function paintLive() {
    var view = document.getElementById("view-workout");
    var s = session();
    var live = !!(s && (s.exercises || []).length);
    document.body.classList.toggle("live-on", live && view && view.classList.contains("active"));
    if (!view) return;
    var head = view.querySelector("#liveHead");
    if (!head) {
      head = document.createElement("div");
      head.id = "liveHead";
      view.insertBefore(head, view.firstChild);
    }
    if (!live) { head.innerHTML = ""; return; }
    var done = 0;
    (s.exercises || []).forEach(function (e) {
      done += (e.sets || []).filter(function (x) { return x.done; }).length;
    });
    head.innerHTML = '<div class="tiny">Workout in progress</div><div class="row space"><div class="ex-name">' +
      esc(s.name || "Workout") + '</div><b>' + fmt(elapsed() / 1000) + "</b></div>" +
      '<div class="tiny" style="margin-top:4px">' + done + " sets logged</div>" +
      '<button class="btn" type="button" data-act="finish" style="margin-top:10px">Finish workout</button>';
  }
  document.addEventListener("click", function (e) {
    var h = e.target.closest("[data-hist-name]");
    if (h) { openHist(h.getAttribute("data-hist-name")); return; }
    if (e.target.id === "undoBar2" && e.target._fn) { e.target._fn(); e.target.classList.remove("on"); return; }
    if (e.target.closest("[data-act='del-set'], [data-act='del-ex'], [data-act='del-hist'], [data-act='del-work']")) {
      var snap = { s: session(), w: workouts(), p: load("il_prs", {}) };
      undoBar("Deleted", function () {
        if (snap.s) save("il_session", snap.s);
        save("il_workouts", snap.w);
        save("il_prs", snap.p);
        var btn = document.querySelector(".nav button.active");
        if (btn) btn.click();
      });
    }
    if (e.target.closest("[data-act='go-workout']")) {
      var t = document.querySelector('.nav button[data-view="workout"]');
      if (t) t.click();
    }
  }, true);
  function tick() {
    styles();
    paintHistBtns();
    paintEmpty();
    paintRecentGear();
    paintLive();
  }
  setInterval(tick, 700);
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(tick, 60); });
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
})();
