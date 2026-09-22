(function () {
  function title(s) {
    return String(s || "").replace(/[A-Za-z][A-Za-z']*/g, function (w) {
      if (/^(kg|db|pr|rir)$/i.test(w)) return w.toLowerCase() === "kg" ? "kg" : w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });
  }
  function fixNames(root) {
    if (!root) return;
    Array.prototype.slice.call(root.querySelectorAll(".ex-name")).forEach(function (el) {
      if (el.children.length) return;
      var n = title(el.textContent);
      if (n !== el.textContent) el.textContent = n;
    });
    var home = document.getElementById("view-home");
    if (home) home.classList.add("ready");
  }
  var t = null;
  function schedule() {
    if (t) return;
    t = setTimeout(function () {
      t = null;
      fixNames(document.getElementById("view-workout"));
      fixNames(document.getElementById("view-library"));
      fixNames(document.getElementById("view-home"));
    }, 100);
  }
  function boot() {
    var w = document.getElementById("view-workout");
    if (w) new MutationObserver(schedule).observe(w, { childList: true });
    schedule();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
