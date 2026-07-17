// OneSignal bildirim SDK'sını bu service worker'a dahil ediyoruz
// (aynı dosyada birleştirmezsek iki service worker aynı scope'ta çakışır)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Site içeriği değiştiğinde bu ismi artırman gerekiyor (v1 -> v2 -> v3...),
// aksi halde ziyaretçilerin tarayıcısı eski önbelleği kullanmaya devam eder.
const CACHE_NAME = "tattookan-v24";

const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./data/tattoos.json",
  "./data/portfolyo.json",
  "./hakkimizda.html",
  "./gizlilik-politikasi.html",
  "./hediye-cekleri.html",
  "./portfolyo.html",
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

  // Admin panel (Decap CMS) ve onun GitHub/Cloudflare Worker/unpkg.com gibi
  // dış kaynaklara yaptığı istekler bu service worker'a hiç uğramasın —
  // hem her zaman en güncel admin arayüzünü göstermesi için, hem de
  // GitHub API çağrılarını yanlışlıkla önbelleğe alıp bozmamak için.
  if (
    requestUrl.pathname.startsWith("/admin/") ||
    requestUrl.origin !== self.location.origin
  ) {
    return;
  }
  const isDynamicFile =
    requestUrl.pathname.endsWith("/script.js") ||
    requestUrl.pathname.endsWith("/data/tattoos.json") ||
    requestUrl.pathname.endsWith("/data/portfolyo.json") ||
    requestUrl.pathname.endsWith("/index.html") ||
    requestUrl.pathname.endsWith("/hakkimizda.html") ||
    requestUrl.pathname.endsWith("/gizlilik-politikasi.html") ||
    requestUrl.pathname.endsWith("/hediye-cekleri.html") ||
    requestUrl.pathname.endsWith("/portfolyo.html") ||
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
