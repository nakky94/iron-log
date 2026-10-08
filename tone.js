(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function routines() { return load("il_routines", []); }
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-act='toggle-set']") && navigator.vibrate) navigator.vibrate(12);
    var card = e.target.closest && e.target.closest("[data-hs-tpl] .ex-name, [data-hs-tpl] .tpl-body");
    if (!card || e.target.closest("button")) return;
    if (e.detail !== 2) return;
    var wrap = card.closest("[data-hs-tpl]");
    var id = wrap.getAttribute("data-hs-tpl");
    var all = routines();
    var cur = all.filter(function (r) { return r.id === id; })[0];
    if (!cur) return;
    var next = prompt("Short name", cur.short || cur.name);
    if (!next) return;
    cur.short = next;
    save("il_routines", all);
    var name = wrap.querySelector(".ex-name");
    if (name) name.textContent = next;
  }, true);
  function apply() {
    var map = {};
    routines().forEach(function (r) { if (r.short) map[r.id] = r.short; });
    document.querySelectorAll("[data-hs-tpl]").forEach(function (card) {
      var short = map[card.getAttribute("data-hs-tpl")];
      var name = card.querySelector(".ex-name");
      if (short && name && name.textContent !== short) name.textContent = short;
    });
  }
  var home = document.getElementById("view-home");
  if (home) new MutationObserver(apply).observe(home, { childList: true, subtree: true });
  apply();
})();
