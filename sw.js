const CACHE = "gym-log-v34";
const ASSETS = ["/", "/index.html", "/app.js", "/suggest.js", "/extra.js", "/more.js", "/cues.js", "/backup.js", "/homeui.js", "/trainsets.js", "/parse.worker.js", "/manifest.webmanifest", "/icon.svg"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) {
        event.waitUntil(fetch(event.request).then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(event.request, res.clone()));
        }).catch(function () {}));
        return hit;
      }
      return fetch(event.request).then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(CACHE).then((c) => c.put(event.request, copy));
        return res;
      });
    })
  );
});
