(function () {
  ["brand.js", "logrange.js"].forEach(function (src) {
    if (document.querySelector("script[src='" + src + "']")) return;
    var s = document.createElement("script");
    s.src = src;
    document.body.appendChild(s);
  });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(regs.map(function (r) { return r.unregister(); }));
    }).catch(function () {});
  }
})();
