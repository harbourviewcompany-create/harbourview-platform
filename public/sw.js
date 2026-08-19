/* Harbourview service worker — network-first for navigations; cache static shell assets. */
const CACHE = 'harbourview-shell-v1'
const PRECACHE = ['/', '/manifest.webmanifest', '/icons/icon-192.svg', '/icons/icon-512.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Never cache authenticated API or dashboard data aggressively — network only.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/dashboard')) {
    event.respondWith(fetch(req).catch(() => caches.match('/')))
    return
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        if (res.ok && (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest')) {
          caches.open(CACHE).then((cache) => cache.put(req, copy))
        }
        return res
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/'))),
  )
})
