var CACHE_NAME = 'lifx-goal-light-cache-v1';
var offlinePath = '/offline';
var urlsToCache = [
  offlinePath,
  '/bootstrap/css/bootstrap.min.css',
  '/jquery/jquery.min.js',
  '/bootstrap/js/bootstrap.min.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(fetch(event.request.url).catch(error => {
      return caches.match(offlinePath);
    }));

  } else {
    event.respondWith(caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
  
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
  
        var responseToCache = response.clone();
  
        caches.open(CACHE_NAME)
          .then(function(cache) {
            cache.put(event.request, responseToCache);
          });
  
        return response;
      });
    }));
  }
});