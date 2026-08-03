const CANONICAL_HARBOURVIEW_ORIGIN = 'https://harbourview.vercel.app'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

function isSafeInternalPath(value: string) {
  return value.startsWith('/') && !value.startsWith('//')
}

export function getHarbourviewAuthOrigin(currentOrigin?: string) {
  if (currentOrigin) {
    try {
      const parsed = new URL(currentOrigin)
      if (LOCAL_HOSTS.has(parsed.hostname)) return parsed.origin
    } catch {
      // Fall through to the canonical production origin.
    }
  }

  return CANONICAL_HARBOURVIEW_ORIGIN
}

export function getHarbourviewAuthCallbackUrl(next: string, currentOrigin?: string) {
  const callback = new URL('/auth/callback', getHarbourviewAuthOrigin(currentOrigin))
  callback.searchParams.set('next', isSafeInternalPath(next) ? next : '/dashboard')
  return callback.toString()
}
