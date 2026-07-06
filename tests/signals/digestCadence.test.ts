// tests/signals/digestCadence.test.ts
// Locks in the 2026-07-05 fix to app/api/cron/intelligence-notify/route.ts:
// the cron previously hardcoded frequency='daily' when fetching subscriptions,
// which silently excluded every 'weekly' subscription -- the only frequency
// value actually exercised via the live subscribe form -- from ever receiving
// a digest. signal_digest_log had zero rows across 4 real subscriptions and
// 2+ days of published digest content as a direct result.
//
// Also locks in an adjacent bug in the same fix: min_confidence is stored
// 0-10 (signup slider) but compared against a 0-100 confidence scale.

import { describe, it, expect } from 'vitest'
import {
  isSubscriptionDue,
  lookbackHoursFor,
  subscriberCutoffMs,
  scaledMinConfidence,
  LOOKBACK_HOURS_DAILY,
  LOOKBACK_HOURS_WEEKLY,
  WEEKLY_MIN_INTERVAL_HOURS,
} from '@/lib/signals/digestCadence'

describe('isSubscriptionDue', () => {
  it('daily subscribers are always due, regardless of last_sent_at', () => {
    expect(isSubscriptionDue({ frequency: 'daily', last_sent_at: null })).toBe(true)
    expect(isSubscriptionDue({ frequency: 'daily', last_sent_at: new Date().toISOString() })).toBe(true)
  })

  it('weekly subscribers with no last_sent_at are due (this was the exact bug -- these were being excluded entirely)', () => {
    expect(isSubscriptionDue({ frequency: 'weekly', last_sent_at: null })).toBe(true)
  })

  it('weekly subscribers sent less than 6 days ago are not due', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    expect(isSubscriptionDue({ frequency: 'weekly', last_sent_at: twoDaysAgo })).toBe(false)
  })

  it('weekly subscribers sent more than 6 days ago are due', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    expect(isSubscriptionDue({ frequency: 'weekly', last_sent_at: eightDaysAgo })).toBe(true)
  })

  it('respects the exact WEEKLY_MIN_INTERVAL_HOURS boundary', () => {
    const now = Date.now()
    const intervalMs = WEEKLY_MIN_INTERVAL_HOURS * 60 * 60 * 1000
    const justUnder = new Date(now - (intervalMs - 60_000)).toISOString()
    const justOver  = new Date(now - (intervalMs + 60_000)).toISOString()
    expect(isSubscriptionDue({ frequency: 'weekly', last_sent_at: justUnder }, now)).toBe(false)
    expect(isSubscriptionDue({ frequency: 'weekly', last_sent_at: justOver }, now)).toBe(true)
  })

  it('an unrecognised frequency value is not due (route only ever writes daily/weekly)', () => {
    expect(isSubscriptionDue({ frequency: 'monthly', last_sent_at: null })).toBe(false)
  })
})

describe('lookbackHoursFor', () => {
  it('uses the narrow daily window when no weekly subscriber is due', () => {
    expect(lookbackHoursFor([{ frequency: 'daily', last_sent_at: null }])).toBe(LOOKBACK_HOURS_DAILY)
  })

  it('widens to the full weekly window when any weekly subscriber is due', () => {
    const dueSubs = [
      { frequency: 'daily',  last_sent_at: null },
      { frequency: 'weekly', last_sent_at: null },
    ]
    expect(lookbackHoursFor(dueSubs)).toBe(LOOKBACK_HOURS_WEEKLY)
  })
})

describe('subscriberCutoffMs', () => {
  it('daily subscribers get a 48h cutoff even when the shared query window was widened for others', () => {
    const now = Date.now()
    const cutoff = subscriberCutoffMs({ frequency: 'daily', last_sent_at: null }, now)
    expect(now - cutoff).toBe(LOOKBACK_HOURS_DAILY * 60 * 60 * 1000)
  })

  it('weekly subscribers get the full 8-day cutoff', () => {
    const now = Date.now()
    const cutoff = subscriberCutoffMs({ frequency: 'weekly', last_sent_at: null }, now)
    expect(now - cutoff).toBe(LOOKBACK_HOURS_WEEKLY * 60 * 60 * 1000)
  })
})

describe('scaledMinConfidence', () => {
  it('scales a 0-10 stored preference up to the 0-100 signal confidence scale', () => {
    expect(scaledMinConfidence(7)).toBe(70)
  })

  it('treats null/undefined as no minimum', () => {
    expect(scaledMinConfidence(null)).toBe(0)
    expect(scaledMinConfidence(undefined)).toBe(0)
  })

  it('demonstrates the exact bug this fixes: a stored preference of 7 must not silently accept everything', () => {
    const storedPreference = 7
    const typicalSignalConfidence = 45
    // Before the fix: 45 < 7 is false, so the "minimum" of 7 never filtered anything out.
    expect(typicalSignalConfidence < storedPreference).toBe(false)
    // After the fix: 45 < 70 is true, so a signal below the user's actual stated minimum is correctly excluded.
    expect(typicalSignalConfidence < scaledMinConfidence(storedPreference)).toBe(true)
  })
})
