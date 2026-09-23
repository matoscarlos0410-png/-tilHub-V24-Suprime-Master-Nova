/* =========================================================
   ÚtilHub V24 — NOVA FLOW
   Service Worker
   Versión: 24.0
   ========================================================= */

const CACHE_NAME = "utilhub-v24-nova-flow-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest"
];

/* =========================================================
   INSTALACIÓN
   ========================================================= */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error("ÚtilHub: error instalando caché:", error);
      })
  );
});

/* =========================================================
   ACTIVACIÓN
   ========================================================= */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return (
                name.startsWith("utilhub-") &&
                name !== CACHE_NAME
              );
            })
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

/* =========================================================
   PETICIONES
   ========================================================= */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Solo GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // No intervenir en APIs externas
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navegación HTML:
  // primero intenta Internet y después caché.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});

            return response;
          }

          throw new Error("Respuesta de red no válida");
        })
        .catch(() => {
          return caches.match(request)
            .then((cached) => {
              return cached || caches.match("./index.html");
            });
        })
    );

    return;
  }

  // Archivos locales:
  // caché primero + actualización desde Internet.
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.ok &&
              networkResponse.type === "basic"
            ) {
              const copy = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, copy))
                .catch(() => {});
            }

            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
  );
});

/* =========================================================
   MENSAJES
   ========================================================= */

self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.delete(CACHE_NAME)
    );
  }
});

/* =========================================================
   FIN
   ========================================================= */
