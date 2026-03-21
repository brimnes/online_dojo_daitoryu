// Online Dojo — Service Worker
// Кэширует shell приложения для работы оффлайн и быстрого старта

const CACHE_NAME = 'online-dojo-v1';

// Ресурсы для предварительного кэширования (app shell)
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

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

  // Supabase API — всегда сеть, не кэшировать
  if (event.request.url.includes('supabase.co')) return;

  // YouTube / Vimeo iframes — не кэшировать
  if (
    event.request.url.includes('youtube.com') ||
    event.request.url.includes('vimeo.com')
  ) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Кэшируем успешные ответы (только same-origin)
        if (
          response.ok &&
          response.type === 'basic' &&
          event.request.url.startsWith(self.location.origin)
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
