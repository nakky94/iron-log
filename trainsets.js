(function () {
  var restUntil = 0, restTick = null, sessTick = null, pressTimer = null, restChip = null;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function loadSess() { return load("il_session", null); }
  function saveSess(s) { localStorage.setItem("il_session", JSON.stringify(s)); }
  function workouts() { return load("il_workouts", []); }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function typing() {
    var a = document.activeElement;
    return !!(a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA"));
  }
  function lastSets(name) {
    var ws = workouts();
    for (var i = 0; i < ws.length; i++) {
      var found = (ws[i].exercises || []).filter(function (e) { return e.n === name; })[0];
      if (found && found.sets && found.sets.length) return found.sets;
    }
    return [];
  }
  function bestEver(name) {
    var best = 0;
    var prs = load("il_prs", {});
    if (prs[name] && Number(prs[name].w) > best) best = Number(prs[name].w);
    workouts().forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        if (e.n !== name) return;
        (e.sets || []).forEach(function (s) { if (s.done && Number(s.w) > best) best = Number(s.w); });
      });
    });
    return best;
  }
  function persistField(t) {
    var s = loadSess(); if (!s) return;
    if (t.id === "sessName") { s.name = t.value; saveSess(s); return; }
    if (t.id === "sessNotes") { s.notes = t.value; saveSess(s); return; }
    var act = t.getAttribute("data-act");
    if (act !== "set-w" && act !== "set-r") return;
    var i = Number(t.getAttribute("data-i"));
    var si = Number(t.getAttribute("data-si"));
    if (!s.exercises || !s.exercises[i] || !s.exercises[i].sets[si]) return;
    if (act === "set-w") s.exercises[i].sets[si].w = t.value;
    else s.exercises[i].sets[si].r = t.value;
    saveSess(s);
  }
  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = String(sec % 60);
    if (s.length < 2) s = "0" + s;
    return m + ":" + s;
  }
  function toast(msg) {
    var el = document.getElementById("prToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "prToast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }
  function hideModalTimer() {
    var ov = document.getElementById("timer");
    if (ov) ov.classList.remove("show");
  }
  function sessionStats() {
    var s = loadSess() || { exercises: [], ts: Date.now() };
    var done = 0, total = 0, vol = 0;
    (s.exercises || []).forEach(function (e) {
      (e.sets || []).forEach(function (x) {
        total += 1;
        if (x.done) { done += 1; vol += (Number(x.w) || 0) * (Number(x.r) || 0); }
      });
    });
    var elapsed = Math.max(0, Math.floor((Date.now() - (s.ts || Date.now())) / 1000));
    return { done: done, total: total, vol: Math.round(vol), elapsed: elapsed };
  }
  function paintStrip(view) {
    var st = sessionStats();
    var el = view.querySelector("#sessStrip");
    if (!el) {
      el = document.createElement("div");
      el.id = "sessStrip";
      el.className = "sess-strip";
      el.innerHTML = "<span></span><span></span><span></span>";
      view.insertBefore(el, view.firstChild);
    }
    var spans = el.querySelectorAll("span");
    if (spans[0]) spans[0].textContent = fmtClock(st.elapsed);
    if (spans[1]) spans[1].textContent = st.done + "/" + st.total + " sets";
    if (spans[2]) spans[2].textContent = (st.vol >= 1000 ? (st.vol / 1000).toFixed(1) + "k" : st.vol) + " kg";
  }
  function paintHeat() {
    var view = document.getElementById("view-home");
    if (!view || !view.classList.contains("active")) return;
    if (view.querySelector("#heat")) return;
    var muscles = ["Chest", "Back", "Shoulders", "Quads", "Hamstrings", "Glutes", "Biceps", "Triceps", "Calves", "Core"];
    var now = new Date(), day = (now.getDay() + 6) % 7;
    var from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day).getTime();
    var hit = {};
    workouts().forEach(function (w) {
      if (w.ts < from) return;
      (w.exercises || []).forEach(function (e) {
        if ((e.sets || []).some(function (s) { return s.done; })) hit[e.m] = true;
      });
    });
    var box = document.createElement("div");
    box.id = "heat";
    box.className = "heat";
    box.innerHTML = muscles.map(function (m) {
      return '<span class="' + (hit[m] ? "on" : "") + '">' + m + "</span>";
    }).join("");
    var stats = view.querySelector(".stats");
    if (stats && stats.nextSibling) view.insertBefore(box, stats.nextSibling);
    else view.insertBefore(box, view.firstChild);
  }
  function enhance() {
    if (typing()) return;
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) {
      clearInterval(sessTick); sessTick = null; return;
    }
    paintStrip(view);
    if (!sessTick) sessTick = setInterval(function () {
      var v = document.getElementById("view-workout");
      if (v && v.classList.contains("active") && !typing()) paintStrip(v);
      else if (!v || !v.classList.contains("active")) { clearInterval(sessTick); sessTick = null; }
    }, 1000);
    hideModalTimer();
    var sess = loadSess();
    Array.prototype.slice.call(view.querySelectorAll(".set-grid")).forEach(function (row) {
      if (row.classList.contains("tiny")) return;
      var wIn = row.querySelector("[data-act='set-w']");
      var rIn = row.querySelector("[data-act='set-r']");
      var chk = row.querySelector("[data-act='toggle-set']");
      if (!wIn) return;
      var i = Number(wIn.getAttribute("data-i"));
      var si = Number(wIn.getAttribute("data-si"));
      var num = row.querySelector("div");
      if (num && !num.querySelector("input")) num.textContent = si === 0 ? "W" : String(si);
      if (chk) {
        chk.classList.add("check-btn");
        chk.textContent = row.classList.contains("done") ? "\u2713" : "";
      }
      var name = sess && sess.exercises && sess.exercises[i] ? sess.exercises[i].n : "";
      var prevList = lastSets(name);
      var prev = prevList[si] || prevList[prevList.length - 1];
      if (prev && (prev.w || prev.r)) {
        if (wIn && !wIn.value) wIn.placeholder = String(prev.w || "");
        if (rIn && !rIn.value) rIn.placeholder = String(prev.r || "");
        if (!row.querySelector(".ghost-set")) {
          var g = document.createElement("div");
          g.className = "ghost-set";
          g.textContent = (prev.w || "\u2014") + " \u00d7 " + (prev.r || "\u2014");
          row.appendChild(g);
        }
      }
      if (!row.querySelector("[data-act='del-set']")) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn icon ghost";
        b.setAttribute("data-act", "del-set");
        b.setAttribute("data-i", String(i));
        b.setAttribute("data-si", String(si));
        b.setAttribute("aria-label", "Delete set");
        b.title = "Hold to delete";
        b.textContent = "\u2013";
        row.appendChild(b);
      }
    });
  }
  function deleteSet(i, si) {
    var s = loadSess();
    if (!s || !s.exercises || !s.exercises[i]) return;
    var ex = s.exercises[i];
    var sets = ex.sets || [];
    var set = sets[si] || {};
    var label = (si === 0 ? "warm-up" : "set " + si) + (ex.n ? " of " + ex.n : "");
    if (set.w || set.r) label += " (" + (set.w || "0") + " kg \u00d7 " + (set.r || "0") + ")";
    if (!confirm("Delete " + label + "?")) return;
    if (sets.length <= 1) sets[0] = { id: uid(), w: "", r: "", done: false };
    else sets.splice(si, 1);
    s.exercises[i].sets = sets;
    saveSess(s);
    var btn = document.querySelector('.nav button[data-view="workout"]');
    if (btn) btn.click();
    setTimeout(enhance, 0);
  }
  document.addEventListener("input", function (e) {
    var t = e.target.closest("[data-act='set-w'], [data-act='set-r'], #sessName, #sessNotes");
    if (t) persistField(t);
  });
  document.addEventListener("change", function (e) {
    var t = e.target.closest("[data-act='set-w'], [data-act='set-r'], #sessName, #sessNotes");
    if (t) persistField(t);
  });
  document.addEventListener("pointerdown", function (e) {
    var t = e.target.closest("[data-act='del-set']");
    if (!t) return;
    pressTimer = setTimeout(function () {
      pressTimer = null;
      if (navigator.vibrate) navigator.vibrate(20);
      deleteSet(Number(t.getAttribute("data-i")), Number(t.getAttribute("data-si")));
    }, 480);
  }, true);
  document.addEventListener("pointerup", function () { clearTimeout(pressTimer); pressTimer = null; }, true);
  document.addEventListener("pointercancel", function () { clearTimeout(pressTimer); pressTimer = null; }, true);
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-act='del-set']")) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    var tog = e.target.closest("[data-act='toggle-set']");
    if (tog) {
      setTimeout(function () {
        hideModalTimer();
        var s = loadSess();
        var i = Number(tog.getAttribute("data-i"));
        var si = Number(tog.getAttribute("data-si"));
        var set = s && s.exercises && s.exercises[i] && s.exercises[i].sets[si];
        if (set && set.done) {
          var name = s.exercises[i].n;
          var w = Number(set.w) || 0;
          var prev = bestEver(name);
          if (w && w > prev) toast("New best " + name.replace(/^Dumbbell\s/, "") + " \u00b7 " + w + " kg");
        }
      }, 40);
    }
  }, true);
  var timer = null;
  function schedule() {
    if (typing()) return;
    if (timer) return;
    timer = setTimeout(function () { timer = null; if (!typing()) { enhance(); paintHeat(); } }, 40);
  }
  function boot() {
    var w = document.getElementById("view-workout");
    if (w) new MutationObserver(schedule).observe(w, { childList: true });
    enhance();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
