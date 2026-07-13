// OneSignal bildirim SDK'sını bu service worker'a dahil ediyoruz
// (aynı dosyada birleştirmezsek iki service worker aynı scope'ta çakışır)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Site içeriği değiştiğinde bu ismi artırman gerekiyor (v1 -> v2 -> v3...),
// aksi halde ziyaretçilerin tarayıcısı eski önbelleği kullanmaya devam eder.
const CACHE_NAME = "tattookan-v3";

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

  // Video gibi büyük dosyalar tarayıcı tarafından "Range" başlığıyla
  // parça parça istenir ve sunucu 206 (Partial Content) döner.
  // Cache API bu tür kısmi yanıtları saklayamaz, o yüzden bu istekleri
  // önbellekleme mantığına hiç sokmuyoruz; direkt ağdan cevaplansın.
  if (event.request.headers.has("range")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((networkResponse) => {
          // Sadece tam ve başarılı (200) yanıtları önbelleğe al.
          // 206 (parçalı), 3xx/4xx/5xx gibi diğer durumları atla.
          if (networkResponse.status === 200) {
            const clonedResponse = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }

          return networkResponse;
        })
      );
    }),
  );
});
