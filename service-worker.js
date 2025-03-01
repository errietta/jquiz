// Choose a cache name
const cacheName = 'cache-v2';

// List the files to precache
const precacheResources = [
  '/', '/index.html', '/style.css', '/game.js',
  'vocab/n1_all.json',
  'vocab/n1_vocab.json',
  'vocab/n2_all.json',
  'vocab/n2_vocab.json',
  'vocab/n3_all.json',
  'vocab/n3_vocab.json',
  'vocab/n4_all.json',
  'vocab/n4_vocab.json',
  'vocab/n5_all.json',
  'vocab/n5_vocab.json',
  'vocab/puzzle.json',
];

// When the service worker is installing, open the cache and add the precache resources to it
self.addEventListener('install', (event) => {
  console.log('Service worker install event!');
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(precacheResources)));
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activate event!');
});

// When there's an incoming fetch request, try and respond with a precached resource, otherwise fall back to the network
self.addEventListener('fetch', (event) => {
  console.log('Fetch intercepted for:', event.request.url);
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    }),
  );
});