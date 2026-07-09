// Shared beacon logic for app/country/[country]/error.tsx and
// app/global-error.tsx. Kept as one function so the stack-truncation length
// and transport fallback stay in sync between the two boundaries instead of
// drifting if edited independently.

const MAX_CLIENT_STACK_LENGTH = 4000

export function reportClientError(boundary: 'country_role' | 'global', error: Error & { digest?: string }) {
  const payload = JSON.stringify({
    boundary,
    route: window.location.pathname,
    digest: error.digest,
    message: error.message,
    stack: error.stack?.slice(0, MAX_CLIENT_STACK_LENGTH),
    viewportWidth: window.innerWidth,
  })
  const sent = navigator.sendBeacon?.('/api/client-errors', new Blob([payload], { type: 'application/json' }))
  if (!sent)
    fetch('/api/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {})
}
