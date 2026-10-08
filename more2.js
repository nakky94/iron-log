(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function renames() { return load("il_renames", {}); }
  var css = document.getElementById("more2Css");
  if (!css) { css = document.createElement("style"); css.id = "more2Css"; document.head.appendChild(css); }
  css.textContent = [
    ".tpl-last,.ex-replace,.ex-rename{min-height:28px;padding:0 8px;border:0;background:transparent;color:#8d8d92;font-size:12px;font-weight:650}",
    "#view-workout .card.done{border-color:#3a3a3e}",
    "#view-workout .card.done .ex-name::after{content:'  done';color:#8d8d92;font-size:12px;font-weight:600}",
    "#unitBtn{display:block!important;margin-left:auto;min-height:32px;padding:0 10px;border-radius:999px;border:1px solid #2a2a2e;background:#1c1c1c;color:#f4f4f5}"
  ].join("");
  function applyRenames(root) {
    var map = renames();
    (root || document).querySelectorAll(".ex-name").forEach(function (el) {
      var n = (el.textContent || "").trim();
      if (map[n]) el.textContent = map[n];
    });
  }
  function lastOf(name) {
    var ws = load("il_workouts", []);
    return ws.filter(function (w) { return w.name === name || (w.exercises || []).some(function (e) { return e.n === name; }); })[0];
  }
  function buttons() {
    document.querySelectorAll("[data-hs-tpl]").forEach(function (card) {
      if (card.querySelector(".tpl-last")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "tpl-last"; b.textContent = "Last";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var title = ((card.querySelector(".ex-name") || card).textContent || "").trim();
        var prev = lastOf(title);
        if (!prev) { alert("No saved session for this template."); return; }
        save("il_session", { name: title, exercises: JSON.parse(JSON.stringify(prev.exercises || [])) });
        var train = document.querySelector(".nav button[data-view='workout']");
        if (train) train.click();
      });
      card.appendChild(b);
    });
    document.querySelectorAll("#view-workout .card").forEach(function (card) {
      if (!card.querySelector(".ex-replace")) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "ex-replace"; b.textContent = "Replace";
        b.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          var name = ((card.querySelector(".ex-name") || {}).textContent || "").replace(/ done$/, "").trim();
          var next = prompt("Replace with", name);
          if (!next) return;
          var s = load("il_session", null);
          if (!s) return;
          (s.exercises || []).forEach(function (ex) { if (ex.n === name) ex.n = next; });
          save("il_session", s);
          var el = card.querySelector(".ex-name"); if (el) el.textContent = next;
        });
        card.appendChild(b);
      }
      var sets = card.querySelectorAll("[data-act='toggle-set']");
      var done = sets.length && Array.prototype.every.call(sets, function (b) { return b.classList.contains("on") || b.textContent === "\u2713"; });
      card.classList.toggle("done", !!done);
    });
    document.querySelectorAll("#view-library .card").forEach(function (card) {
      if (card.closest("#gearLocker") || card.querySelector(".ex-rename")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "ex-rename"; b.textContent = "Rename";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var el = card.querySelector(".ex-name");
        var old = (el && el.textContent || "").trim();
        var next = prompt("Rename exercise", old);
        if (!next || next === old) return;
        var map = renames(); map[old] = next; save("il_renames", map);
        el.textContent = next;
      });
      card.appendChild(b);
    });
    var unit = document.getElementById("unitBtn");
    if (unit) {
      unit.hidden = false;
      unit.textContent = load("il_unit", "kg");
      if (!unit.dataset.bound) {
        unit.dataset.bound = "1";
        unit.addEventListener("click", function () {
          var next = load("il_unit", "kg") === "kg" ? "lb" : "kg";
          save("il_unit", next);
          unit.textContent = next;
        });
      }
    }
    applyRenames(document);
  }
  var hold = null;
  document.addEventListener("pointerdown", function (e) {
    var row = e.target.closest && e.target.closest("#view-workout .pro-row, #view-workout .set-grid");
    if (!row) return;
    hold = setTimeout(function () {
      var inputs = row.querySelectorAll("input");
      var next = row.nextElementSibling;
      if (!next) return;
      var outs = next.querySelectorAll("input");
      inputs.forEach(function (inp, i) { if (outs[i] && !outs[i].value) outs[i].value = inp.value; });
    }, 450);
  }, true);
  document.addEventListener("pointerup", function () { clearTimeout(hold); });
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () {
      var train = document.getElementById("view-workout");
      if (b.getAttribute("data-view") !== "workout" && train) sessionStorage.setItem("il_train_scroll", String(train.scrollTop || window.scrollY));
      setTimeout(function () {
        buttons();
        if (b.getAttribute("data-view") === "workout") window.scrollTo(0, Number(sessionStorage.getItem("il_train_scroll") || 0));
        if (b.getAttribute("data-view") === "history") {
          var id = sessionStorage.getItem("il_open_hist");
          var card = id && document.querySelector('[data-hid="' + id + '"]');
          if (card) card.click();
        }
      }, 120);
    });
  });
  var oldEnd = null;
  document.addEventListener("click", function (e) {
    if (e.target.id !== "sessEnd") return;
    setTimeout(function () {
      var ws = load("il_workouts", []);
      if (ws[0]) sessionStorage.setItem("il_open_hist", ws[0].id);
    }, 40);
  }, true);
  buttons();
})();
