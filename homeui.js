(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function workouts() { return load("il_workouts", []); }
  function favs() { return load("il_fav_tpls", []); }
  function fmtDay(ts) {
    return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c];
    });
  }
  function shortName(n) {
    return String(n || "").replace(/^Dumbbell\s/, "").replace(/\sMachine$/, "");
  }
  var lock = false;
  var timer = null;
  function weekStart(offset) {
    var now = new Date(), day = (now.getDay() + 6) % 7;
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day - offset * 7);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
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
  function lastAgo(ts) {
    var days = Math.floor((Date.now() - ts) / 864e5);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 8) return days + " days ago";
    return fmtDay(ts);
  }
  function latestPr() {
    var prs = load("il_prs", {});
    var best = null;
    Object.keys(prs).forEach(function (n) {
      var p = prs[n] || {};
      if (!best || (p.ts || 0) > (best.ts || 0) || ((p.ts || 0) === (best.ts || 0) && (p.w || 0) > (best.w || 0))) {
        best = { n: n, w: p.w, r: p.r, ts: p.ts };
      }
    });
    return best;
  }
  function liftSeries() {
    var map = {};
    workouts().slice().sort(function (a, b) { return a.ts - b.ts; }).forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        var best = 0;
        (e.sets || []).forEach(function (s) { if (s.done && Number(s.w) > best) best = Number(s.w); });
        if (!best) return;
        if (!map[e.n]) map[e.n] = [];
        var arr = map[e.n];
        if (arr.length && arr[arr.length - 1].ts === w.ts) {
          if (best > arr[arr.length - 1].w) arr[arr.length - 1].w = best;
          return;
        }
        arr.push({ ts: w.ts, w: best });
      });
    });
    return map;
  }
  function liftDeltas() {
    var out = [];
    var series = liftSeries();
    Object.keys(series).forEach(function (n) {
      var a = series[n];
      if (a.length < 2 || !a[a.length - 2].w) return;
      var now = a[a.length - 1], prev = a[a.length - 2];
      out.push({ n: n, now: now.w, prev: prev.w, pct: (now.w - prev.w) / prev.w * 100, ts: now.ts });
    });
    out.sort(function (a, b) { return Math.abs(b.pct) - Math.abs(a.pct); });
    return out;
  }
  function sparkSvg(pts) {
    if (!pts || pts.length < 2) return "";
    var w = 280, h = 56, pad = 6;
    var max = Math.max.apply(null, pts.map(function (p) { return p.w; }));
    var min = Math.min.apply(null, pts.map(function (p) { return p.w; }));
    var span = Math.max(0.5, max - min);
    var d = pts.map(function (p, i) {
      var x = pts.length === 1 ? w / 2 : (i / (pts.length - 1)) * w;
      var y = h - pad - ((p.w - min) / span) * (h - pad * 2);
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    var last = pts[pts.length - 1];
    var lx = pts.length === 1 ? w / 2 : w;
    var ly = h - pad - ((last.w - min) / span) * (h - pad * 2);
    return '<svg class="trend" viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="56" preserveAspectRatio="none">' +
      '<polyline fill="none" stroke="#FFD400" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" points="' + d + '" />' +
      '<circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="3.2" fill="#FFD400" /></svg>' +
      '<div class="row space"><span class="tiny">' + fmtDay(pts[0].ts) + '</span><span class="tiny">' + pts.length + ' sessions \u00b7 ' + fmtDay(last.ts) + '</span></div>';
  }
  function paintAction(view) {
    var last = workouts()[0];
    var session = load("il_session", null);
    var live = session && session.exercises && session.exercises.length;
    var bar = view.querySelector("#startWork");
    if (!bar) {
      bar = document.createElement("button");
      bar.type = "button";
      bar.id = "startWork";
      bar.className = "btn";
      bar.style.cssText = "margin:4px 0 12px;min-height:52px;font-size:17px";
      view.insertBefore(bar, view.firstChild);
    } else if (view.firstChild !== bar) {
      view.insertBefore(bar, view.firstChild);
    }
    bar.textContent = live ? "Resume workout" : "Start workout";
    bar.setAttribute("data-act", live ? "go-workout" : "start-home");

    var lastLine = last ? (last.name || "Workout") + " \u00b7 " + lastAgo(last.ts) : "No sessions yet";
    var n = weekStreak();
    var streakLine = n ? n + " week streak" : "No streak yet";
    var pr = latestPr();
    var prLine = pr ? shortName(pr.n) + " \u00b7 " + pr.w + " kg" + (pr.r ? " \u00d7 " + pr.r : "") : "No PRs yet";

    var box = view.querySelector(".stats");
    if (box) {
      box.setAttribute("data-dash", "1");
      box.innerHTML =
        '<div class="stat"><b style="font-size:13px;line-height:1.25">' + esc(last ? lastAgo(last.ts) : "\u2014") + '</b><span class="tiny">Last workout</span></div>' +
        '<div class="stat stat-accent"><b style="font-size:13px;line-height:1.25">' + esc(n ? n + " wk" : "\u2014") + '</b><span class="tiny">Streak</span></div>' +
        '<div class="stat"><b style="font-size:13px;line-height:1.25">' + esc(pr ? pr.w + " kg" : "\u2014") + '</b><span class="tiny">Latest PR</span></div>';
    }
    var snap = view.querySelector("#homeSnap");
    if (!snap) {
      snap = document.createElement("div");
      snap.id = "homeSnap";
      if (box && box.nextSibling) view.insertBefore(snap, box.nextSibling);
      else bar.insertAdjacentElement("afterend", snap);
    }
    snap.innerHTML =
      '<div class="card"><div class="tiny">Last workout</div><div class="ex-name" style="margin-top:4px">' + esc(last ? (last.name || "Workout") : "None yet") + '</div><div class="tiny" style="margin-top:4px">' + esc(lastLine) + '</div></div>' +
      '<div class="card"><div class="tiny">Current streak</div><div class="ex-name" style="margin-top:4px">' + esc(streakLine) + '</div><div class="tiny" style="margin-top:4px">' + workouts().length + ' sessions logged</div></div>' +
      '<div class="card"><div class="tiny">Most recent PR</div><div class="ex-name" style="margin-top:4px">' + esc(pr ? shortName(pr.n) : "None yet") + '</div><div class="tiny" style="margin-top:4px">' + esc(prLine) + (pr && pr.ts ? " \u00b7 " + fmtDay(pr.ts) : "") + '</div></div>';
    var streakEl = view.querySelector("#homeStreak");
    if (streakEl) streakEl.style.display = "none";
  }
  function paintFeed(view) {
    if (view.querySelector("#homeFeed")) return;
    var movers = liftDeltas().slice(0, 4);
    if (!movers.length) return;
    var html = '<div class="card"><div class="tiny">Moving lifts</div>';
    movers.forEach(function (r) {
      var sign = r.pct >= 0 ? "+" : "";
      var col = r.pct > 0.5 ? "#b7e39a" : r.pct < -0.5 ? "#ff6b3d" : "var(--muted)";
      html += '<div class="row space" style="margin-top:8px"><div class="grow">' + esc(shortName(r.n)) + '<div class="tiny">' + r.prev + ' \u2192 ' + r.now + ' kg</div></div><div style="font-weight:700;color:' + col + '">' + sign + r.pct.toFixed(0) + '%</div></div>';
    });
    html += '</div>';
    var feed = document.createElement("div");
    feed.id = "homeFeed";
    feed.innerHTML = html;
    var snap = view.querySelector("#homeSnap");
    var head = view.querySelector(".sec-head") || view.querySelector("[data-tpl-id]");
    if (snap && snap.nextSibling) view.insertBefore(feed, snap.nextSibling);
    else if (head) view.insertBefore(feed, head);
    else view.appendChild(feed);
  }
  function paintPrPct() {
    var view = document.getElementById("view-progress");
    if (!view || !view.classList.contains("active")) return;
    Array.prototype.slice.call(view.querySelectorAll(".chart-card")).forEach(function (el) { el.style.display = "none"; });
    var map = {};
    liftDeltas().forEach(function (r) { map[r.n] = r; });
    var series = liftSeries();
    Array.prototype.slice.call(view.querySelectorAll(".card")).forEach(function (card) {
      if (card.classList.contains("chart-card")) return;
      var nameEl = card.querySelector(".ex-name");
      if (!nameEl) return;
      var name = nameEl.textContent.trim();
      var pts = series[name] || [];
      if (!card.querySelector(".trend-wrap") && pts.length >= 2) {
        var wrap = document.createElement("div");
        wrap.className = "trend-wrap";
        wrap.style.marginTop = "10px";
        wrap.innerHTML = sparkSvg(pts);
        var bar = card.querySelector(".bar");
        if (bar) bar.style.display = "none";
        card.appendChild(wrap);
      }
      if (card.querySelector(".pr-pct")) return;
      var r = map[name];
      if (!r) return;
      var sign = r.pct >= 0 ? "+" : "";
      var col = r.pct > 0.5 ? "#b7e39a" : r.pct < -0.5 ? "#ff6b3d" : "var(--muted)";
      var line = document.createElement("div");
      line.className = "row space pr-pct";
      line.style.marginTop = "8px";
      line.innerHTML = '<span class="tiny">vs last ' + r.prev + " \u2192 " + r.now + ' kg</span><span style="font-weight:700;color:' + col + '">' + sign + r.pct.toFixed(0) + "%</span>";
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
    return "last " + fmtDay(w.ts) + (top ? " \u00b7 " + top : "");
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
  function startFromHome() {
    var session = load("il_session", null);
    if (session && session.exercises && session.exercises.length) {
      var train = document.querySelector('.nav button[data-view="workout"]');
      if (train) train.click();
      return;
    }
    var routines = load("il_routines", []);
    var pinned = favs();
    var pick = routines.filter(function (r) { return pinned.indexOf(r.id) !== -1; })[0] || routines[0];
    if (pick) {
      var btn = document.querySelector('[data-act="load-routine"][data-id="' + pick.id + '"]');
      if (btn) { btn.click(); return; }
      openTemplate(pick.id);
      return;
    }
    var train = document.querySelector('.nav button[data-view="workout"]');
    if (train) train.click();
  }
  function bindTemplates(view) {
    var editOn = !!load("il_tpl_edit", false);
    var pinned = favs();
    var hasFavs = pinned.length > 0;
    Array.prototype.slice.call(view.querySelectorAll("[data-act='load-routine']")).forEach(function (btn) {
      if (btn.closest("#sheet")) return;
      var card = btn.closest(".card"); if (!card) return;
      var id = btn.getAttribute("data-id");
      if (id) card.setAttribute("data-tpl-id", id);
      btn.style.display = "none";
      var del = card.querySelector("[data-act='del-routine']");
      if (del) del.style.display = editOn ? "" : "none";
      card.style.cursor = "pointer";
      var on = pinned.indexOf(id) !== -1;
      if (!card.querySelector("[data-act='fav-tpl']")) {
        var star = document.createElement("button");
        star.type = "button";
        star.setAttribute("data-act", "fav-tpl");
        star.setAttribute("data-id", id);
        star.className = "text-link";
        star.style.cssText = "font-size:18px;line-height:1;min-height:0;padding:0;width:28px;flex:0 0 28px;text-align:right;color:" + (on ? "var(--accent)" : "#5a5a5a");
        star.textContent = on ? "\u2605" : "\u2606";
        var row = card.querySelector(".row.space") || card;
        row.appendChild(star);
      } else {
        var existing = card.querySelector("[data-act='fav-tpl']");
        existing.textContent = on ? "\u2605" : "\u2606";
        existing.style.color = on ? "var(--accent)" : "#5a5a5a";
      }
      if (hasFavs && !editOn && !on) card.style.display = "none";
      else card.style.display = "";
      var nameEl = card.querySelector(".ex-name");
      if (nameEl) {
        nameEl.style.textAlign = "left";
        nameEl.style.flex = "1";
      }
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
    var headLab = view.querySelector(".sec-head .tiny");
    if (headLab) headLab.textContent = hasFavs && !editOn ? "Pinned" : "Templates";
  }
  function scrub(view) {
    Array.prototype.slice.call(view.querySelectorAll("button")).forEach(function (el) {
      if (el.id === "startWork") return;
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (/^repeat/i.test(t) || t === "Quick add from gear" || t === "Browse dumbbells and machines" || t === "Install app" || t === "Install on iPhone" || t === "Start empty workout") el.remove();
    });
  }
  function polishHome() {
    var view = document.getElementById("view-home");
    if (!view) return;
    view.classList.add("ready");
    if (!view.classList.contains("active") || lock) return;
    if (!view.querySelector(".stats") && !view.querySelector(".card") && !view.querySelector("#startWork")) return;
    lock = true;
    try {
      paintAction(view);
      scrub(view);
      var vol = view.querySelector("#volWeek");
      if (vol) vol.style.display = "none";
      var editOn = !!load("il_tpl_edit", false);
      Array.prototype.slice.call(view.querySelectorAll(".tiny")).forEach(function (lab) {
        if ((lab.textContent || "").trim() !== "Templates" && (lab.textContent || "").trim() !== "Pinned") return;
        if (lab.parentElement && lab.parentElement.classList.contains("sec-head")) return;
        var head = document.createElement("div");
        head.className = "row space sec-head";
        head.style.margin = "8px 0";
        head.innerHTML = '<div class="tiny">Templates</div><button class="text-link" type="button" data-act="toggle-tpl-edit">' + (editOn ? "Done" : "Edit") + "</button>";
        lab.replaceWith(head);
      });
      bindTemplates(view);
      paintFeed(view);
    } catch (err) {}
    view.classList.add("ready");
    setTimeout(function () { lock = false; }, 30);
  }
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = null; polishHome(); paintPrPct(); }, 80);
  }
  function reloadHome() {
    var btn = document.querySelector('.nav button[data-view="home"]');
    if (btn) btn.click();
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-act='start-home'], #startWork")) {
      e.preventDefault();
      e.stopPropagation();
      startFromHome();
      return;
    }
    var star = e.target.closest("[data-act='fav-tpl']");
    if (star) {
      e.preventDefault();
      e.stopPropagation();
      var id = star.getAttribute("data-id");
      var a = favs();
      var i = a.indexOf(id);
      if (i >= 0) a.splice(i, 1);
      else a.push(id);
      save("il_fav_tpls", a);
      var view = document.getElementById("view-home");
      if (view) bindTemplates(view);
      return;
    }
    var card = e.target.closest("#view-home [data-tpl-id]");
    if (card && !e.target.closest("[data-act='del-routine'], [data-act='toggle-tpl-edit'], [data-act='fav-tpl']")) {
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
      reloadHome();
    }
    if (e.target.closest("#sheet [data-act='load-routine']")) {
      var modal = document.getElementById("modal");
      if (modal) modal.classList.remove("show");
    }
    if (e.target.id === "modal") e.target.classList.remove("show");
  }, true);
  function boot() {
    var n = document.getElementById("view-home");
    if (n) {
      n.classList.add("ready");
      new MutationObserver(schedule).observe(n, { childList: true });
    }
    var p = document.getElementById("view-progress");
    if (p) new MutationObserver(schedule).observe(p, { childList: true });
    polishHome();
    paintPrPct();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
