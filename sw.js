const CACHE_NAME = 'relizane-medical-v1';
// الملفات الأساسية التي نريد حفظها ليعمل التطبيق أوفلاين (الهيكل فقط)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './404.html',
  './favicon.png',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'
];

// 1. تثبيت Service Worker وحفظ الملفات
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('تم حفظ ملفات التطبيق بنجاح');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. تفعيل وتنظيف النسخ القديمة
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

// 3. اعتراض الطلبات (Fetch)
self.addEventListener('fetch', (event) => {
  // تجاوز طلبات Supabase API و Google Auth لضمان جلب البيانات الحية دائماً
  if (event.request.url.includes('supabase.co') || event.request.url.includes('google.com')) {
    return;
  }

  // استراتيجية: Stale-While-Revalidate للملفات الثابتة
 event.respondWith(
  caches.match(event.request).then((cachedResponse) => {
    const fetchPromise = fetch(event.request).then((networkResponse) => {
      // التحقق من أن الاستجابة صالحة
      if (networkResponse && networkResponse.status === 200) {
        // 🟢 الحل: نقوم بعمل نسخة (Clone) قبل استخدام الاستجابة في الكاش
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    });

    // نرجع الاستجابة المخزنة إذا وجدت، وإلا نرجع وعود الشبكة
    return cachedResponse || fetchPromise;
  }).catch(() => {
    // في حال فشل كل شيء، نعرض صفحة 404
    if (event.request.mode === 'navigate') {
      return caches.match('./404.html');
    }
  })
);

      return cachedResponse || fetchPromise;
    })
  );
});
