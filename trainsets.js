(function () {
  var restLeft = 0, restTick = null, sessTick = null, pressTimer = null;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function loadSess() { return load("il_session", null); }
  function saveSess(s) { localStorage.setItem("il_session", JSON.stringify(s)); }
  function workouts() { return load("il_workouts", []); }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function restSec() { return Number(load("il_rest", 90)) || 90; }
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
    var act = t.getAttribute("data-act");
    if (act !== "set-w" && act !== "set-r") return;
    var s = loadSess();
    var i = Number(t.getAttribute("data-i"));
    var si = Number(t.getAttribute("data-si"));
    if (!s || !s.exercises || !s.exercises[i] || !s.exercises[i].sets[si]) return;
    if (act === "set-w") s.exercises[i].sets[si].w = t.value;
    else s.exercises[i].sets[si].r = t.value;
    saveSess(s);
  }
  function fmtClock(sec) {
    sec = Math.max(0, sec);
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
  function startInlineRest(card, sec) {
    restLeft = sec || restSec();
    hideModalTimer();
    var chip = card && card.querySelector(".rest-chip");
    if (!chip && card) {
      chip = document.createElement("button");
      chip.type = "button";
      chip.className = "rest-chip";
      chip.setAttribute("data-act", "skip-inline-rest");
      card.appendChild(chip);
    }
    Array.prototype.slice.call(document.querySelectorAll(".rest-chip")).forEach(function (c) {
      if (c !== chip) c.remove();
    });
    function tick() {
      if (!chip) return;
      chip.textContent = "Rest " + fmtClock(restLeft) + "  ·  skip";
      chip.classList.toggle("warn", restLeft <= 10);
      if (restLeft <= 0) {
        clearInterval(restTick);
        chip.remove();
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
        return;
      }
      restLeft -= 1;
    }
    clearInterval(restTick);
    tick();
    restTick = setInterval(tick, 1000);
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
      view.insertBefore(el, view.firstChild);
    }
    el.innerHTML = "<span>" + fmtClock(st.elapsed) + "</span><span>" + st.done + "/" + st.total + " sets</span><span>" + (st.vol >= 1000 ? (st.vol / 1000).toFixed(1) + "k" : st.vol) + " kg</span>";
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
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) {
      clearInterval(sessTick); sessTick = null; return;
    }
    paintStrip(view);
    if (!sessTick) sessTick = setInterval(function () {
      var v = document.getElementById("view-workout");
      if (v && v.classList.contains("active")) paintStrip(v);
      else { clearInterval(sessTick); sessTick = null; }
    }, 1000);
    hideModalTimer();
    Array.prototype.slice.call(view.querySelectorAll(".card .tiny")).forEach(function (el) {
      var t = el.textContent || "";
      if (/dumbbell|machine/i.test(t)) el.textContent = t.replace(/dumbbell/ig, "Dumbbell").replace(/machine/ig, "Machine");
    });
    var sess = loadSess();
    Array.prototype.slice.call(view.querySelectorAll(".set-grid")).forEach(function (row) {
      if (row.classList.contains("tiny")) {
        if (row.children.length === 4 && !row.querySelector("[data-col='del']")) {
          var h = document.createElement("div");
          h.setAttribute("data-col", "del");
          row.appendChild(h);
        }
        return;
      }
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
          g.textContent = (prev.w || "—") + " × " + (prev.r || "—");
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
    if (set.w || set.r) label += " (" + (set.w || "0") + " kg × " + (set.r || "0") + ")";
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
    var t = e.target.closest("[data-act='set-w'], [data-act='set-r']");
    if (t) persistField(t);
  });
  document.addEventListener("change", function (e) {
    var t = e.target.closest("[data-act='set-w'], [data-act='set-r']");
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
    if (e.target.closest("[data-act='skip-inline-rest']")) {
      restLeft = 0;
      clearInterval(restTick);
      var chip = e.target.closest(".rest-chip");
      if (chip) chip.remove();
      hideModalTimer();
      return;
    }
    var tog = e.target.closest("[data-act='toggle-set']");
    if (tog) {
      var card = tog.closest(".card");
      var i = Number(tog.getAttribute("data-i"));
      var si = Number(tog.getAttribute("data-si"));
      setTimeout(function () {
        hideModalTimer();
        var s = loadSess();
        var set = s && s.exercises && s.exercises[i] && s.exercises[i].sets[si];
        if (set && set.done) {
          startInlineRest(card, restSec());
          var name = s.exercises[i].n;
          var w = Number(set.w) || 0;
          var prev = bestEver(name);
          if (w && w > prev) toast("New best " + name.replace(/^Dumbbell\s/, "") + " · " + w + " kg");
        }
        enhance();
      }, 30);
    }
    if (e.target.closest("[data-act='start-timer']")) {
      setTimeout(function () {
        hideModalTimer();
        var card = e.target.closest(".card");
        startInlineRest(card, restSec());
      }, 20);
    }
  }, true);
  var timer = null;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = null; enhance(); paintHeat(); }, 40);
  }
  function boot() {
    ["view-workout", "view-home"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) new MutationObserver(schedule).observe(n, { childList: true, subtree: true });
    });
    enhance();
    paintHeat();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
