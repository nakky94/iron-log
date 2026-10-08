(function () {
  if (!document.querySelector('script[src="logpr.js"]')) {
    var s = document.createElement("script"); s.src = "logpr.js"; document.body.appendChild(s);
  }
  if (!document.querySelector('script[src="gearpage.js"]')) {
    var g = document.createElement("script"); g.src = "gearpage.js"; document.body.appendChild(g);
  }
  var css = document.getElementById("gearLinkCss");
  if (!css) { css = document.createElement("style"); css.id = "gearLinkCss"; document.head.appendChild(css); }
  css.textContent = ".nav button[data-view='library']{display:none!important}#hsGear{margin-top:18px;background:transparent;color:#8d8d92;font-size:13px;font-weight:650;min-height:36px}";
  function link() {
    var box = document.getElementById("homeScreen");
    if (!box || document.getElementById("hsGear")) return;
    var b = document.createElement("button");
    b.id = "hsGear"; b.type = "button"; b.textContent = "Exercises";
    b.onclick = function () {
      var n = document.querySelector(".nav button[data-view='library']");
      if (n) n.click();
    };
    box.appendChild(b);
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest(".fav-ex, #addEx, .chip, #gearTop")) return;
    var lib = document.getElementById("view-library");
    if (!lib || !lib.classList.contains("active")) return;
    var hit = e.target.closest("[data-act='add-ex']");
    if (!hit || !lib.contains(hit) || hit.closest("#gearLocker")) return;
    setTimeout(function () {
      var n = document.querySelector(".nav button[data-view='workout']");
      if (n) n.click();
    }, 80);
  }, true);
  link();
  var home = document.getElementById("view-home");
  if (home) new MutationObserver(link).observe(home, { childList: true, subtree: true });
})();
