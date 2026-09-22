(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function workouts() { return load("il_workouts", []); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c];
    });
  }
  function shortName(n) {
    return String(n || "").replace(/^Dumbbell\s/, "").replace(/\sMachine$/, "");
  }
  function fmtDay(ts) {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  function build() {
    var map = {};
    var ws = workouts().slice().sort(function (a, b) { return a.ts - b.ts; });
    ws.forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        var rec = map[e.n] || (map[e.n] = {
          weight: null, prevWeight: null,
          reps: null, prevReps: null,
          volume: null, prevVolume: null
        });
        var vol = 0;
        (e.sets || []).forEach(function (s) {
          var kg = Number(s.w) || 0, rp = Number(s.r) || 0;
          if (!kg && !rp) return;
          vol += kg * rp;
          if (kg && (!rec.weight || kg > rec.weight.w)) {
            rec.prevWeight = rec.weight;
            rec.weight = { w: kg, r: rp, ts: w.ts };
          }
          if (rp && (!rec.reps || rp > rec.reps.r)) {
            rec.prevReps = rec.reps;
            rec.reps = { w: kg, r: rp, ts: w.ts };
          }
        });
        if (vol && (!rec.volume || vol > rec.volume.vol)) {
          rec.prevVolume = rec.volume;
          rec.volume = { vol: Math.round(vol), ts: w.ts };
        }
      });
    });
    return map;
  }
  function css() {
    var s = document.getElementById("prStyle");
    if (!s) { s = document.createElement("style"); s.id = "prStyle"; document.head.appendChild(s); }
    s.textContent =
      "#prBoard .pr-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}" +
      "#prBoard .pr-cell{background:#161616;border:1px solid #222;border-radius:12px;padding:8px 6px;text-align:center}" +
      "#prBoard .pr-cell b{display:block;font-size:15px;font-variant-numeric:tabular-nums}" +
      "#prBoard .pr-cell span{display:block;font-size:9px;color:#8d8d8d;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}" +
      "#prBoard .pr-prev{font-size:11px;color:#6a6a6a;margin-top:4px}" +
      "#prPop{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:80;pointer-events:none}" +
      "#prPop.on{display:flex}" +
      "#prPop .burst{background:#FFD400;color:#111;font-weight:800;padding:18px 22px;border-radius:20px;text-align:center;animation:prpop .7s ease}" +
      "@keyframes prpop{0%{transform:scale(.6);opacity:0}40%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}" +
      "#view-progress > .card{display:none!important}" +
      "#prBoard .card{display:block!important}";
  }
  function paint() {
    var view = document.getElementById("view-progress");
    if (!view || !view.classList.contains("active")) return;
    css();
    var board = view.querySelector("#prBoard");
    if (!board) {
      board = document.createElement("div");
      board.id = "prBoard";
      view.insertBefore(board, view.firstChild);
    }
    var map = build();
    var names = Object.keys(map).sort(function (a, b) {
      var ta = (map[a].weight && map[a].weight.ts) || 0;
      var tb = (map[b].weight && map[b].weight.ts) || 0;
      return tb - ta;
    });
    if (!names.length) {
      board.innerHTML = '<div class="card empty">Hit a lift to land a PR.</div>';
      return;
    }
    var html = "";
    names.forEach(function (n) {
      var r = map[n];
      html += '<div class="card"><div class="ex-name">' + esc(shortName(n)) + "</div><div class=\"pr-grid\">";
      html += cell("Weight", r.weight ? r.weight.w + " kg" : "\u2014", r.weight && r.weight.ts ? fmtDay(r.weight.ts) : "", r.prevWeight ? "prev " + r.prevWeight.w + " kg \u00b7 " + fmtDay(r.prevWeight.ts) : "");
      html += cell("Reps", r.reps ? r.reps.r + " @ " + (r.reps.w || "?") : "\u2014", r.reps && r.reps.ts ? fmtDay(r.reps.ts) : "", r.prevReps ? "prev " + r.prevReps.r + " \u00b7 " + fmtDay(r.prevReps.ts) : "");
      html += cell("Volume", r.volume ? (r.volume.vol >= 1000 ? (r.volume.vol / 1000).toFixed(1) + "k" : r.volume.vol) : "\u2014", r.volume && r.volume.ts ? fmtDay(r.volume.ts) : "", r.prevVolume ? "prev " + r.prevVolume.vol + " \u00b7 " + fmtDay(r.prevVolume.ts) : "");
      html += "</div></div>";
    });
    board.innerHTML = html;
  }
  function cell(lab, val, when, prev) {
    return '<div class="pr-cell"><span>' + lab + "</span><b>" + esc(val) + "</b><div class=\"tiny\">" + esc(when) + "</div>" +
      (prev ? '<div class="pr-prev">' + esc(prev) + "</div>" : "") + "</div>";
  }
  function celebrate(msg) {
    var pop = document.getElementById("prPop");
    if (!pop) {
      pop = document.createElement("div");
      pop.id = "prPop";
      pop.innerHTML = '<div class="burst"></div>';
      document.body.appendChild(pop);
    }
    pop.querySelector(".burst").textContent = msg;
    pop.classList.add("on");
    clearTimeout(pop._t);
    pop._t = setTimeout(function () { pop.classList.remove("on"); }, 1400);
    var toast = document.getElementById("prToast");
    if (toast) {
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(function () { toast.classList.remove("show"); }, 1600);
    }
  }
  function checkSet(name, w, r) {
    var rec = build()[name] || {};
    var hits = [];
    if (w && (!rec.weight || w > rec.weight.w)) {
      hits.push("Weight PR " + w + " kg" + (rec.weight ? " \u2014 was " + rec.weight.w + " kg " + fmtDay(rec.weight.ts) : ""));
    }
    if (r && (!rec.reps || r > rec.reps.r)) {
      hits.push("Rep PR " + r + (rec.reps ? " \u2014 was " + rec.reps.r + " " + fmtDay(rec.reps.ts) : ""));
    }
    if (hits.length) celebrate(hits[0]);
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act='toggle-set']");
    if (!btn) return;
    setTimeout(function () {
      var i = Number(btn.getAttribute("data-i"));
      var si = Number(btn.getAttribute("data-si"));
      var s = load("il_session", null);
      if (!s || !s.exercises || !s.exercises[i]) return;
      var ex = s.exercises[i];
      var set = (ex.sets || [])[si];
      if (!set || !set.done) return;
      checkSet(ex.n, Number(set.w) || 0, Number(set.r) || 0);
    }, 60);
  }, true);
  var t = null;
  function boot() {
    var n = document.getElementById("view-progress");
    if (n) new MutationObserver(function () {
      if (t) return;
      t = setTimeout(function () { t = null; paint(); }, 60);
    }).observe(n, { childList: true });
    document.querySelectorAll(".nav button").forEach(function (b) {
      b.addEventListener("click", function () { setTimeout(paint, 40); });
    });
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
