// v6 - force clear all old caches
const CACHE = 'kal-v6';
self.addEventListener('install', e => {
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  // Always fetch fresh from network, no caching
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
