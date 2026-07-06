// tests/signals/digestCadence.test.ts
// Locks in the 2026-07-05 fix to app/api/cron/intelligence-notify/route.ts:
// the cron previously hardcoded frequency='daily' when fetching subscriptions,
// which silently excluded every 'weekly' subscription -- the only frequency
// value actually exercised via the live subscribe form -- from ever receiving
// a digest. signal_digest_log had zero rows across 4 real subscriptions and
// 2+ days of published digest content as a direct result.

import { describe, it, expect } from 'vitest'
import { isSubscriptionDue, lookbackHoursFor, WEEKLY_INTERVAL_MS } from '@/lib/signals/digestCadence'

describe('isSubscriptionDue', () => {
  it('daily subscribers are always due, regardless of last_sent_at', () => {
    expect(isSubscriptionDue({ frequency: 'daily', last_sent_at: null })).toBe(true)
    expect(isSubscriptionDue({ frequency: 'daily', last_sent_at: new Date().toISOString() })).toBe(true)
  })

  it('weekly subscribers with no last_sent_at are due (this was the exact bug -- these were being excluded entirely)', () => {
    expect(isSubscriptionDue({ frequency: 'weekly', last_sent_at: null })).toBe(true)
  })

  it('weekly subscribers sent less than ~6.5 days ago are not due', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    expect(isSubscriptionDue({ frequency: 'weekly', last_sent_at: twoDaysAgo })).toBe(false)
  })

  it('weekly subscribers sent more than ~6.5 days ago are due', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    expect(isSubscriptionDue({ frequency: 'weekly', last_sent_at: eightDaysAgo })).toBe(true)
  })

  it('respects the exact WEEKLY_INTERVAL_MS boundary', () => {
    const now = Date.now()
    const justUnder = new Date(now - (WEEKLY_INTERVAL_MS - 1000)).toISOString()
    const justOver  = new Date(now - (WEEKLY_INTERVAL_MS + 1000)).toISOString()
    expect(isSubscriptionDue({ frequency: 'weekly', last_sent_at: justUnder }, now)).toBe(false)
    expect(isSubscriptionDue({ frequency: 'weekly', last_sent_at: justOver }, now)).toBe(true)
  })

  it('treats an unrecognised frequency value as due (fail open, not silently excluded forever)', () => {
    expect(isSubscriptionDue({ frequency: 'monthly', last_sent_at: null })).toBe(true)
  })
})

describe('lookbackHoursFor', () => {
  it('uses the narrow daily window when no weekly subscriber is due', () => {
    const dueSubs = [{ frequency: 'daily', last_sent_at: null }]
    expect(lookbackHoursFor(dueSubs, 48)).toBe(48)
  })

  it('widens to at least 8 days when a weekly subscriber is due, so they see their full backlog', () => {
    const dueSubs = [
      { frequency: 'daily',  last_sent_at: null },
      { frequency: 'weekly', last_sent_at: null },
    ]
    expect(lookbackHoursFor(dueSubs, 48)).toBe(8 * 24)
  })

  it('never narrows below the daily lookback even if it is already wider than 8 days', () => {
    const dueSubs = [{ frequency: 'weekly', last_sent_at: null }]
    expect(lookbackHoursFor(dueSubs, 500)).toBe(500)
  })
})
