/* ============================================
   🐶 Tote Runner — Service Worker (modo offline)
   Guarda el juego y las fuentes en caché para
   poder jugar sin conexión una vez visitado.
   ============================================ */
const CACHE = 'tote-runner-v4';
const BASE = ['./', './index.html'];

// Instala: guarda el juego en caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())
  );
});

// Activa: limpia cachés de versiones antiguas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Estrategia: caché primero, y de fondo se actualiza desde la red
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = e.request.url;

  // Firebase (login/récords online) siempre va directo a la red
  if (u.includes('firebasejs') ||
      u.includes('firestore.googleapis.com') ||
      u.includes('identitytoolkit.googleapis.com')) return;

  e.respondWith(
    caches.match(e.request).then(enCache => {
      const desdeRed = fetch(e.request).then(resp => {
        if (resp && resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
        }
        return resp;
      }).catch(() =>
        enCache || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined)
      );
      return enCache || desdeRed;
    })
  );
});
