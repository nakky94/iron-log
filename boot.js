(function () {
  var css = document.createElement("style");
  css.textContent = "html,body{background:#0a0a0a;color:#f4f4f5}header.top{display:flex!important;color:#f4f4f5!important}";
  document.head.appendChild(css);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.update(); });
    });
  }
  setTimeout(function () {
    var text = (document.body.innerText || "").replace(/\s+/g, "");
    if (text.length < 8 && !sessionStorage.getItem("il_recovered")) {
      sessionStorage.setItem("il_recovered", "1");
      location.reload();
    }
  }, 1200);
})();
