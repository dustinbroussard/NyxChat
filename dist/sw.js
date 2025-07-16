
// Enhanced PWA Service Worker for NyxChat v5 - Fixed Installation
const CACHE_NAME = "nyxchat-pwa-v5";
const STATIC_CACHE = "nyxchat-static-v5";
const DYNAMIC_CACHE = "nyxchat-dynamic-v5";
const IMAGE_CACHE = "nyxchat-images-v5";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Install event - cache core assets
self.addEventListener("install", event => {
  console.log("Service Worker: Installing v5...");
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log("Service Worker: Caching core assets");
      return Promise.allSettled(
        CORE_ASSETS.map(asset => 
          cache.add(asset).catch(err => console.warn(`Failed to cache ${asset}:`, err))
        )
      );
    })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", event => {
  console.log("Service Worker: Activating v5...");
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheName.includes("v5")) {
            console.log("Service Worker: Clearing old cache", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Enhanced fetch event with better error handling
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests that aren't essential resources
  if (url.origin !== self.location.origin && !isEssentialResource(event.request)) {
    return;
  }

  event.respondWith(handleFetch(event.request));
});

async function handleFetch(request) {
  try {
    // Cache first for static assets
    if (isStaticAsset(request)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // Cache first for images and fonts
    if (isEssentialResource(request)) {
      return await cacheFirst(request, IMAGE_CACHE);
    }
    
    // Network first for API calls and dynamic content
    return await networkFirst(request);
    
  } catch (error) {
    console.warn("Service Worker: Fetch failed", error);
    return await handleOfflineFallback(request);
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Refresh cache in background
    fetch(request).then(response => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
    }).catch(() => {});
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    return cached || await handleOfflineFallback(request);
  }
}

async function handleOfflineFallback(request) {
  if (request.destination === 'document') {
    const cache = await caches.open(STATIC_CACHE);
    return cache.match('./') || new Response('App is offline', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return new Response('Resource unavailable offline', { 
    status: 503, 
    statusText: 'Service Unavailable' 
  });
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('.js') || 
         url.pathname.includes('.css') || 
         url.pathname === './' ||
         url.pathname === './index.html' ||
         url.pathname === './manifest.json';
}

function isEssentialResource(request) {
  return request.destination === 'image' || 
         request.destination === 'font' ||
         request.url.includes('.png') ||
         request.url.includes('.jpg') ||
         request.url.includes('.jpeg') ||
         request.url.includes('.svg') ||
         request.url.includes('.webp') ||
         request.url.includes('.woff') ||
         request.url.includes('.woff2') ||
         request.url.includes('.ico');
}

// Handle app installation
self.addEventListener('beforeinstallprompt', event => {
  console.log('Service Worker: beforeinstallprompt event');
});

// Handle successful installation
self.addEventListener('appinstalled', event => {
  console.log('Service Worker: App successfully installed');
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  console.log('Service Worker: Processing background sync');
  // Handle any queued actions when back online
}

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./').catch(err => 
      console.error('Failed to open window:', err)
    )
  );
});
