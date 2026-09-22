(function () {
  function loadSess() {
    try { return JSON.parse(localStorage.getItem("il_session") || "null"); } catch (e) { return null; }
  }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function del(i, si) {
    var s = loadSess();
    if (!s || !s.exercises || !s.exercises[i]) return;
    var ex = s.exercises[i];
    var sets = ex.sets || [];
    var set = sets[si] || {};
    var label = (si === 0 ? "warm-up" : "set " + si) + (ex.n ? " of " + ex.n : "");
    if (set.w || set.r) label += " (" + (set.w || "0") + " kg \u00d7 " + (set.r || "0") + ")";
    if (!confirm("Delete " + label + "?")) return;
    if (sets.length <= 1) sets[0] = { id: uid(), w: "", r: "", done: false };
    else sets.splice(si, 1);
    s.exercises[i].sets = sets;
    localStorage.setItem("il_session", JSON.stringify(s));
    var btn = document.querySelector('.nav button[data-view="workout"]');
    if (btn) btn.click();
  }
  window.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act='del-set']");
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    del(Number(t.getAttribute("data-i")), Number(t.getAttribute("data-si")));
  }, true);
})();
