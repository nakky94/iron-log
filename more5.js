(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function routines() { return load("il_routines", []); }
  var css = document.getElementById("more5Css");
  if (!css) { css = document.createElement("style"); css.id = "more5Css"; document.head.appendChild(css); }
  css.textContent = [
    ".tpl-deload,.set-partial,.step-size,.hist-repeat,#showHidden{min-height:28px;padding:0 8px;border:0;background:transparent;color:#8d8d92;font-size:12px}",
    ".tpl-deload.on{color:#f4f4f5}",
    "#histList .easy{color:#6e6e73}",
    "#sessionTimer b{cursor:pointer}"
  ].join("");
  function paint() {
    document.querySelectorAll("[data-hs-tpl]").forEach(function (card) {
      if (card.querySelector(".tpl-deload")) return;
      var id = card.getAttribute("data-hs-tpl");
      var r = routines().filter(function (x) { return x.id === id; })[0];
      var b = document.createElement("button");
      b.type = "button"; b.className = "tpl-deload" + (r && r.deload ? " on" : ""); b.textContent = "Deload";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var all = routines();
        var cur = all.filter(function (x) { return x.id === id; })[0];
        if (!cur) return;
        cur.deload = !cur.deload; save("il_routines", all); b.classList.toggle("on", cur.deload);
      });
      card.appendChild(b);
    });
    document.querySelectorAll("#view-workout .card").forEach(function (card) {
      var name = ((card.querySelector(".ex-name") || {}).textContent || "").trim();
      if (!card.querySelector(".step-size")) {
        var step = document.createElement("button");
        step.type = "button"; step.className = "step-size";
        var steps = load("il_steps", {});
        step.textContent = (steps[name] || 2.5) + " kg";
        step.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          var map = load("il_steps", {});
          map[name] = map[name] === 1 ? 2.5 : 1;
          save("il_steps", map); step.textContent = map[name] + " kg";
        });
        card.appendChild(step);
      }
      card.querySelectorAll(".pro-row, .set-grid").forEach(function (row) {
        if (row.querySelector(".set-partial")) return;
        var p = document.createElement("button");
        p.type = "button"; p.className = "set-partial"; p.textContent = "Partial";
        p.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          var got = prompt("Reps you got");
          if (got == null) return;
          var rep = row.querySelector("input[inputmode='numeric']");
          if (rep) rep.value = got;
          p.textContent = "Partial " + got;
        });
        row.appendChild(p);
      });
    });
    var gear = document.getElementById("gearTop") || document.getElementById("view-library");
    if (gear && !document.getElementById("showHidden")) {
      var b = document.createElement("button");
      b.id = "showHidden"; b.type = "button"; b.textContent = "Show hidden";
      gear.appendChild(b);
    }
    document.querySelectorAll("#histList .h-card").forEach(function (card) {
      if (card.querySelector(".hist-repeat")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "hist-repeat"; b.textContent = "Repeat";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var id = card.getAttribute("data-hid");
        var w = load("il_workouts", []).filter(function (x) { return x.id === id; })[0];
        if (!w) return;
        save("il_session", { name: w.name, exercises: JSON.parse(JSON.stringify(w.exercises || [])) });
        var train = document.querySelector(".nav button[data-view='workout']");
        if (train) train.click();
      });
      card.appendChild(b);
      if (/deload/i.test(card.textContent || "")) card.classList.add("easy");
    });
    var started = load("il_clock", {}).userStarted;
    if (started && navigator.wakeLock && !window.__ilLock) {
      navigator.wakeLock.request("screen").then(function (lock) { window.__ilLock = lock; }).catch(function () {});
    }
    if (!started && window.__ilLock) { window.__ilLock.release(); window.__ilLock = null; }
  }
  document.addEventListener("click", function (e) {
    if (e.target.id === "sessionTimer" || (e.target.closest && e.target.closest("#sessionTimer b"))) {
      var skip = document.getElementById("restSkip");
      if (skip) skip.click();
    }
    if (e.target.id === "showHidden") {
      save("il_hidden_ex", []);
      document.querySelectorAll("#view-library .card").forEach(function (c) { c.style.display = ""; });
    }
    var edit = e.target.closest && e.target.closest("#histList input");
    if (edit && !edit.dataset.asked) {
      if (!confirm("Overwrite the saved number?")) { e.preventDefault(); e.target.blur(); return; }
      edit.dataset.asked = "1";
    }
    var tick = e.target.closest && e.target.closest("[data-act='toggle-set']");
    if (tick) setTimeout(function () {
      var card = tick.closest(".card");
      var sets = card && card.querySelectorAll("[data-act='toggle-set']");
      var done = sets && sets.length && Array.prototype.every.call(sets, function (b) { return b.classList.contains("on") || b.textContent === "\u2713"; });
      if (!done) return;
      var next = card.nextElementSibling;
      if (next && next.scrollIntoView) next.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, true);
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(paint, 150); }); });
  paint();
})();
