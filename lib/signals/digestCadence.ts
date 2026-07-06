// lib/signals/digestCadence.ts
// Pure cadence/threshold logic for signal_subscriptions, extracted from
// app/api/cron/intelligence-notify/route.ts for unit testability.
//
// Two independent sessions found and fixed the same underlying problem on
// 2026-07-05: the cron hardcoded frequency='daily' when fetching
// subscriptions, silently excluding every 'weekly' subscription -- the only
// frequency value actually written by the live subscribe form -- from ever
// receiving a digest. signal_digest_log had zero rows despite 2+ days of
// published daily_digest content and 4 active real subscriptions.
//
// The version that landed also fixes an adjacent, previously-undetected bug:
// signal_subscriptions.min_confidence is stored on a 0-10 scale (the signup
// form's slider), but signals_for_digest.confidence is 0-100. Comparing them
// directly means the user's stated minimum was silently ignored (7 < 66
// always passes). CONFIDENCE_SCALE corrects this.

export const LOOKBACK_HOURS_DAILY       = 48       // daily subs: buffer against a slow upstream extraction run
export const LOOKBACK_HOURS_WEEKLY      = 8 * 24   // weekly subs: must cover the full week or 5/7 days get dropped
export const WEEKLY_MIN_INTERVAL_HOURS  = 6 * 24   // only send a weekly digest if >= 6 days since last
export const CONFIDENCE_SCALE           = 10       // signup slider (0-10) -> signal confidence scale (0-100)

export interface CadenceSubscription {
  frequency: string
  last_sent_at: string | null
}

/**
 * Is this subscription due to receive a digest right now?
 * - 'daily' subscribers are always due -- the cron itself IS their daily cadence.
 * - 'weekly' subscribers are due only once WEEKLY_MIN_INTERVAL_HOURS has
 *   passed since last_sent_at (or they've never been sent one).
 * - Any other/unrecognised frequency value is NOT due -- matches the actual
 *   route logic, which only ever processes 'daily' or 'weekly' (the only two
 *   values the subscribe form writes).
 */
export function isSubscriptionDue(sub: CadenceSubscription, now: number = Date.now()): boolean {
  if (sub.frequency === 'daily') return true
  if (sub.frequency === 'weekly') {
    if (!sub.last_sent_at) return true
    const hoursSince = (now - new Date(sub.last_sent_at).getTime()) / (60 * 60 * 1000)
    return hoursSince >= WEEKLY_MIN_INTERVAL_HOURS
  }
  return false
}

/**
 * The widest lookback needed across all subscribers due this run -- used to
 * size the single shared candidate-signal query. Per-subscriber filtering
 * (subscriberCutoffMs) then narrows back down so a daily subscriber never
 * sees a weekly subscriber's older backlog just because the query window
 * was widened to accommodate someone else.
 */
export function lookbackHoursFor(dueSubs: CadenceSubscription[]): number {
  const hasWeeklyDue = dueSubs.some(s => s.frequency === 'weekly')
  return hasWeeklyDue ? LOOKBACK_HOURS_WEEKLY : LOOKBACK_HOURS_DAILY
}

/** This subscriber's own cutoff timestamp (ms since epoch) for filtering candidate signals. */
export function subscriberCutoffMs(sub: CadenceSubscription, now: number = Date.now()): number {
  const hours = sub.frequency === 'weekly' ? LOOKBACK_HOURS_WEEKLY : LOOKBACK_HOURS_DAILY
  return now - hours * 60 * 60 * 1000
}

/** Scale a 0-10 stored min_confidence preference up to the 0-100 signal confidence scale. */
export function scaledMinConfidence(minConfidence: number | null | undefined): number {
  return (minConfidence ?? 0) * CONFIDENCE_SCALE
}
