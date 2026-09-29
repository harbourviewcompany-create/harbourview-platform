/**
 * Wraps fetch so every request is aborted after `timeoutMs`, and still honours a
 * caller-supplied AbortSignal. Used for the globe's server-side Supabase client:
 * when the database is unreachable, Cloudflare returns 522 only after its own
 * connect timeout, which is longer than the browser's 8s /api/globe deadline.
 * Failing fast lets the route serve its static fallback before the client gives up.
 */
export function createTimeoutFetch(
  timeoutMs: number,
  baseFetch: typeof fetch = (...args) => fetch(...args),
): typeof fetch {
  return (input, init) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs)
    const signal = init?.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal
    return baseFetch(input, { ...init, signal })
  }
}
