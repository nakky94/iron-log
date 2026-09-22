(function () {
  var s = document.getElementById("navActiveStyle");
  if (!s) { s = document.createElement("style"); s.id = "navActiveStyle"; document.head.appendChild(s); }
  s.textContent =
    ".nav{gap:4px;padding:6px 6px calc(8px + var(--safe-b))!important}" +
    ".nav button{position:relative;border-radius:16px;color:#6e6e6e!important;min-height:48px;padding:6px 2px}" +
    ".nav button span{font-weight:600;letter-spacing:.02em}" +
    ".nav button svg{width:20px;height:20px;fill:none;stroke:currentColor}" +
    ".nav button.active{background:#FFD400!important;color:#111!important;font-weight:800}" +
    ".nav button.active span{color:#111!important;font-weight:800}" +
    ".nav button.active svg{color:#111!important;fill:#111!important;stroke:#111!important}" +
    ".nav button.active::before{content:\"\";position:absolute;top:5px;left:50%;transform:translateX(-50%);width:14px;height:3px;border-radius:99px;background:#111}";
})();
