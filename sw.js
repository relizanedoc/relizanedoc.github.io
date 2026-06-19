const CACHE_NAME = 'relizane-medical-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './404.html',
  './favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('تم حفظ ملفات التطبيق بنجاح');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('تم تنظيف الكاش القديم');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. حاجز الحماية الأساسي: تجاهل أي طلب لا يبدأ بـ http/https لمنع أخطاء إضافات المتصفح (chrome-extension)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // 2. تجاوز طلبات Supabase و Google لمنع الكاش من التدخل في قواعد البيانات والمصادقة
  if (event.request.url.includes('supabase.co') || event.request.url.includes('google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // التحقق من الاستجابة وأنها من نفس الدومين (basic) لمنع أخطاء الـ clone
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./404.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
