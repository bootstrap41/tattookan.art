// OneSignal bildirim SDK'sını bu service worker'a dahil ediyoruz
// (aynı dosyada birleştirmezsek iki service worker aynı scope'ta çakışır)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Site içeriği değiştiğinde bu ismi artırman gerekiyor (v1 -> v2 -> v3...),
// aksi halde ziyaretçilerin tarayıcısı eski önbelleği kullanmaya devam eder.
const CACHE_NAME = "tattookan-v11";

const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./data/tattoos.json",
];

// Kurulum
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );

  self.skipWaiting();
});

// Aktif olunca eski cache'leri temizle
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        }),
      ),
    ),
  );

  self.clients.claim();
});

// İstekleri yakala
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.headers.has("range")) {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isDynamicFile =
    requestUrl.pathname.endsWith("/script.js") ||
    requestUrl.pathname.endsWith("/data/tattoos.json") ||
    requestUrl.pathname.endsWith("/index.html") ||
    requestUrl.pathname === "/";

  if (isDynamicFile) {
    // HTML, JS ve JSON için önce ağı dene.
    // { cache: "no-store" } ÖNEMLİ: bu olmadan fetch() tarayıcının kendi
    // HTTP önbelleğini (bizim service worker'ımızdan bağımsız, sunucunun
    // Cache-Control süresine göre) hâlâ kullanabiliyor ve "ağa gidiyoruz"
    // dediğimiz halde yine eski veri dönebiliyor.
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const clonedResponse = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }

          return networkResponse;
        })
        .catch(() => caches.match(event.request)),
    );

    return;
  }

  // Görseller ve diğer statik dosyalar için cache-first.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const clonedResponse = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }

        return networkResponse;
      });
    }),
  );
});
