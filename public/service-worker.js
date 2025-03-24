// Service Worker basique pour notre PWA
const CACHE_NAME = 'spotify-sorter-v1';
const urlsToCache = [
  '/',
  '/styles.css',
  '/manifest.json',
  '/icons/icon_192x192.png',
  '/icons/icon_512x512.png'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Récupération des ressources
// Stratégie "Network first, falling back to cache"
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes API
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Nettoyage des anciens caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
