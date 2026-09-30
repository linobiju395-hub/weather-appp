// AetherCast Pro Weather - Service Worker
const CACHE_NAME = 'aethercast-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Real-time Background Notification handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const notificationOptions = {
      body: options?.body || 'Weather alert update',
      icon: options?.icon || '/icon.svg',
      badge: '/icon.svg',
      tag: options?.tag || 'weather-alert',
      renotify: true,
      data: options?.data || { url: '/' },
      requireInteraction: options?.requireInteraction || false,
      actions: [
        { action: 'open', title: 'View Radar' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    self.registration.showNotification(title || 'AetherCast Pro Weather Alert', notificationOptions);
  }
});

// Handle notification interaction
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Periodic background sync if supported
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'weather-update') {
    event.waitUntil(checkWeatherUpdates());
  }
});

async function checkWeatherUpdates() {
  try {
    const response = await fetch('/api/weather?lat=40.7128&lon=-74.0060');
    if (response.ok) {
      const data = await response.json();
      if (data && data.alerts && data.alerts.length > 0) {
        const topAlert = data.alerts[0];
        self.registration.showNotification(`⚠️ Weather Alert: ${topAlert.title}`, {
          body: topAlert.description,
          icon: '/icon.svg',
          tag: 'periodic-alert'
        });
      }
    }
  } catch (err) {
    // Silent fail in background sync
  }
}
