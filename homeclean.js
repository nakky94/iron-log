(function () {
  var css = document.getElementById("homeCleanCss");
  if (!css) { css = document.createElement("style"); css.id = "homeCleanCss"; document.head.appendChild(css); }
  css.textContent = "#view-home .session-log,#view-home [data-act='repeat'],#homeScreen .hs-log{display:none!important}";
  function clean() {
    var home = document.getElementById("view-home");
    if (!home) return;
    home.querySelectorAll("button, .card, .tiny, div").forEach(function (el) {
      if (el.closest("[data-hs-tpl], #hsNewTpl, #hsGear, #homeScreen") && !/sessions|repeat gym/i.test(el.textContent || "")) return;
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!t || t.length > 80) return;
      if (/\d+\s+sessions|sessions log|repeat gym/i.test(t) && !el.querySelector("[data-hs-tpl]")) el.remove();
    });
  }
  var home = document.getElementById("view-home");
  if (home) new MutationObserver(clean).observe(home, { childList: true, subtree: true });
  clean();
})();
