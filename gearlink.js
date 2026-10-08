(function () {
  var css = document.getElementById("gearLinkCss");
  if (!css) { css = document.createElement("style"); css.id = "gearLinkCss"; document.head.appendChild(css); }
  css.textContent = ".nav{grid-template-columns:repeat(4,1fr)!important}.nav button[data-view='library']{display:none!important}#hsGear{margin-top:18px;background:transparent;color:#8d8d92;font-size:13px;font-weight:650;min-height:36px}";
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
  link();
  var home = document.getElementById("view-home");
  if (home) new MutationObserver(link).observe(home, { childList: true, subtree: true });
})();
