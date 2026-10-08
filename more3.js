(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function routines() { return load("il_routines", []); }
  var css = document.getElementById("more3Css");
  if (!css) { css = document.createElement("style"); css.id = "more3Css"; document.head.appendChild(css); }
  css.textContent = [
    ".tpl-dup,.set-warm,.set-note,.hist-hide{min-height:28px;padding:0 8px;border:0;background:transparent;color:#8d8d92;font-size:12px}",
    "#view-workout .set-warm.on{color:#f4f4f5}",
    "#view-workout .card.done .pro-row,#view-workout .card.done .set-grid{display:none}",
    "#view-workout .card.done.open .pro-row,#view-workout .card.done.open .set-grid{display:flex}",
    "#view-history .h-card.hidden-log{display:none!important}",
    "#undoSet{min-height:32px;padding:0 10px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}"
  ].join("");
  function paint() {
    document.querySelectorAll("[data-hs-tpl]").forEach(function (card) {
      if (card.querySelector(".tpl-dup")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "tpl-dup"; b.textContent = "Copy";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var id = card.getAttribute("data-hs-tpl");
        var all = routines();
        var src = all.filter(function (r) { return r.id === id; })[0];
        if (!src) return;
        var copy = JSON.parse(JSON.stringify(src));
        copy.id = "tpl" + Date.now().toString(36);
        copy.name = src.name + " copy";
        all.push(copy);
        save("il_routines", all);
        if (window.gymPaintHome) window.gymPaintHome();
      });
      card.appendChild(b);
    });
    var edit = document.getElementById("tplEdit");
    if (edit && edit.classList.contains("on") && !edit.querySelector("#tplTarget")) {
      var id = edit.dataset.id;
      var r = routines().filter(function (x) { return x.id === id; })[0];
      var input = document.createElement("input");
      input.id = "tplTarget"; input.inputMode = "numeric"; input.placeholder = "Target reps"; input.value = r && r.targetReps || "";
      input.style.margin = "8px 0";
      var name = edit.querySelector("#tplName");
      if (name) name.insertAdjacentElement("afterend", input);
      input.addEventListener("change", function () {
        var all = routines();
        var cur = all.filter(function (x) { return x.id === id; })[0];
        if (cur) { cur.targetReps = input.value; save("il_routines", all); }
      });
    }
    document.querySelectorAll("#view-workout .pro-row, #view-workout .set-grid").forEach(function (row) {
      if (row.querySelector(".set-warm")) return;
      var warm = document.createElement("button");
      warm.type = "button"; warm.className = "set-warm"; warm.textContent = "Warm-up";
      warm.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); warm.classList.toggle("on"); });
      var note = document.createElement("button");
      note.type = "button"; note.className = "set-note"; note.textContent = "Note";
      note.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var text = prompt("Set note", note.dataset.note || "");
        if (text == null) return;
        note.dataset.note = text;
        note.textContent = text || "Note";
      });
      row.appendChild(warm); row.appendChild(note);
    });
    document.querySelectorAll("#view-workout .card.done .ex-name").forEach(function (el) {
      if (el.dataset.collapse) return;
      el.dataset.collapse = "1";
      el.addEventListener("click", function () { el.closest(".card").classList.toggle("open"); });
    });
    var timer = document.getElementById("sessionTimer");
    if (timer && timer.classList.contains("on") && !timer.querySelector("#undoSet")) {
      var u = document.createElement("button");
      u.id = "undoSet"; u.type = "button"; u.textContent = "Undo";
      timer.appendChild(u);
    }
    var hidden = load("il_hidden_logs", []);
    document.querySelectorAll("#histList .h-card").forEach(function (card) {
      card.classList.toggle("hidden-log", hidden.indexOf(card.getAttribute("data-hid")) >= 0);
      if (card.querySelector(".hist-hide")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "hist-hide"; b.textContent = "Hide";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var list = load("il_hidden_logs", []);
        list.push(card.getAttribute("data-hid"));
        save("il_hidden_logs", list);
        card.classList.add("hidden-log");
      });
      card.appendChild(b);
    });
    var muscle = sessionStorage.getItem("il_muscle");
    if (muscle) {
      var chip = Array.prototype.find.call(document.querySelectorAll("#gearTop .chip"), function (c) { return c.textContent.trim() === muscle; });
      if (chip && !chip.classList.contains("on")) chip.click();
    }
    var target = load("il_active_target", "");
    if (target) document.querySelectorAll("#view-workout input[inputmode='numeric']").forEach(function (inp) { if (!inp.value) inp.value = target; });
  }
  document.addEventListener("click", function (e) {
    var chip = e.target.closest && e.target.closest("#gearTop .chip");
    if (chip) sessionStorage.setItem("il_muscle", chip.textContent.trim());
    if (e.target.id === "undoSet") {
      e.preventDefault(); e.stopPropagation();
      var ticks = document.querySelectorAll("#view-workout [data-act='toggle-set']");
      for (var i = ticks.length - 1; i >= 0; i--) {
        if (ticks[i].classList.contains("on") || ticks[i].textContent === "\u2713") { ticks[i].click(); break; }
      }
    }
    if (e.target.classList && e.target.classList.contains("tpl-last")) {
      var id = e.target.closest("[data-hs-tpl]").getAttribute("data-hs-tpl");
      var r = routines().filter(function (x) { return x.id === id; })[0];
      if (r && r.targetReps) save("il_active_target", r.targetReps);
    }
  }, true);
  document.querySelectorAll(".nav button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(paint, 140); }); });
  paint();
})();
