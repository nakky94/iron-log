(function () {
  var s = document.getElementById("navActiveStyle");
  if (!s) { s = document.createElement("style"); s.id = "navActiveStyle"; document.head.appendChild(s); }
  s.textContent =
    ".nav{gap:4px;padding:6px 6px calc(8px + var(--safe-b))!important}" +
    ".nav button{position:relative;border-radius:16px;color:#6e6e6e!important;min-height:48px;padding:6px 2px;background:transparent!important}" +
    ".nav button span{display:none!important}" +
    ".nav button svg{width:22px;height:22px;fill:none!important;stroke:currentColor!important}" +
    ".nav button.active{background:#1c1c1c!important;color:#f4f4f5!important;border:1px solid #2a2a2e}" +
    ".nav button.active svg{color:#f4f4f5!important;stroke:#f4f4f5!important;fill:none!important}" +
    ".nav button.active::before{display:none}";
})();
