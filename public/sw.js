// Online Dojo — Service Worker
// Кэширует shell приложения для работы оффлайн и быстрого старта

const CACHE_NAME = 'online-dojo-v2'; // bump при каждом деплое

// Ресурсы для предварительного кэширования (app shell)
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// ── Push notifications ───────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Дайто-рю Додзё', {
      body:  data.body  || '',
      icon:  data.icon  || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-192x192.png',
      data:  { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── Install: precache app shell ──────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ───────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first, fall back to cache ─────────────────────
self.addEventListener('fetch', (event) => {
  // Только GET-запросы
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // API-запросы — никогда не кэшировать (данные должны быть свежими)
  if (url.includes('/api/')) return;

  // Внешние домены — не кэшировать
  if (
    url.includes('youtube.com') ||
    url.includes('vimeo.com') ||
    url.includes('kinescope.io') ||
    url.includes('supabase.co')
  ) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Кэшируем только same-origin статику (JS, CSS, шрифты, иконки)
        if (
          response.ok &&
          response.type === 'basic' &&
          url.startsWith(self.location.origin) &&
          !url.includes('/api/')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Оффлайн — возвращаем из кэша
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Для навигации — главная страница
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
