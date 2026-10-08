(function () {
  if (!document.querySelector('script[src="logpr.js"]')) {
    var s = document.createElement("script");
    s.src = "logpr.js";
    document.body.appendChild(s);
  }
  var css = document.getElementById("gearLinkCss");
  if (!css) { css = document.createElement("style"); css.id = "gearLinkCss"; document.head.appendChild(css); }
  css.textContent = ".nav button[data-view='library']{display:none!important}#hsGear{margin-top:18px;background:transparent;color:#8d8d92;font-size:13px;font-weight:650;min-height:36px}";
  function toTrain() {
    var n = document.querySelector(".nav button[data-view='workout']");
    if (n) n.click();
  }
  function link() {
    var box = document.getElementById("homeScreen");
    if (!box || document.getElementById("hsGear")) return;
    var b = document.createElement("button");
    b.id = "hsGear";
    b.type = "button";
    b.textContent = "Exercises";
    b.onclick = function () {
      var n = document.querySelector(".nav button[data-view='library']");
      if (n) n.click();
    };
    box.appendChild(b);
  }
  document.addEventListener("click", function (e) {
    var lib = document.getElementById("view-library");
    if (!lib || !lib.classList.contains("active")) return;
    var hit = e.target.closest("[data-act='add-ex'], [data-act='add'], [data-eid], .ex-name");
    if (!hit || !lib.contains(hit)) return;
    if (hit.closest("input, select, #libSearch")) return;
    setTimeout(toTrain, 60);
  }, true);
  link();
  var home = document.getElementById("view-home");
  if (home) new MutationObserver(link).observe(home, { childList: true, subtree: true });
})();
