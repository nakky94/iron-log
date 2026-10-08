(function () {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(regs.map(function (r) { return r.unregister(); }));
    }).then(function () {
      if (window.caches) return caches.keys().then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); });
    }).catch(function () {});
  }
})();
