(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function workouts() { return load("il_workouts", []); }
  function fmtDay(ts) {
    return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c];
    });
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
      out.push({ n: n, now: a[0].w, prev: a[1].w, pct: (a[0].w - a[1].w) / a[1].w * 100, ts: a[0].ts });
    });
    return out;
  }
  function avgPct(rows) {
    if (!rows.length) return null;
    var s = 0;
    rows.forEach(function (r) { s += r.pct; });
    return s / rows.length;
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
    var avg = avgPct(liftDeltas());
    var liftLabel = avg == null ? "—" : (avg >= 0 ? "+" : "") + avg.toFixed(0) + "%";
    box.setAttribute("data-dash", "1");
    box.innerHTML =
      '<div class="stat"><b>' + (last ? lastAgo(last.ts) : "—") + '</b><span class="tiny">last session</span></div>' +
      '<div class="stat stat-accent"><b>' + fmtVol(tw) + '</b><span class="tiny">week volume' + (delta ? " · " + delta : "") + '</span></div>' +
      '<div class="stat"><b>' + liftLabel + '</b><span class="tiny">lift progress</span></div>';
  }
  function paintPrPct() {
    var view = document.getElementById("view-progress");
    if (!view || !view.classList.contains("active")) return;
    var map = {};
    liftDeltas().forEach(function (r) { map[r.n] = r; });
    Array.prototype.slice.call(view.querySelectorAll(".card")).forEach(function (card) {
      if (card.querySelector(".pr-pct")) return;
      var nameEl = card.querySelector(".ex-name");
      if (!nameEl) return;
      var r = map[nameEl.textContent.trim()];
      if (!r) return;
      var sign = r.pct >= 0 ? "+" : "";
      var col = r.pct > 0.5 ? "#b7e39a" : r.pct < -0.5 ? "#ff6b3d" : "var(--muted)";
      var line = document.createElement("div");
      line.className = "row space pr-pct";
      line.style.marginTop = "8px";
      line.innerHTML = '<span class="tiny">vs last ' + r.prev + " → " + r.now + ' kg</span><span style="font-weight:700;color:' + col + '">' + sign + r.pct.toFixed(0) + "%</span>";
      card.appendChild(line);
    });
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
  function openTemplate(id) {
    var routines = load("il_routines", []);
    var r = routines.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var html = '<div class="grab"></div><div class="ex-name">' + esc(r.name) + '</div>';
    html += '<div class="tiny" style="margin:6px 0 12px">' + (r.exercises || []).length + ' exercises</div>';
    (r.exercises || []).forEach(function (e, i) {
      html += '<div class="row space" style="margin-top:8px"><div>' + (i + 1) + '. ' + esc(e.n) + '</div><div class="tiny">' + esc(e.m || e.t || "") + '</div></div>';
    });
    html += '<div style="height:16px"></div><button class="btn" type="button" data-act="load-routine" data-id="' + esc(r.id) + '">Start this session</button>';
    var sheet = document.getElementById("sheet"), modal = document.getElementById("modal");
    if (sheet && modal) { sheet.innerHTML = html; modal.classList.add("show"); }
  }
  function bindTemplates(view) {
    var editOn = !!load("il_tpl_edit", false);
    Array.prototype.slice.call(view.querySelectorAll("[data-act='load-routine']")).forEach(function (btn) {
      if (btn.closest("#sheet")) return;
      var card = btn.closest(".card"); if (!card) return;
      var id = btn.getAttribute("data-id");
      if (id) card.setAttribute("data-tpl-id", id);
      btn.style.display = "none";
      var del = card.querySelector("[data-act='del-routine']");
      if (del) del.style.display = editOn ? "" : "none";
      card.style.cursor = "pointer";
      var nameEl = card.querySelector(".ex-name");
      var name = nameEl ? nameEl.textContent : "";
      var routines = load("il_routines", []);
      var match = routines.filter(function (r) { return r.id === id || r.name === name; })[0];
      var extra = lastForTemplate(name, match ? (match.exercises || []).map(function (e) { return e.n; }) : []);
      var meta = card.querySelector(".tiny");
      if (extra && meta && !meta.getAttribute("data-last")) {
        meta.setAttribute("data-last", "1");
        meta.textContent = extra;
      }
    });
  }
  function polishHome() {
    var view = document.getElementById("view-home");
    if (!view || !view.classList.contains("active") || lock) return;
    lock = true;
    paintDash(view);
    var oldList = view.querySelector("#liftPct");
    if (oldList) oldList.remove();
    var unit = document.getElementById("unitBtn"); if (unit) unit.style.display = "none";
    var instBtn = document.getElementById("installBtn"); if (instBtn) instBtn.style.display = "none";
    var homeInst = document.getElementById("homeInstall"); if (homeInst) homeInst.remove();
    var hint = view.querySelector("#iosHint"); if (hint) hint.style.display = "none";
    var empty = view.querySelector("[data-act='start-fresh']");
    if (empty) empty.style.display = "none";
    var repeat = view.querySelector("[data-act='repeat-last']");
    if (repeat) repeat.remove();
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
    bindTemplates(view);
    setTimeout(function () { lock = false; }, 0);
  }
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = null; polishHome(); paintPrPct(); }, 80);
  }
  document.addEventListener("click", function (e) {
    var card = e.target.closest("#view-home [data-tpl-id]");
    if (card && !e.target.closest("[data-act='del-routine'], [data-act='toggle-tpl-edit']")) {
      e.preventDefault();
      e.stopPropagation();
      openTemplate(card.getAttribute("data-tpl-id"));
      return;
    }
    if (e.target.closest("[data-act='toggle-tpl-edit']")) {
      try {
        var cur = !!JSON.parse(localStorage.getItem("il_tpl_edit") || "false");
        localStorage.setItem("il_tpl_edit", JSON.stringify(!cur));
      } catch (err) { localStorage.setItem("il_tpl_edit", "true"); }
      document.querySelector('.nav button[data-view="home"]').click();
    }
    if (e.target.closest("#sheet [data-act='load-routine']")) {
      var modal = document.getElementById("modal");
      if (modal) modal.classList.remove("show");
    }
    if (e.target.id === "modal") e.target.classList.remove("show");
  }, true);
  setTimeout(function () {
    ["view-home", "view-progress"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) new MutationObserver(schedule).observe(n, { childList: true });
    });
    polishHome();
    paintPrPct();
  }, 400);
})();
