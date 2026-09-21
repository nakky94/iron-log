(function () {
  function loadSess() {
    try { return JSON.parse(localStorage.getItem("il_session") || "null"); } catch (e) { return null; }
  }
  function saveSess(s) { localStorage.setItem("il_session", JSON.stringify(s)); }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function persistField(t) {
    var act = t.getAttribute("data-act");
    if (act !== "set-w" && act !== "set-r") return;
    var s = loadSess();
    var i = Number(t.getAttribute("data-i"));
    var si = Number(t.getAttribute("data-si"));
    if (!s || !s.exercises || !s.exercises[i] || !s.exercises[i].sets[si]) return;
    if (act === "set-w") s.exercises[i].sets[si].w = t.value;
    else s.exercises[i].sets[si].r = t.value;
    saveSess(s);
  }
  function prettyMeta() {
    var view = document.getElementById("view-workout");
    if (!view) return;
    Array.prototype.slice.call(view.querySelectorAll(".card .tiny")).forEach(function (el) {
      var t = el.textContent || "";
      if (!/dumbbell|machine/i.test(t)) return;
      el.textContent = t.replace(/dumbbell/ig, "Dumbbell").replace(/machine/ig, "Machine");
    });
  }
  function enhance() {
    var view = document.getElementById("view-workout");
    if (!view || !view.classList.contains("active")) return;
    prettyMeta();
    Array.prototype.slice.call(view.querySelectorAll(".set-grid")).forEach(function (row) {
      if (row.classList.contains("tiny")) {
        if (row.children.length === 4 && !row.querySelector("[data-col='del']")) {
          var h = document.createElement("div");
          h.setAttribute("data-col", "del");
          row.appendChild(h);
        }
        return;
      }
      if (row.querySelector("[data-act='del-set']")) return;
      var w = row.querySelector("[data-act='set-w']");
      if (!w) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn icon ghost";
      b.setAttribute("data-act", "del-set");
      b.setAttribute("data-i", w.getAttribute("data-i"));
      b.setAttribute("data-si", w.getAttribute("data-si"));
      b.setAttribute("aria-label", "Delete set");
      b.style.color = "var(--warn)";
      b.textContent = "\u2013";
      row.appendChild(b);
    });
  }
  function redraw() {
    var btn = document.querySelector('.nav button[data-view="workout"]');
    if (btn) btn.click();
    setTimeout(enhance, 0);
  }
  document.addEventListener("input", function (e) {
    var t = e.target.closest("[data-act='set-w'], [data-act='set-r']");
    if (t) persistField(t);
  });
  document.addEventListener("change", function (e) {
    var t = e.target.closest("[data-act='set-w'], [data-act='set-r']");
    if (t) persistField(t);
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act='del-set']");
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    var s = loadSess();
    var i = Number(t.getAttribute("data-i"));
    var si = Number(t.getAttribute("data-si"));
    if (!s || !s.exercises || !s.exercises[i]) return;
    var ex = s.exercises[i];
    var sets = ex.sets || [];
    var set = sets[si] || {};
    var label = "set " + (si + 1);
    if (ex.n) label += " of " + ex.n;
    if (set.w || set.r) label += " (" + (set.w || "0") + " kg × " + (set.r || "0") + ")";
    if (!confirm("Delete " + label + "?")) return;
    if (sets.length <= 1) {
      sets[0] = { id: uid(), w: "", r: "", done: false };
    } else {
      sets.splice(si, 1);
    }
    s.exercises[i].sets = sets;
    saveSess(s);
    redraw();
  }, true);
  var timer = null;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = null; enhance(); }, 40);
  }
  function boot() {
    var n = document.getElementById("view-workout");
    if (n) new MutationObserver(schedule).observe(n, { childList: true, subtree: true });
    enhance();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
