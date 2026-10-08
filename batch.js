(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function favs() { return load("il_fav_ex", []); }
  var css = document.getElementById("batchCss");
  if (!css) { css = document.createElement("style"); css.id = "batchCss"; document.head.appendChild(css); }
  css.textContent = "#gearLocker{display:none!important}#restPick{display:flex;gap:6px;margin:0 0 8px}#restPick button{min-height:32px;padding:0 10px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}#restPick button.on{background:#f4f4f5;color:#111}.tpl-lifts{color:#8d8d92;font-size:12px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}";
  function restBar() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var bar = document.getElementById("restPick");
    if (!bar) { bar = document.createElement("div"); bar.id = "restPick"; view.insertBefore(bar, view.firstChild); }
    var cur = Number(load("il_rest", 60));
    bar.innerHTML = [45, 60, 90, 120].map(function (n) { return "<button type='button' data-rest='" + n + "' class='" + (cur === n ? "on" : "") + "'>" + n + "s</button>"; }).join("");
  }
  function prefill() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var last = {};
    load("il_workouts", []).forEach(function (w) { (w.exercises || []).forEach(function (e) { (e.sets || []).forEach(function (s) { if (s.w) last[e.n] = s; }); }); });
    view.querySelectorAll(".card").forEach(function (card) {
      var name = ((card.querySelector(".ex-name") || {}).textContent || "").trim();
      var prev = last[name]; if (!prev) return;
      var w = card.querySelector("input[inputmode='decimal']");
      var r = card.querySelector("input[inputmode='numeric']");
      if (w && !w.value && !w.placeholder) w.placeholder = prev.w;
      if (r && !r.value && !r.placeholder) r.placeholder = prev.r || "";
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
    var dx = e.clientX - swipe.x, dy = Math.abs(e.clientY - swipe.y), card = swipe.card; swipe = null;
    if (dx > -80 || dy > 40) return;
    var name = ((card.querySelector(".ex-name") || {}).textContent || "").trim();
    var s = load("il_session", null); if (!s) return;
    s.exercises = (s.exercises || []).filter(function (ex) { return ex.n !== name; });
    save("il_session", s); card.remove();
  }, true);
  document.addEventListener("click", function (e) {
    var rest = e.target.closest && e.target.closest("[data-rest]");
    if (rest) { save("il_rest", Number(rest.getAttribute("data-rest"))); restBar(); return; }
    if (e.target.id === "sessEnd") {
      e.preventDefault(); e.stopPropagation();
      if (!confirm("Save this?")) return;
      var s = load("il_session", null);
      if (s && (s.exercises || []).length) {
        var all = load("il_workouts", []);
        all.unshift({ id: "w" + Date.now().toString(36), ts: Date.now(), name: s.name || "Workout", exercises: s.exercises });
        save("il_workouts", all);
      }
      save("il_session", { exercises: [] });
      save("il_clock", {});
    }
  }, true);
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(function () { restBar(); prefill(); }, 90); }); });
  restBar(); prefill();
})();
