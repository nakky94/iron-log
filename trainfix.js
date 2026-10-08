(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function session() { return load("il_session", null); }
  function css() {
    var s = document.getElementById("trainFix");
    if (!s) { s = document.createElement("style"); s.id = "trainFix"; document.head.appendChild(s); }
    s.textContent = [
      "#sessStrip span:first-child{display:none!important}",
      "#view-workout [data-act='toggle-set']:not(.ghost){background:#f4f4f5!important;color:#111!important;border-color:#f4f4f5!important}",
      "#view-workout .set-grid{display:grid;grid-template-columns:28px minmax(0,1fr) 44px;grid-template-rows:auto auto;gap:6px;align-items:center}",
      "#view-workout .set-grid > div:first-child{grid-row:1 / span 2}",
      "#view-workout .kg-step{grid-column:2;grid-row:1;display:flex;gap:4px}",
      "#view-workout [data-act='set-r']{grid-column:2;grid-row:2}",
      "#view-workout [data-act='toggle-set']{grid-column:3;grid-row:1 / span 2;width:44px;height:44px}",
      "#view-workout .kg-step button{width:44px;height:40px;border-radius:10px;background:#1c1c1c;border:1px solid #2a2a2e;font-weight:800}",
      ".set-row-done{opacity:.55;max-height:none!important;overflow:visible!important}",
      ".wu-chip{margin-top:6px;min-height:32px}",
      ".wu-chip.on{color:#f4f4f5;border-color:#2a2a2e}",
      ".move-acts{display:flex;gap:8px;margin-top:10px}",
      ".move-acts button{flex:1;min-height:40px;border-radius:12px;background:#1c1c1c;border:1px solid #2a2a2e;font-weight:700}",
      "#view-workout.empty-train #restBar,#view-workout.empty-train #continueBox,#view-workout.empty-train .rir-row{display:none!important}",
      "#restBar .rest-num{display:none!important}"
    ].join("");
  }
  function working(ex) {
    var sets = (ex && ex.sets) || [];
    for (var i = sets.length - 1; i >= 0; i--) if (!sets[i].wu && (sets[i].w || sets[i].r)) return sets[i];
    return null;
  }
  function renumber(card, i) {
    card.querySelectorAll("[data-i]").forEach(function (el) { el.setAttribute("data-i", String(i)); });
    card.querySelectorAll(".set-grid").forEach(function (row, si) {
      var num = row.querySelector("div");
      if (num && !num.querySelector("input")) num.textContent = String(si + 1);
      row.querySelectorAll("[data-si]").forEach(function (el) { el.setAttribute("data-si", String(si)); });
    });
  }
  function controls() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    css();
    var cards = view.querySelectorAll(".card");
    view.classList.toggle("empty-train", view.querySelectorAll(".set-grid").length === 0);
    cards.forEach(function (card, i) {
      if (card.id === "emptyTrain" || card.id === "restBar") return;
      if (!card.querySelector(".move-acts") && card.querySelector(".set-grid")) {
        var row = document.createElement("div");
        row.className = "move-acts";
        row.innerHTML = '<button type="button" data-move="up">Up</button><button type="button" data-move="down">Down</button><button type="button" data-remove-lift>Remove</button>';
        card.appendChild(row);
      }
      card.querySelectorAll(".set-grid").forEach(function (grid) {
        if (grid.querySelector(".wu-chip")) return;
        var wIn = grid.querySelector("[data-act='set-w']");
        if (!wIn) return;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chip wu-chip";
        b.textContent = "Warm-up";
        b.setAttribute("data-wu", wIn.getAttribute("data-i") + ":" + wIn.getAttribute("data-si"));
        grid.appendChild(b);
      });
      renumber(card, i);
    });
  }
  function move(card, dir) {
    var s = session();
    if (!s) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll("#view-workout .card")).filter(function (c) { return c.querySelector(".set-grid"); });
    var i = cards.indexOf(card);
    var j = i + dir;
    if (i < 0 || j < 0 || j >= cards.length) return;
    var ex = s.exercises.splice(i, 1)[0];
    s.exercises.splice(j, 0, ex);
    save("il_session", s);
    if (dir < 0) card.parentNode.insertBefore(card, cards[j]);
    else card.parentNode.insertBefore(cards[j], card);
    cards = Array.prototype.slice.call(document.querySelectorAll("#view-workout .card")).filter(function (c) { return c.querySelector(".set-grid"); });
    cards.forEach(renumber);
  }
  function removeLift(card) {
    var s = session();
    if (!s) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll("#view-workout .card")).filter(function (c) { return c.querySelector(".set-grid"); });
    var i = cards.indexOf(card);
    var name = (card.querySelector(".ex-name") || {}).textContent || "this lift";
    if (!confirm("Remove " + name.trim() + "?")) return;
    s.exercises.splice(i, 1);
    save("il_session", s);
    card.remove();
  }
  function deleteSet(btn) {
    var i = Number(btn.getAttribute("data-i"));
    var si = Number(btn.getAttribute("data-si"));
    var s = session();
    if (!s || !s.exercises[i]) return;
    var sets = s.exercises[i].sets || [];
    if (!confirm("Delete set " + (si + 1) + "?")) return;
    if (sets.length <= 1) sets[0] = { w: "", r: "", done: false };
    else sets.splice(si, 1);
    save("il_session", s);
    var row = btn.closest(".set-grid");
    if (row && sets.length > 1) row.remove();
    var card = btn.closest(".card");
    if (card) renumber(card, i);
  }
  document.addEventListener("pointerdown", function (e) {
    var del = e.target.closest("[data-act='del-set']");
    if (!del) return;
    e.preventDefault();
    e.stopPropagation();
    deleteSet(del);
  }, true);
  document.addEventListener("click", function (e) {
    var wu = e.target.closest("[data-wu]");
    if (wu) {
      var p = wu.getAttribute("data-wu").split(":");
      var s = session();
      if (s && s.exercises[p[0]] && s.exercises[p[0]].sets[p[1]]) {
        var set = s.exercises[p[0]].sets[p[1]];
        set.wu = !set.wu;
        save("il_session", s);
        wu.classList.toggle("on", !!set.wu);
      }
      return;
    }
    var mv = e.target.closest("[data-move]");
    if (mv) { move(mv.closest(".card"), mv.getAttribute("data-move") === "up" ? -1 : 1); return; }
    if (e.target.closest("[data-remove-lift]")) { removeLift(e.target.closest(".card")); return; }
    if (e.target.id === "restPlus" && window.gymRestAdd) { e.stopPropagation(); window.gymRestAdd(15); return; }
    var add = e.target.closest("[data-act='add-set']");
    if (add) setTimeout(function () {
      var s = session();
      var i = Number(add.getAttribute("data-i"));
      if (!s || !s.exercises[i]) return;
      var prev = working(s.exercises[i]);
      var sets = s.exercises[i].sets;
      if (sets.length > 3 && !sets[sets.length - 1].w) sets.pop();
      var last = sets[sets.length - 1];
      if (last && prev && !last.w) { last.w = prev.w; last.r = prev.r; save("il_session", s); }
    }, 60);
  }, true);
  css();
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(controls, 120); });
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", controls);
  else controls();
})();
