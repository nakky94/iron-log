(function () {
  var quiet = 0;
  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-act='toggle-set'], [data-act='start-timer']")) return;
    if (Date.now() < quiet) {
      e.stopImmediatePropagation();
    }
  }, true);
  setInterval(function () {
    var chip = document.querySelector(".rest-chip");
    if (!chip) return;
    if (chip.getAttribute("data-t") === "Go") return;
    var num = chip.querySelector(".rest-num");
    var txt = (num && num.textContent) || chip.textContent || "";
    if (!/0:00/.test(txt)) return;
    chip.setAttribute("data-t", "Go");
    chip.textContent = "Go";
    chip.classList.add("warn");
    quiet = Date.now() + 3000;
  }, 200);
})();
