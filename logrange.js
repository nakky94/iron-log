(function () {
  var css = document.getElementById("logRangeCss");
  if (!css) { css = document.createElement("style"); css.id = "logRangeCss"; document.head.appendChild(css); }
  css.textContent = "#histFilters{display:none!important}";
  function allTime() {
    var all = document.querySelector("[data-hist-range='all']");
    if (all && !all.classList.contains("on")) all.click();
  }
  allTime();
  document.querySelectorAll(".nav button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(allTime, 60); });
  });
})();
