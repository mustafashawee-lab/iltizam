// سجل الالتزام — service worker
// الصفحة نفسها: network-first حتى يوصلك أي تحديث فوراً.
// باقي الملفات (أيقونات، مكتبة الخريطة): cache-first مع تحديث بالخلفية.
var CACHE = "iltizam-v2";
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

function isDocument(req){
  return req.mode === "navigate" || (req.headers.get("accept") || "").indexOf("text/html") !== -1;
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;

  // بلاطات الخريطة تمر مباشرة بدون تخزين
  if (req.url.indexOf("tile.openstreetmap.org") !== -1) return;

  if (isDocument(req)){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(cache){ cache.put(req, copy); }).catch(function(){});
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){ return hit || caches.match("./"); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(cached){
      var network = fetch(req).then(function(res){
        if (res && res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(cache){ cache.put(req, copy); }).catch(function(){});
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
