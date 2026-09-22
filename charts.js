(function () {
  var mode = "lift";
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function workouts() { return load("il_workouts", []); }
  function bw() { return load("il_bw", []); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;" })[c];
    });
  }
  function liftNames() {
    var set = {};
    workouts().forEach(function (w) {
      (w.exercises || []).forEach(function (e) { set[e.n] = true; });
    });
    return Object.keys(set).sort();
  }
  function liftPts(name) {
    var pts = [];
    workouts().slice().sort(function (a, b) { return a.ts - b.ts; }).forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        if (e.n !== name) return;
        var best = 0;
        (e.sets || []).forEach(function (s) { if (Number(s.w) > best) best = Number(s.w); });
        if (best) pts.push({ ts: w.ts, v: best });
      });
    });
    return pts;
  }
  function volPts() {
    return workouts().slice().sort(function (a, b) { return a.ts - b.ts; }).map(function (w) {
      var n = 0;
      (w.exercises || []).forEach(function (e) {
        (e.sets || []).forEach(function (s) { n += (Number(s.w) || 0) * (Number(s.r) || 0); });
      });
      return { ts: w.ts, v: Math.round(n) };
    }).filter(function (p) { return p.v; });
  }
  function freqPts() {
    var weeks = {};
    workouts().forEach(function (w) {
      var d = new Date(w.ts);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      var k = d.getTime();
      weeks[k] = (weeks[k] || 0) + 1;
    });
    return Object.keys(weeks).sort().map(function (k) { return { ts: Number(k), v: weeks[k] }; });
  }
  function svg(pts) {
    if (!pts || pts.length < 2) return '<div class="tiny">Need two points.</div>';
    var w = 320, h = 140, pad = 12;
    var max = Math.max.apply(null, pts.map(function (p) { return p.v; }));
    var min = Math.min.apply(null, pts.map(function (p) { return p.v; }));
    var span = Math.max(0.5, max - min);
    var d = pts.map(function (p, i) {
      var x = pad + (i / (pts.length - 1)) * (w - pad * 2);
      var y = h - pad - ((p.v - min) / span) * (h - pad * 2);
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    var last = pts[pts.length - 1];
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="140" preserveAspectRatio="none">' +
      '<polyline fill="none" stroke="#FFD400" stroke-width="2.6" points="' + d + '" /></svg>' +
      '<div class="row space"><span class="tiny">' + new Date(pts[0].ts).toLocaleDateString(undefined, { day: "numeric", month: "short" }) + '</span>' +
      '<span class="tiny">now ' + last.v + '</span></div>';
  }
  function paint() {
    var view = document.getElementById("view-progress");
    if (!view || !view.classList.contains("active")) return;
    var box = view.querySelector("#chartBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "chartBox";
      box.className = "card";
      var board = view.querySelector("#prBoard");
      if (board) view.insertBefore(box, board);
      else view.insertBefore(box, view.firstChild);
    }
    var names = liftNames();
    var pick = box.getAttribute("data-lift") || names[0] || "";
    var html = '<div class="ex-name">Charts</div><div class="chips" style="margin-top:8px">';
    [["lift","Lift weight"],["vol","Volume"],["bw","Bodyweight"],["freq","Frequency"]].forEach(function (p) {
      html += '<button class="chip' + (mode === p[0] ? " on" : "") + '" type="button" data-chart="' + p[0] + '">' + p[1] + "</button>";
    });
    html += "</div>";
    if (mode === "lift") {
      html += '<select id="chartLift" style="margin-bottom:10px">';
      names.forEach(function (n) {
        html += '<option value="' + esc(n) + '"' + (n === pick ? " selected" : "") + ">" + esc(n) + "</option>";
      });
      html += "</select>" + svg(liftPts(pick));
    } else if (mode === "vol") {
      html += svg(volPts());
    } else if (mode === "freq") {
      html += '<div class="tiny" style="margin-bottom:6px">Sessions per week</div>' + svg(freqPts());
    } else {
      var logs = bw();
      html += '<div class="row" style="margin:8px 0"><input id="bwIn" inputmode="decimal" placeholder="kg" /><button class="btn sm" type="button" id="bwSave">Log</button></div>';
      html += logs.length >= 2 ? svg(logs.map(function (x) { return { ts: x.ts, v: x.kg }; })) : '<div class="tiny">Log bodyweight twice to see a line.</div>';
    }
    box.innerHTML = html;
  }
  document.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-chart]");
    if (chip) { mode = chip.getAttribute("data-chart"); paint(); return; }
    if (e.target.id === "bwSave") {
      var n = Number((document.getElementById("bwIn") || {}).value);
      if (!n) return;
      var logs = bw();
      logs.push({ ts: Date.now(), kg: n });
      save("il_bw", logs);
      paint();
    }
  }, true);
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "chartLift") {
      var box = document.getElementById("chartBox");
      if (box) box.setAttribute("data-lift", e.target.value);
      paint();
    }
  });
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(paint, 50); });
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(paint, 80); });
  else setTimeout(paint, 80);
})();
