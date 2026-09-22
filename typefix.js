(function () {
  function title(s) {
    return String(s || "").replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
  }
  function boot() {
    var home = document.getElementById("view-home");
    if (!home) return;
    home.classList.add("ready");
    Array.prototype.slice.call(home.querySelectorAll("[data-tpl-id] .ex-name")).forEach(function (el) {
      if (!el.children.length) el.textContent = title(el.textContent);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
