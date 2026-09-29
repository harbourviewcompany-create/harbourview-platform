// Shared client-error boundary contract and beacon logic. Keep the accepted
// boundary names in one runtime-safe module so browser reporters and the API
// validator cannot silently drift apart.

const MAX_CLIENT_STACK_LENGTH = 4000

export const CLIENT_ERROR_BOUNDARIES = ['country_role', 'global', 'admin', 'globe'] as const
export type ClientErrorBoundary = (typeof CLIENT_ERROR_BOUNDARIES)[number]

export function isClientErrorBoundary(value: unknown): value is ClientErrorBoundary {
  return typeof value === 'string' && (CLIENT_ERROR_BOUNDARIES as readonly string[]).includes(value)
}

export function reportClientError(boundary: ClientErrorBoundary, error: Error & { digest?: string }) {
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
