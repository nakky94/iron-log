(function () {
  var prOnly = false;
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function workouts() { return load("il_workouts", []); }
  function marks() {
    var best = {}, out = {};
    workouts().slice().sort(function (a, b) { return a.ts - b.ts; }).forEach(function (w) {
      var hit = [];
      (w.exercises || []).forEach(function (e) {
        (e.sets || []).forEach(function (s) {
          var kg = Number(s.w) || 0;
          if (!kg) return;
          if (!best[e.n] || kg > best[e.n]) { best[e.n] = kg; hit.push(e.n.replace(/^Dumbbell\s/i, "") + " " + kg); }
        });
      });
      if (hit.length) out[w.id] = hit;
    });
    return out;
  }
  var css = document.getElementById("logPrCss");
  if (!css) { css = document.createElement("style"); css.id = "logPrCss"; document.head.appendChild(css); }
  css.textContent = ".nav{grid-template-columns:repeat(3,1fr)!important}.nav button[data-view='progress']{display:none!important}.pr-mark{display:inline-block;margin:8px 6px 0 0;padding:4px 8px;border-radius:999px;background:#1c1c1c;border:1px solid #2a2a2e;color:#f4f4f5;font-size:12px;font-weight:650}#histList .h-card.hide-pr{display:none!important}";
  function annotate() {
    var view = document.getElementById("view-history");
    if (!view) return;
    var map = marks();
    var filters = document.getElementById("histFilters");
    if (filters && !filters.querySelector("[data-pr-only]")) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.setAttribute("data-pr-only", "1");
      b.textContent = "PRs";
      filters.appendChild(b);
    }
    if (filters) {
      var chip = filters.querySelector("[data-pr-only]");
      if (chip) chip.classList.toggle("on", prOnly);
    }
    view.querySelectorAll(".h-card").forEach(function (card) {
      var id = card.getAttribute("data-hid");
      var hits = map[id] || [];
      card.classList.toggle("hide-pr", prOnly && !hits.length);
      if (card.querySelector(".pr-mark") || !hits.length) return;
      var row = document.createElement("div");
      hits.forEach(function (h) {
        var s = document.createElement("span");
        s.className = "pr-mark";
        s.textContent = h;
        row.appendChild(s);
      });
      var meta = card.querySelector(".h-meta");
      if (meta) meta.insertAdjacentElement("afterend", row);
      else card.appendChild(row);
    });
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-pr-only]")) { prOnly = !prOnly; annotate(); return; }
    if (e.target.closest(".nav button[data-view='progress']")) {
      e.preventDefault();
      var h = document.querySelector(".nav button[data-view='history']");
      if (h) h.click();
    }
  }, true);
  var hist = document.getElementById("view-history");
  if (hist) new MutationObserver(function () { setTimeout(annotate, 30); }).observe(hist, { childList: true, subtree: true });
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(annotate, 80); }); });
  annotate();
})();
