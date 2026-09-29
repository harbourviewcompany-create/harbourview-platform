import * as Sentry from '@sentry/nextjs'
import { structuredLog } from '@/lib/observability/structuredLog'

export type GlobeDegradation = {
  countriesUnavailable: boolean
  signalsUnavailable: boolean
}

/** Healthy payloads are edge-cached for the revalidate window. */
export function globeCacheControl(degraded: boolean, revalidateSeconds: number): string {
  // A degraded (outage) payload must not outlive the outage: keep it edge-cached
  // just long enough to shield a failing backend, with no stale serving, so
  // recovery and the client's Retry both reach live data quickly.
  return degraded
    ? 'public, s-maxage=15, stale-while-revalidate=0'
    : `public, s-maxage=${revalidateSeconds}, stale-while-revalidate=3600`
}

const REPORT_INTERVAL_MS = 60_000
let lastReportedAt = 0

/** Test hook: clears the per-instance throttle. */
export function resetGlobeDegradedReportThrottle() {
  lastReportedAt = 0
}

/**
 * Makes a served-but-degraded globe observable. The route answers 200 during a
 * backend outage, so 5xx-based alerting stays silent; this emits a structured
 * log every time and a throttled Sentry event (once per minute per instance).
 * Reporting must never break the response.
 */
export function reportGlobeDegraded(state: GlobeDegradation, now: number = Date.now()): void {
  const layers = [
    state.countriesUnavailable ? 'countries' : null,
    state.signalsUnavailable ? 'signals' : null,
  ].filter((layer): layer is string => layer !== null)
  if (layers.length === 0) return

  try {
    structuredLog('globe.degraded', { service: 'api-globe', layers }, 'error')
    if (now - lastReportedAt < REPORT_INTERVAL_MS) return
    lastReportedAt = now
    Sentry.captureMessage(`globe served degraded: ${layers.join('+')} unavailable`, {
      level: state.countriesUnavailable ? 'error' : 'warning',
      tags: { area: 'globe', degraded_layers: layers.join(',') },
      fingerprint: ['globe-degraded', layers.join('+')],
    })
  } catch {
    // Observability failure is not a user-facing failure.
  }
}

/** The 503 path: an unexpected failure that the 200-degraded path did not absorb. */
export function reportGlobeHardFailure(err: unknown): void {
  try {
    structuredLog('globe.hard_failure', { service: 'api-globe' }, 'error')
    Sentry.captureException(err, { tags: { area: 'globe', degraded_layers: 'all' } })
  } catch {
    // Observability failure is not a user-facing failure.
  }
}
