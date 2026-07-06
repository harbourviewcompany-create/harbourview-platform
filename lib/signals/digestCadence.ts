// lib/signals/digestCadence.ts
// Pure cadence logic for signal_subscriptions, shared by
// app/api/cron/intelligence-notify/route.ts.
//
// Extracted so the due-check (the exact logic that was broken until
// 2026-07-05 -- the cron hardcoded frequency='daily' and silently excluded
// every 'weekly' subscription) is unit-testable in isolation.

export const WEEKLY_INTERVAL_MS = 6.5 * 24 * 60 * 60 * 1000 // slightly under 7 days so a fixed daily cron time doesn't drift past the week mark

export interface CadenceSubscription {
  frequency: string
  last_sent_at: string | null
}

/**
 * Is this subscription due to receive a digest right now?
 * - 'daily' subscribers are always due -- the cron itself IS their daily cadence.
 * - 'weekly' subscribers are due only once at least WEEKLY_INTERVAL_MS has
 *   passed since last_sent_at (or they've never been sent one).
 * - Any other/unrecognised frequency value is treated as due, matching the
 *   pre-fix default behaviour for 'daily' (fail open rather than silently
 *   excluding a subscriber forever because of a typo'd frequency value).
 */
export function isSubscriptionDue(sub: CadenceSubscription, now: number = Date.now()): boolean {
  if (sub.frequency !== 'weekly') return true
  if (!sub.last_sent_at) return true
  return now - new Date(sub.last_sent_at).getTime() >= WEEKLY_INTERVAL_MS
}

/**
 * How far back should the candidate-signal query look, given the set of
 * subscriptions actually due this run? Daily-only runs use the narrow
 * LOOKBACK_HOURS window (just a buffer against a slow upstream extraction
 * run); if any weekly subscriber is due, the window must widen to cover
 * their full un-sent backlog (~8 days) or they'd only ever see the last
 * couple of days despite a week having passed since their last digest.
 */
export function lookbackHoursFor(dueSubs: CadenceSubscription[], dailyLookbackHours: number): number {
  const hasWeeklyDue = dueSubs.some(s => s.frequency === 'weekly')
  return hasWeeklyDue ? Math.max(dailyLookbackHours, 8 * 24) : dailyLookbackHours
}
