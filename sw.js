// سجل الالتزام — service worker (minimal shell cache, required for installability).
// This app's live data lives in the "db" capability which only exists when the
// page is opened embedded from the Claude chat card. When installed and opened
// standalone, db is unavailable and the app falls back to on-device storage
// automatically (see index.html) — this worker only makes the shell/icons load
// instantly and lets the browser offer "Add to Home Screen".
var CACHE = "iltizam-shell-v1";
var SHELL = ["./", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){ return cache.addAll(SHELL); }).catch(function(){})
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e){
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var network = fetch(e.request).then(function(res){
        if (res && res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(cache){ cache.put(e.request, copy); }).catch(function(){});
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
