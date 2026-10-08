(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  var css = document.getElementById("more7Css");
  if (!css) { css = document.createElement("style"); css.id = "more7Css"; document.head.appendChild(css); }
  css.textContent = "#liftsLeft{color:#8d8d92;font-size:13px;margin:0 0 8px}#gearTop .chips{flex-wrap:wrap!important;overflow:visible!important}";
  function left() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    var cards = view.querySelectorAll(".card");
    var done = view.querySelectorAll(".card.done").length;
    var el = document.getElementById("liftsLeft");
    if (!el) { el = document.createElement("div"); el.id = "liftsLeft"; view.insertBefore(el, view.firstChild); }
    var n = Math.max(0, cards.length - done);
    el.textContent = n + (n === 1 ? " lift left" : " lifts left");
  }
  function convert(to) {
    var factor = to === "lb" ? 2.20462 : 1 / 2.20462;
    document.querySelectorAll("#view-workout input").forEach(function (inp) {
      if (inp.inputMode !== "decimal" && !/kg|weight/i.test(inp.className + inp.name)) return;
      var n = Number(inp.value || inp.placeholder);
      if (!n) return;
      var next = Math.round(n * factor * 10) / 10;
      if (inp.value) inp.value = String(next);
      else inp.placeholder = String(next);
    });
  }
  document.addEventListener("click", function (e) {
    if (e.target.id === "unitBtn") {
      var next = load("il_unit", "kg") === "kg" ? "lb" : "kg";
      setTimeout(function () { convert(load("il_unit", next)); }, 20);
    }
    if (e.target.classList && e.target.classList.contains("ex-replace")) {
      var card = e.target.closest(".card");
      var old = ((card.querySelector(".ex-name") || {}).textContent || "").trim();
      setTimeout(function () {
        var note = card.querySelector(".set-note");
        if (note && old) note.textContent = "was " + old;
      }, 40);
    }
  }, true);
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(left, 160); }); });
  left();
})();
