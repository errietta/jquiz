// Choose a cache name
const cacheName = 'cache-v15';

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

  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      return keys.map(async (cache) => {
        if(cache !== cacheName) {
          console.log('Service Worker: Removing old cache: '+cache);
          return await caches.delete(cache);
        }
      })
    })()
  );
});

async function fetchAndCacheIfOk(event) {
  try {
    const response = await fetch(event.request);

    if (response.ok) {
      console.log("fetched", event.request.url);
      const responseClone = response.clone();
      const cache = await caches.open(cacheName);
      await cache.put(event.request, responseClone);
    }

    return response;
  } catch (e) {
    return e;
  }
}

async function fetchWithCache(event) {
  const cache = await caches.open(cacheName);
  const response = await cache.match(event.request);
  if (!!response) {
    // it is cached but we want to update it so request but not await
    fetchAndCacheIfOk(event);
    return response
  } else {
    return fetchAndCacheIfOk(event);
  }
}

function handleFetch(event) {
  if (event.request.headers.get('cache-control') !== 'no-cache') {
    event.respondWith(fetchWithCache(event));
  }
}

self.addEventListener('fetch', handleFetch);
