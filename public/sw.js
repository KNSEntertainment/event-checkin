const CACHE_NAME = 'event-checkin-v1';
const STATIC_CACHE_NAME = 'event-checkin-static-v1';
const DYNAMIC_CACHE_NAME = 'event-checkin-dynamic-v1';
const RUNTIME_CACHE_NAME = 'event-checkin-runtime-v1';

// Core pages to cache immediately
const CORE_PAGES = [
  '/',
  '/dashboard',
  '/events',
  '/privacy',
  '/offline',
  '/manifest.json',
];

// Static asset patterns to cache
const STATIC_ASSET_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.ico$/,
  /\.woff$/,
  /\.woff2$/,
  /\.ttf$/,
  /\.eot$/,
];

// API patterns to handle differently
const API_PATTERNS = [
  /^\/api\//,
];

// Install event - cache core pages and prepare for runtime caching
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching core pages');
        return cache.addAll(CORE_PAGES);
      })
      .then(() => {
        console.log('Service Worker: Core pages cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Helper function to determine cache strategy
function getCacheStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // API requests - network first, cache fallback
  if (API_PATTERNS.some(pattern => pattern.test(pathname))) {
    return 'network-first';
  }
  
  // Static assets - cache first, network fallback
  if (STATIC_ASSET_PATTERNS.some(pattern => pattern.test(pathname))) {
    return 'cache-first';
  }
  
  // Pages - stale while revalidate
  if (request.destination === 'document') {
    return 'stale-while-revalidate';
  }
  
  // Default - network first
  return 'network-first';
}

// Cache strategies
const cacheStrategies = {
  'cache-first': async (request) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(RUNTIME_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return new Response('Offline - Asset not cached', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
  },
  
  'network-first': async (request) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(RUNTIME_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // For API requests, return offline response
      if (request.url.includes('/api/')) {
        return new Response(JSON.stringify({ error: 'Offline - API unavailable' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response('Offline - Network unavailable', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
  },
  
  'stale-while-revalidate': async (request) => {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Always try to fetch from network
    const fetchPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }).catch(() => {
      // If network fails and we have a cached response, return it
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // For page requests, serve offline page
      if (request.destination === 'document') {
        return caches.match('/offline');
      }
      
      return new Response('Offline - Page not cached', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    });
    
    // Return cached version immediately if available, otherwise wait for network
    return cachedResponse || fetchPromise;
  }
};

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (except for specific CDNs)
  if (url.origin !== self.location.origin && 
      !url.hostname.includes('fonts.gstatic.com') &&
      !url.hostname.includes('fonts.googleapis.com')) {
    return;
  }
  
  const strategy = getCacheStrategy(request);
  event.respondWith(cacheStrategies[strategy](request));
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline data sync here
      console.log('Service Worker: Syncing offline data')
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Event Check-in', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
