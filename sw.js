// v7 - aggressive no-cache
const CACHE_NAME = 'kal-v7';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  // Never cache - always network first
  e.respondWith(
    fetch(e.request, {cache: 'no-store'}).catch(() => new Response('offline'))
  );
});
