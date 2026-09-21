(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function download(name, text, type) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type || "text/plain" }));
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }
  function iso(ts) {
    var d = new Date(ts);
    var z = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) + " " + z(d.getHours()) + ":" + z(d.getMinutes()) + ":" + z(d.getSeconds());
  }
  function csvCell(s) {
    s = String(s == null ? "" : s);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function snapshot() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      unit: "kg",
      workouts: load("il_workouts", []),
      routines: load("il_routines", []),
      prs: load("il_prs", {}),
      cues: load("il_cues", {}),
      custom: load("il_custom", [])
    };
  }
  function strongCsv(workouts) {
    var rows = ["Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE"];
    (workouts || []).forEach(function (w) {
      var dur = w.durationSec ? Math.round(w.durationSec) : "";
      (w.exercises || []).forEach(function (e) {
        var order = 0;
        (e.sets || []).forEach(function (s) {
          if (!s.done && !s.w && !s.r) return;
          order += 1;
          var note = s.wu ? "Warm-up" : "";
          rows.push([
            csvCell(iso(w.ts)),
            csvCell(w.name || "Workout"),
            csvCell(dur),
            csvCell(e.n),
            order,
            csvCell(s.w || ""),
            csvCell(s.r || ""),
            "",
            "",
            csvCell(note),
            "",
            ""
          ].join(","));
        });
      });
    });
    return rows.join("\n");
  }
  function exportPack() {
    var snap = snapshot();
    var day = new Date().toISOString().slice(0, 10);
    download("gym-log-" + day + ".json", JSON.stringify(snap, null, 2), "application/json");
    setTimeout(function () {
      download("gym-log-strong-" + day + ".csv", strongCsv(snap.workouts), "text/csv");
    }, 400);
    save("il_export_ts", Date.now());
    var nag = document.getElementById("backupNag"); if (nag) nag.remove();
  }
  function mergeById(cur, incoming) {
    var map = {};
    (cur || []).forEach(function (x) { if (x && x.id) map[x.id] = x; });
    (incoming || []).forEach(function (x) {
      if (!x) return;
      if (!x.id) x.id = Math.random().toString(36).slice(2, 10);
      if (!map[x.id] || (x.ts && map[x.id].ts && x.ts >= map[x.id].ts) || !map[x.id]) map[x.id] = x;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  }
  function importJson(obj) {
    if (!obj || typeof obj !== "object") throw new Error("Not a Gym Log file");
    var incoming = obj.workouts || obj.sessions || (Array.isArray(obj) ? obj : null);
    if (!incoming) throw new Error("No workouts in file");
    save("il_workouts", mergeById(load("il_workouts", []), incoming));
    if (obj.routines) save("il_routines", mergeById(load("il_routines", []), obj.routines));
    if (obj.prs && typeof obj.prs === "object") save("il_prs", Object.assign({}, load("il_prs", {}), obj.prs));
    if (obj.cues && typeof obj.cues === "object") save("il_cues", Object.assign({}, load("il_cues", {}), obj.cues));
    if (obj.custom) save("il_custom", mergeById(load("il_custom", []), obj.custom));
    save("il_unit", "kg");
  }
  function paintLog() {
    var view = document.getElementById("view-history");
    if (!view || !view.classList.contains("active")) return;
    if (view.querySelector("#backupTools")) return;
    var box = document.createElement("div");
    box.id = "backupTools";
    box.className = "card";
    box.innerHTML = '<div class="tiny">Backup</div><div style="height:10px"></div><button class="btn ghost" type="button" data-act="export-pack">Export pack (JSON + CSV)</button><div style="height:8px"></div><button class="btn ghost" type="button" data-act="import-json">Import JSON</button><input id="importJsonFile" type="file" accept="application/json,.json" style="display:none" />';
    view.insertBefore(box, view.firstChild);
  }
  document.addEventListener("click", function (e) {
    var packBtn = e.target.closest("[data-act='export-pack'], [data-act='export-json']");
    if (packBtn) {
      exportPack();
    }
    if (e.target.closest("[data-act='import-json']")) {
      var input = document.getElementById("importJsonFile");
      if (input) input.click();
    }
  });
  document.addEventListener("change", function (e) {
    if (!e.target || e.target.id !== "importJsonFile") return;
    var file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        importJson(JSON.parse(reader.result));
        alert("Log restored. Reloading.");
        location.reload();
      } catch (err) {
        alert("Could not import that file.");
      }
    };
    reader.readAsText(file);
  });
  var obs = new MutationObserver(function () { paintLog(); });
  setTimeout(function () {
    var n = document.getElementById("view-history");
    if (n) obs.observe(n, { childList: true });
    paintLog();
  }, 700);
})();
