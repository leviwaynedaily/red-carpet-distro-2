const CACHE_NAME = 'palmtree-smokes-v9';
const SUPABASE_URL = 'https://fwsdoiaodphgyeteafbq.supabase.co/storage/v1/object/public/media/sitesettings';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  `${SUPABASE_URL}/favicon.ico`,
  `${SUPABASE_URL}/favicon.webp`,
  `${SUPABASE_URL}/favicon.png`,
  `${SUPABASE_URL}/apple-touch-icon.png`,
  `${SUPABASE_URL}/pwa/icon-192.webp`,
  `${SUPABASE_URL}/pwa/icon-512.webp`
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', event);
  // Force activation
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Cache error:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Skip caching API calls and other dynamic content
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('site_settings?select=')) {
    return;
  }

  console.log('[Service Worker] Fetching:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('[Service Worker] Using cached version of', event.request.url);
          return response;
        }
        console.log('[Service Worker] Fetching resource:', event.request.url);
        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(error => {
        console.error('[Service Worker] Fetch error:', error);
        // Return a custom offline page or fallback content
        return new Response('Offline content here');
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', event);
  // Force activation on all clients
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Received message:', event.data);
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

