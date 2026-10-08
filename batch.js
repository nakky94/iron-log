(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function favs() { return load("il_fav_ex", []); }
  var css = document.getElementById("batchCss");
  if (!css) { css = document.createElement("style"); css.id = "batchCss"; document.head.appendChild(css); }
  css.textContent = [
    "#gearLocker,#view-library .tiny:empty{display:none!important}",
    "#restPick{display:flex;gap:6px;margin:0 0 8px}",
    "#restPick button{min-height:32px;padding:0 10px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}",
    "#restPick button.on{background:#f4f4f5;color:#111}",
    "#view-workout [data-act='toggle-set']{grid-column:auto!important;justify-self:end}",
    "#view-workout .pro-row,[data-hs-tpl] .tpl-lifts{display:block}",
    ".tpl-lifts{color:#8d8d92;font-size:12px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
  ].join("");
  function restBar() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var bar = document.getElementById("restPick");
    if (!bar) { bar = document.createElement("div"); bar.id = "restPick"; view.insertBefore(bar, view.firstChild); }
    var cur = Number(load("il_rest", 60));
    bar.innerHTML = [45, 60, 90, 120].map(function (n) {
      return "<button type='button' data-rest='" + n + "' class='" + (cur === n ? "on" : "") + "'>" + n + "s</button>";
    }).join("");
  }
  function prefill() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var last = {};
    load("il_workouts", []).forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        (e.sets || []).forEach(function (s) { if (s.w) last[e.n] = s; });
      });
    });
    view.querySelectorAll(".card").forEach(function (card) {
      var name = ((card.querySelector(".ex-name") || {}).textContent || "").trim();
      var prev = last[name];
      if (!prev) return;
      var w = card.querySelector("input[data-k='w'], .kg-input, input[inputmode='decimal']");
      var r = card.querySelector("input[data-k='r'], input[inputmode='numeric']");
      if (w && !w.value) w.value = prev.w;
      if (r && !r.value) r.value = prev.r || "";
    });
  }
  function favFilter() {
    var top = document.getElementById("gearTop") || document.getElementById("view-library");
    if (!top || document.getElementById("favOnly")) return;
    var b = document.createElement("button");
    b.id = "favOnly"; b.type = "button"; b.className = "chip"; b.textContent = "Favourites";
    var row = top.querySelector(".chips") || top;
    row.appendChild(b);
  }
  function liftsLine() {
    var map = {};
    load("il_routines", []).forEach(function (r) { map[r.id] = (r.exercises || []).map(function (e) { return e.n; }).join(", "); });
    document.querySelectorAll("[data-hs-tpl]").forEach(function (card) {
      var line = card.querySelector(".tpl-lifts");
      if (!line) { line = document.createElement("div"); line.className = "tpl-lifts"; (card.querySelector(".tpl-body") || card).appendChild(line); }
      line.textContent = map[card.getAttribute("data-hs-tpl")] || "";
    });
  }
  var swipe = null;
  document.addEventListener("pointerdown", function (e) {
    var card = e.target.closest && e.target.closest("#view-workout .card");
    if (!card || e.target.closest("input, button")) return;
    swipe = { card: card, x: e.clientX, y: e.clientY };
  }, true);
  document.addEventListener("pointerup", function (e) {
    if (!swipe) return;
    var dx = e.clientX - swipe.x, dy = Math.abs(e.clientY - swipe.y);
    var card = swipe.card; swipe = null;
    if (dx > -80 || dy > 40) return;
    var name = ((card.querySelector(".ex-name") || {}).textContent || "").trim();
    var s = load("il_session", null);
    if (!s) return;
    s.exercises = (s.exercises || []).filter(function (ex) { return ex.n !== name; });
    save("il_session", s);
    card.remove();
  }, true);
  document.addEventListener("click", function (e) {
    var rest = e.target.closest && e.target.closest("[data-rest]");
    if (rest) { save("il_rest", Number(rest.getAttribute("data-rest"))); restBar(); return; }
    if (e.target.id === "favOnly") {
      var on = e.target.classList.toggle("on");
      var fav = favs();
      document.querySelectorAll("#view-library .card").forEach(function (card) {
        if (card.closest("#gearLocker")) return;
        var n = ((card.querySelector(".ex-name") || {}).textContent || "").trim();
        if (!n || n === "Locker") return;
        card.style.display = on && fav.indexOf(n) < 0 ? "none" : "";
      });
    }
    if (e.target.id === "sessEnd") {
      e.preventDefault(); e.stopPropagation();
      if (!confirm("Finish and save this workout?")) return;
      var s = load("il_session", null);
      if (s && (s.exercises || []).length) {
        var all = load("il_workouts", []);
        all.unshift({ id: "w" + Date.now().toString(36), ts: Date.now(), name: s.name || "Workout", exercises: s.exercises });
        save("il_workouts", all);
      }
      save("il_session", { exercises: [] });
      save("il_clock", {});
      var train = document.querySelector(".nav button[data-view='workout']");
      if (train) train.click();
    }
  }, true);
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(function () { restBar(); prefill(); favFilter(); liftsLine(); }, 90); });
  });
  restBar(); prefill(); favFilter(); liftsLine();
})();
