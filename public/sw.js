/* Harbourview service worker — network-first for navigations; cache static shell assets. */
const CACHE = 'harbourview-shell-v2'
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

  // API and authenticated dashboard requests are network-only. Returning the
  // cached HTML shell here corrupts JSON/chunk callers and masks real failures.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/dashboard')) {
    event.respondWith(fetch(req))
    return
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((hit) => hit || caches.match('/'))),
    )
    return
  }

  event.respondWith(
    fetch(req).then((res) => {
      if (res.ok && (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest')) {
        const copy = res.clone()
        caches.open(CACHE).then((cache) => cache.put(req, copy))
      }
      return res
    }),
  )
})
