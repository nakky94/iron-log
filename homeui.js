(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function workouts() { return load("il_workouts", []); }
  function fmtDay(ts) {
    return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
  function lastForTemplate(name, lifts) {
    var set = {};
    (lifts || []).forEach(function (n) { set[n] = true; });
    var hits = workouts().filter(function (w) {
      if ((w.name || "").toLowerCase() === String(name).toLowerCase()) return true;
      return (w.exercises || []).some(function (e) { return set[e.n]; });
    });
    if (!hits.length) return "";
    var w = hits[0];
    var top = "";
    (w.exercises || []).some(function (e) {
      var best = 0;
      (e.sets || []).forEach(function (s) { if (s.done && Number(s.w) > best) best = Number(s.w); });
      if (best) { top = best + " kg " + e.n.replace(/^Dumbbell\s/, ""); return true; }
      return false;
    });
    return "last " + fmtDay(w.ts) + (top ? " · " + top : "");
  }
  function polishHome() {
    var view = document.getElementById("view-home");
    if (!view || !view.classList.contains("active")) return;
    var unit = document.getElementById("unitBtn");
    if (unit) unit.textContent = "kg";
    var date = document.getElementById("dateLabel");
    if (date) date.textContent = new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

    var empty = view.querySelector("[data-act='start-fresh']");
    if (empty) { empty.textContent = "New session"; empty.className = "btn ghost"; }
    var repeat = view.querySelector("[data-act='repeat-last']");
    if (repeat) {
      var last = workouts()[0];
      repeat.className = "btn";
      if (last) repeat.textContent = "Repeat " + fmtDay(last.ts);
    }

    Array.prototype.slice.call(view.querySelectorAll("button, .tiny, div")).forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (t === "Quick add from gear" || t === "Browse dumbbells and machines") el.style.display = "none";
    });

    var vol = view.querySelector("#volWeek");
    if (vol && /No sets logged this week/i.test(vol.textContent)) vol.style.display = "none";

    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      var inst = document.getElementById("homeInstall");
      if (inst) inst.remove();
    }

    var editOn = !!load("il_tpl_edit", false);
    Array.prototype.slice.call(view.querySelectorAll(".tiny")).forEach(function (lab) {
      if ((lab.textContent || "").trim() !== "Templates") return;
      if (lab.parentElement && lab.parentElement.classList.contains("sec-head")) return;
      var head = document.createElement("div");
      head.className = "row space sec-head";
      head.style.margin = "8px 0";
      head.innerHTML = '<div class="tiny">Templates</div><button class="text-link" type="button" data-act="toggle-tpl-edit">' + (editOn ? "Done" : "Edit") + "</button>";
      lab.replaceWith(head);
    });

    Array.prototype.slice.call(view.querySelectorAll("[data-act='load-routine']")).forEach(function (btn) {
      var card = btn.closest(".card"); if (!card || card.getAttribute("data-homeui")) return;
      card.setAttribute("data-homeui", "1");
      var del = card.querySelector("[data-act='del-routine']");
      btn.style.display = "none";
      if (del) del.style.display = editOn ? "" : "none";
      card.style.cursor = "pointer";
      var nameEl = card.querySelector(".ex-name");
      var name = nameEl ? nameEl.textContent : "";
      var routines = load("il_routines", []);
      var match = routines.filter(function (r) { return r.name === name; })[0];
      var liftNames = match ? (match.exercises || []).map(function (e) { return e.n; }) : [];
      var extra = lastForTemplate(name, liftNames);
      var meta = card.querySelector(".tiny");
      if (extra && meta && !meta.getAttribute("data-last")) {
        meta.setAttribute("data-last", "1");
        meta.textContent = extra;
      }
      card.addEventListener("click", function (ev) {
        if (ev.target.closest("[data-act='del-routine'], [data-act='toggle-tpl-edit']")) return;
        btn.click();
      });
    });
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-act='toggle-tpl-edit']")) return;
    try {
      var cur = !!JSON.parse(localStorage.getItem("il_tpl_edit") || "false");
      localStorage.setItem("il_tpl_edit", JSON.stringify(!cur));
    } catch (err) { localStorage.setItem("il_tpl_edit", "true"); }
    document.querySelector('.nav button[data-view="home"]').click();
  });
  var obs = new MutationObserver(function () { polishHome(); });
  setTimeout(function () {
    var n = document.getElementById("view-home");
    if (n) obs.observe(n, { childList: true, subtree: true });
    polishHome();
  }, 800);
})();
