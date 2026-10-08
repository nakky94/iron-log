(function () {
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function nameFromToggle(btn) {
    var s = load("il_session", null);
    var i = Number(btn.getAttribute("data-i"));
    return s && s.exercises && s.exercises[i] ? s.exercises[i].n : "";
  }
  document.addEventListener("click", function (e) {
    if (e.target.id === "restPlus") {
      e.preventDefault();
      e.stopPropagation();
      if (window.gymRestAdd) window.gymRestAdd(15);
      return;
    }
    var chip = e.target.closest("[data-rest-sec]");
    if (chip) {
      var map = load("il_rest_by", {});
      var open = document.querySelector("#view-workout .card .ex-name");
      var s = load("il_session", null);
      var name = s && s.exercises && s.exercises[0] ? s.exercises[0].n : "";
      if (name) { map[name] = Number(chip.getAttribute("data-rest-sec")); save("il_rest_by", map); }
    }
    var tog = e.target.closest("[data-act='toggle-set']");
    if (!tog) return;
    setTimeout(function () {
      var s = load("il_session", null);
      var i = Number(tog.getAttribute("data-i"));
      var si = Number(tog.getAttribute("data-si"));
      var set = s && s.exercises[i] && s.exercises[i].sets[si];
      if (set && !set.done && window.gymRestClear) window.gymRestClear();
      if (set && set.done && window.gymRestAdd) {
        var map = load("il_rest_by", {});
        var sec = map[s.exercises[i].n] || 90;
        window.gymRestAdd(0, sec);
      }
    }, 50);
  }, true);
})();
