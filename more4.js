(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  var css = document.getElementById("more4Css");
  if (!css) { css = document.createElement("style"); css.id = "more4Css"; document.head.appendChild(css); }
  css.textContent = [
    ".tpl-handle,.set-fail,.ex-hidebtn,.add-set{min-height:28px;padding:0 8px;border:0;background:transparent;color:#8d8d92;font-size:12px}",
    ".set-fail.on{color:#f4f4f5}",
    "#view-workout .card{touch-action:pan-y}",
    "#view-workout input::placeholder{color:#5c5c60}",
    "#histList .warm{color:#6e6e73}"
  ].join("");
  function lastWeights() {
    var last = {};
    load("il_workouts", []).forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        (e.sets || []).forEach(function (s) { if (s.w && !s.warm) last[e.n] = s.w; });
      });
    });
    return last;
  }
  function paint() {
    var hidden = load("il_hidden_ex", []);
    var last = lastWeights();
    document.querySelectorAll("#view-library .card").forEach(function (card) {
      var n = ((card.querySelector(".ex-name") || {}).textContent || "").trim();
      if (hidden.indexOf(n) >= 0) card.style.display = "none";
      if (card.querySelector(".ex-hidebtn") || card.closest("#gearLocker")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "ex-hidebtn"; b.textContent = "Hide";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var list = load("il_hidden_ex", []);
        list.push(n); save("il_hidden_ex", list); card.style.display = "none";
      });
      card.appendChild(b);
    });
    document.querySelectorAll("#view-workout .card").forEach(function (card) {
      var name = ((card.querySelector(".ex-name") || {}).textContent || "").replace(/ done$/, "").trim();
      card.querySelectorAll("input").forEach(function (inp) {
        if (!inp.value && last[name] && !inp.placeholder) inp.placeholder = String(last[name]);
        if (inp.value && inp.value === String(last[name]) && !inp.dataset.typed) { inp.placeholder = inp.value; inp.value = ""; }
      });
      if (!card.querySelector(".add-set")) {
        var add = document.createElement("button");
        add.type = "button"; add.className = "add-set"; add.textContent = "Add set";
        add.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          var rows = card.querySelectorAll(".pro-row, .set-grid");
          var lastRow = rows[rows.length - 1];
          if (!lastRow) return;
          var copy = lastRow.cloneNode(true);
          copy.querySelectorAll("input").forEach(function (inp, i) {
            var prev = lastRow.querySelectorAll("input")[i];
            inp.value = prev && prev.value ? prev.value : (prev && prev.placeholder || "");
          });
          lastRow.insertAdjacentElement("afterend", copy);
        });
        card.appendChild(add);
      }
      if (!card.querySelector(".train-handle")) {
        var h = document.createElement("button");
        h.type = "button"; h.className = "tpl-handle train-handle"; h.textContent = "\u2630";
        card.insertBefore(h, card.firstChild);
      }
      card.querySelectorAll(".pro-row, .set-grid").forEach(function (row) {
        if (row.querySelector(".set-fail")) return;
        var f = document.createElement("button");
        f.type = "button"; f.className = "set-fail"; f.textContent = "Failed";
        f.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); f.classList.toggle("on"); });
        row.appendChild(f);
      });
    });
    document.querySelectorAll("#histList .h-body .tiny").forEach(function (el) {
      if (/warm/i.test(el.textContent || "")) el.classList.add("warm");
    });
  }
  var drag = null;
  document.addEventListener("pointerdown", function (e) {
    var h = e.target.closest && e.target.closest(".train-handle");
    if (!h) return;
    drag = h.closest(".card"); if (drag) drag.style.opacity = ".45";
  }, true);
  document.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll("#view-workout .card"));
    var over = cards.filter(function (c) { return c !== drag; }).find(function (c) {
      var b = c.getBoundingClientRect(); return e.clientY < b.top + b.height / 2;
    });
    if (over) over.parentNode.insertBefore(drag, over);
  });
  document.addEventListener("pointerup", function () { if (drag) { drag.style.opacity = ""; drag = null; } });
  document.addEventListener("click", function (e) {
    var start = e.target.closest && e.target.closest("[data-hs-tpl], .tpl-last");
    if (!start) return;
    var s = load("il_session", null);
    if (s && (s.exercises || []).length && !confirm("Replace the open Train session?")) {
      e.preventDefault(); e.stopPropagation();
    }
  }, true);
  document.addEventListener("input", function (e) { if (e.target && e.target.tagName === "INPUT") e.target.dataset.typed = "1"; });
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(paint, 150); }); });
  paint();
})();
