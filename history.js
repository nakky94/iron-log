(function () {
  var range = "all";
  var openId = null;
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
  function stats(w) {
    var sets = 0, vol = 0;
    (w.exercises || []).forEach(function (e) {
      (e.sets || []).forEach(function (s) {
        if (!s.done && !s.w) return;
        sets += 1;
        vol += (Number(s.w) || 0) * (Number(s.r) || 0);
      });
    });
    return { sets: sets, vol: Math.round(vol), moves: (w.exercises || []).length };
  }
  function fmtVol(n) {
    if (!n) return "0 kg";
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k kg";
    return n + " kg";
  }
  function monthKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }
  function monthLabel(key) {
    var p = key.split("-"), d = new Date(Number(p[0]), Number(p[1]) - 1, 1);
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  function cutoff() {
    if (range === "7") return Date.now() - 7 * 864e5;
    if (range === "30") return Date.now() - 30 * 864e5;
    if (range === "90") return Date.now() - 90 * 864e5;
    return 0;
  }
  function css() {
    var s = document.getElementById("histStyle");
    if (!s) { s = document.createElement("style"); s.id = "histStyle"; document.head.appendChild(s); }
    s.textContent =
      "#view-history > .card:not(#backupTools),#view-history > .row.space{display:none!important}" +
      "#histList .m-lab{font-size:11px;color:#8d8d8d;text-transform:uppercase;letter-spacing:.08em;margin:14px 0 8px}" +
      "#histList .h-card{cursor:pointer}" +
      "#histList .h-meta{display:flex;gap:12px;margin-top:8px;color:#8d8d8d;font-size:12px}" +
      "#histList .h-body{margin-top:10px;border-top:1px solid #222;padding-top:10px}" +
      "#histFilters{display:flex;gap:6px;overflow-x:auto;margin:0 0 10px}" +
      "#view-history [data-act='import-seed']{display:none!important}";
  }
  function detailHtml(w) {
    var html = "";
    (w.exercises || []).forEach(function (e) {
      var ev = 0;
      (e.sets || []).forEach(function (s) { ev += (Number(s.w) || 0) * (Number(s.r) || 0); });
      html += '<div style="margin-top:10px"><div class="row space"><div class="ex-name" style="font-size:15px">' + esc(shortName(e.n)) + '</div><div class="tiny">' + fmtVol(Math.round(ev)) + "</div></div>";
      (e.sets || []).forEach(function (s, i) {
        if (!s.done && !s.w && !s.r) return;
        html += '<div class="row space" style="margin-top:4px"><div class="tiny">Set ' + (i + 1) + '</div><div>' + (s.w || "\u2014") + " kg \u00d7 " + (s.r || "\u2014") + "</div></div>";
      });
      html += "</div>";
    });
    html += '<button class="btn ghost warn" type="button" data-act="del-work" data-id="' + esc(w.id) + '" style="margin-top:12px">Delete session</button>';
    return html;
  }
  function paint() {
    var view = document.getElementById("view-history");
    if (!view || !view.classList.contains("active")) return;
    css();
    var filters = view.querySelector("#histFilters");
    if (!filters) {
      filters = document.createElement("div");
      filters.id = "histFilters";
      var cal = view.querySelector("#weekCal");
      if (cal) cal.insertAdjacentElement("afterend", filters);
      else view.insertBefore(filters, view.firstChild);
    }
    filters.innerHTML = [["7","7 days"],["30","30 days"],["90","3 months"],["all","All time"]].map(function (p) {
      return '<button class="chip' + (range === p[0] ? " on" : "") + '" type="button" data-hist-range="' + p[0] + '">' + p[1] + "</button>";
    }).join("");
    var list = view.querySelector("#histList");
    if (!list) {
      list = document.createElement("div");
      list.id = "histList";
      filters.insertAdjacentElement("afterend", list);
    }
    var from = cutoff();
    var ws = workouts().filter(function (w) { return w.ts >= from; });
    if (!ws.length) {
      list.innerHTML = '<div class="card empty">No sessions in this range.</div>';
      return;
    }
    var groups = {};
    ws.forEach(function (w) {
      var k = monthKey(w.ts);
      if (!groups[k]) groups[k] = [];
      groups[k].push(w);
    });
    var keys = Object.keys(groups).sort().reverse();
    var html = "";
    keys.forEach(function (k) {
      html += '<div class="m-lab">' + esc(monthLabel(k)) + "</div>";
      groups[k].forEach(function (w) {
        var st = stats(w);
        var when = new Date(w.ts).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
        var open = openId === w.id;
        html += '<div class="card h-card' + (open ? " open" : "") + '" data-hid="' + esc(w.id) + '">' +
          '<div class="row space"><div class="ex-name">' + esc(w.name || "Workout") + '</div><div class="tiny">' + esc(when) + "</div></div>" +
          '<div class="h-meta"><span>' + st.moves + " moves</span><span>" + st.sets + " sets</span><span>" + fmtVol(st.vol) + "</span></div>" +
          (open ? '<div class="h-body">' + detailHtml(w) + "</div>" : "") +
          "</div>";
      });
    });
    list.innerHTML = html;
  }
  document.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-hist-range]");
    if (chip) {
      range = chip.getAttribute("data-hist-range");
      paint();
      return;
    }
    var card = e.target.closest("#histList .h-card");
    if (card && !e.target.closest("[data-act]")) {
      var id = card.getAttribute("data-hid");
      openId = openId === id ? null : id;
      paint();
    }
    if (e.target.closest("[data-act='del-work']")) setTimeout(paint, 200);
  }, true);
  var t = null;
  function boot() {
    var n = document.getElementById("view-history");
    if (n) new MutationObserver(function () {
      if (t) return;
      t = setTimeout(function () { t = null; paint(); }, 80);
    }).observe(n, { childList: true });
    document.querySelectorAll(".nav button").forEach(function (b) {
      b.addEventListener("click", function () { setTimeout(paint, 40); });
    });
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
