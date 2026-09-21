(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function workouts() { return load("il_workouts", []); }
  function fmtDay(ts) {
    return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  var lock = false;
  var timer = null;
  function weekStart(offset) {
    var now = new Date(), day = (now.getDay() + 6) % 7;
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day - offset * 7);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  function weekVol(from, to) {
    var n = 0;
    workouts().forEach(function (w) {
      if (w.ts < from || w.ts >= to) return;
      (w.exercises || []).forEach(function (e) {
        (e.sets || []).forEach(function (s) {
          if (s.done) n += (Number(s.w) || 0) * (Number(s.r) || 0);
        });
      });
    });
    return Math.round(n);
  }
  function fmtVol(n) {
    if (!n) return "0";
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
    return String(n);
  }
  function lastAgo(ts) {
    var days = Math.floor((Date.now() - ts) / 864e5);
    if (days <= 0) return "Today";
    if (days === 1) return "1d ago";
    if (days < 8) return days + "d ago";
    return fmtDay(ts);
  }
  function kind(w) {
    var title = (w.name || "").toLowerCase();
    if (title.indexOf("press") >= 0) return "Press";
    if (title.indexOf("leg") >= 0) return "Legs";
    var names = (w.exercises || []).map(function (e) { return e.n; }).join(" ").toLowerCase();
    var press = /press|fly|bench|shoulder|tricep/.test(names);
    var legs = /squat|lunge|rdl|deadlift|calf|leg /.test(names);
    if (legs && !press) return "Legs";
    if (press && !legs) return "Press";
    return "Train";
  }
  function shortName(n) {
    return String(n || "").replace(/^Dumbbell\s/, "").replace(/\sMachine$/, "");
  }
  function liftDeltas() {
    var map = {};
    workouts().forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        var best = 0;
        (e.sets || []).forEach(function (s) { if (s.done && Number(s.w) > best) best = Number(s.w); });
        if (!best) return;
        if (!map[e.n]) map[e.n] = [];
        var arr = map[e.n];
        if (arr.length && Math.abs(arr[arr.length - 1].w - best) < 0.05 && arr[arr.length - 1].ts === w.ts) return;
        if (arr.length < 2) arr.push({ w: best, ts: w.ts });
      });
    });
    var out = [];
    Object.keys(map).forEach(function (n) {
      var a = map[n];
      if (a.length < 2 || !a[1].w) return;
      var pct = (a[0].w - a[1].w) / a[1].w * 100;
      out.push({ n: n, now: a[0].w, prev: a[1].w, pct: pct, ts: a[0].ts });
    });
    out.sort(function (a, b) { return Math.abs(b.pct) - Math.abs(a.pct); });
    return out.slice(0, 8);
  }
  function paintDash(view) {
    var box = view.querySelector(".stats");
    if (!box) return;
    var last = workouts()[0];
    var tw = weekVol(weekStart(0), weekStart(0) + 7 * 864e5);
    var lw = weekVol(weekStart(1), weekStart(0));
    var delta = "";
    if (lw) {
      var pct = Math.round((tw - lw) / lw * 100);
      delta = (pct >= 0 ? "+" : "") + pct + "%";
    }
    var next = "Press";
    if (last && kind(last) === "Press") next = "Legs";
    else if (last && kind(last) === "Legs") next = "Press";
    box.setAttribute("data-dash", "1");
    box.innerHTML =
      '<div class="stat"><b>' + (last ? lastAgo(last.ts) : "—") + '</b><span class="tiny">last session</span></div>' +
      '<div class="stat stat-accent"><b>' + fmtVol(tw) + '</b><span class="tiny">week volume' + (delta ? " · " + delta : "") + '</span></div>' +
      '<div class="stat"><b>' + next + '</b><span class="tiny">up next</span></div>';
  }
  function paintLifts(view) {
    if (view.querySelector("#liftPct")) return;
    var rows = liftDeltas();
    var card = document.createElement("div");
    card.id = "liftPct";
    card.className = "card";
    if (!rows.length) {
      card.innerHTML = '<div class="tiny">Lift progress</div><div class="tiny" style="margin-top:8px">Need two logged sessions on a lift to show %.</div>';
    } else {
      var html = '<div class="tiny">Lift progress</div>';
      rows.forEach(function (r) {
        var sign = r.pct >= 0 ? "+" : "";
        var col = r.pct > 0.5 ? "#b7e39a" : r.pct < -0.5 ? "#ff6b3d" : "var(--muted)";
        html += '<div class="row space" style="margin-top:10px"><div class="grow">' + shortName(r.n) + '<div class="tiny">' + r.prev + " → " + r.now + ' kg</div></div><div style="font-weight:700;color:' + col + '">' + sign + r.pct.toFixed(0) + "%</div></div>";
      });
      card.innerHTML = html;
    }
    var stats = view.querySelector(".stats");
    var nag = view.querySelector("#backupNag");
    if (nag) nag.insertAdjacentElement("afterend", card);
    else if (stats) stats.insertAdjacentElement("afterend", card);
    else view.insertBefore(card, view.firstChild);
  }
  function lastForTemplate(name, lifts) {
    var set = {};
    (lifts || []).forEach(function (n) { set[n] = true; });
    var hits = workouts().filter(function (w) {
      if ((w.name || "").toLowerCase() === String(name).toLowerCase()) return true;
      return (w.exercises || []).some(function (e) { return set[e.n]; });
    });
    if (!hits.length) return "";
    var w = hits[0], top = "";
    (w.exercises || []).some(function (e) {
      var best = 0;
      (e.sets || []).forEach(function (s) { if (s.done && Number(s.w) > best) best = Number(s.w); });
      if (best) { top = best + " kg " + e.n.replace(/^Dumbbell\s/, ""); return true; }
      return false;
    });
    return "last " + fmtDay(w.ts) + (top ? " · " + top : "");
  }
  function polishHome() {
    var view = document.getElementById("view-home");
    if (!view || !view.classList.contains("active") || lock) return;
    paintDash(view);
    paintLifts(view);
    if (view.getAttribute("data-homeui-ready") === "1" && view.querySelector("[data-act='repeat-last']")) return;
    lock = true;
    var unit = document.getElementById("unitBtn"); if (unit) unit.style.display = "none";
    var instBtn = document.getElementById("installBtn"); if (instBtn) instBtn.style.display = "none";
    var homeInst = document.getElementById("homeInstall"); if (homeInst) homeInst.remove();
    var hint = view.querySelector("#iosHint"); if (hint) hint.style.display = "none";
    var empty = view.querySelector("[data-act='start-fresh']");
    if (empty) { empty.textContent = "New session"; empty.className = "btn ghost"; }
    var repeat = view.querySelector("[data-act='repeat-last']");
    if (repeat) {
      var last = workouts()[0];
      repeat.className = "btn";
      if (last) repeat.textContent = "Repeat " + fmtDay(last.ts);
    }
    Array.prototype.slice.call(view.querySelectorAll("button, .tiny")).forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (t === "Quick add from gear" || t === "Browse dumbbells and machines" || t === "Install app" || t === "Install on iPhone") el.style.display = "none";
    });
    var vol = view.querySelector("#volWeek");
    if (vol && /No sets logged this week/i.test(vol.textContent)) vol.style.display = "none";
    var editOn = !!load("il_tpl_edit", false);
    Array.prototype.slice.call(view.querySelectorAll(".tiny")).forEach(function (lab) {
      if ((lab.textContent || "").trim() !== "Templates") return;
      if (lab.parentElement && lab.parentElement.classList.contains("sec-head")) return;
      var head = document.createElement("div");
      head.className = "row space sec-head";
      head.style.margin = "8px 0";
      head.innerHTML = '<div class="tiny">Templates</div><button class="text-link" type="button" data-act="toggle-tpl-edit">' + (editOn ? "Done" : "Edit") + "</button>";
      lab.replaceWith(head);
    });
    Array.prototype.slice.call(view.querySelectorAll("[data-act='load-routine']")).forEach(function (btn) {
      var card = btn.closest(".card"); if (!card || card.getAttribute("data-homeui")) return;
      card.setAttribute("data-homeui", "1");
      var del = card.querySelector("[data-act='del-routine']");
      btn.style.display = "none";
      if (del) del.style.display = editOn ? "" : "none";
      card.style.cursor = "pointer";
      var nameEl = card.querySelector(".ex-name");
      var name = nameEl ? nameEl.textContent : "";
      var routines = load("il_routines", []);
      var match = routines.filter(function (r) { return r.name === name; })[0];
      var extra = lastForTemplate(name, match ? (match.exercises || []).map(function (e) { return e.n; }) : []);
      var meta = card.querySelector(".tiny");
      if (extra && meta && !meta.getAttribute("data-last")) {
        meta.setAttribute("data-last", "1");
        meta.textContent = extra;
      }
      card.addEventListener("click", function (ev) {
        if (ev.target.closest("[data-act='del-routine'], [data-act='toggle-tpl-edit']")) return;
        btn.click();
      });
    });
    view.setAttribute("data-homeui-ready", "1");
    setTimeout(function () { lock = false; }, 0);
  }
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = null; polishHome(); }, 80);
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-act='toggle-tpl-edit']")) return;
    try {
      var cur = !!JSON.parse(localStorage.getItem("il_tpl_edit") || "false");
      localStorage.setItem("il_tpl_edit", JSON.stringify(!cur));
    } catch (err) { localStorage.setItem("il_tpl_edit", "true"); }
    var view = document.getElementById("view-home");
    if (view) view.removeAttribute("data-homeui-ready");
    document.querySelector('.nav button[data-view="home"]').click();
  });
  setTimeout(function () {
    var n = document.getElementById("view-home");
    if (n) new MutationObserver(schedule).observe(n, { childList: true });
    polishHome();
  }, 400);
})();
