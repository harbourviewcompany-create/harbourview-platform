import { describe, it, expect } from 'vitest'
import {
  buildCommandDelta,
  describeFreshness,
  formatDeltaSentence,
  formatSinceLabel,
  isNewSince,
} from '@/lib/dashboard/commandDelta'

// Local-time construction throughout: the delta renders client-side in the
// reader's own timezone, so the calendar-day arithmetic is tested the same way.
const NOW = new Date(2026, 8, 16, 14, 0, 0).getTime() // Wed 16 Sep 2026, 14:00 local

function at(date: Date) {
  return date.toISOString()
}

describe('formatSinceLabel', () => {
  it('returns empty for a missing or unparseable stamp', () => {
    expect(formatSinceLabel(null, NOW)).toBe('')
    expect(formatSinceLabel(undefined, NOW)).toBe('')
    expect(formatSinceLabel('not a date', NOW)).toBe('')
  })

  it('refuses a stamp in the future rather than inventing a negative window', () => {
    expect(formatSinceLabel(at(new Date(2026, 8, 17, 9, 0, 0)), NOW)).toBe('')
  })

  it('names the same calendar day, yesterday, and a weekday inside a week', () => {
    expect(formatSinceLabel(at(new Date(2026, 8, 16, 8, 0, 0)), NOW)).toBe('Since earlier today')
    expect(formatSinceLabel(at(new Date(2026, 8, 15, 22, 0, 0)), NOW)).toBe('Since yesterday')
    expect(formatSinceLabel(at(new Date(2026, 8, 12, 9, 0, 0)), NOW)).toBe('Since Saturday')
  })

  it('switches to an explicit date once a weekday would be ambiguous', () => {
    // 7 days back is the same weekday as today; "Since Wednesday" would be unreadable.
    expect(formatSinceLabel(at(new Date(2026, 8, 9, 9, 0, 0)), NOW)).toBe('Since 9 Sep')
  })
})

describe('isNewSince', () => {
  const stamp = at(new Date(2026, 8, 15, 12, 0, 0))

  it('counts a signal newer than the stamp', () => {
    expect(isNewSince({ freshnessAt: at(new Date(2026, 8, 16, 7, 0, 0)) }, stamp)).toBe(true)
  })

  it('does not count one at or before the stamp', () => {
    expect(isNewSince({ freshnessAt: stamp }, stamp)).toBe(false)
    expect(isNewSince({ freshnessAt: at(new Date(2026, 8, 14, 7, 0, 0)) }, stamp)).toBe(false)
  })

  it('treats an unknown timestamp as not-new rather than assuming recency', () => {
    expect(isNewSince({}, stamp)).toBe(false)
    expect(isNewSince({ freshnessAt: 'nonsense' }, stamp)).toBe(false)
  })

  it('cannot call anything new when there is no stamp at all', () => {
    expect(isNewSince({ freshnessAt: at(new Date(2026, 8, 16, 7, 0, 0)) }, null)).toBe(false)
  })
})

describe('describeFreshness', () => {
  it('renders a real publication or event time plainly', () => {
    expect(describeFreshness({ timeAgo: '2 days ago', freshnessBasis: 'source_published' })).toBe('2 days ago')
    expect(describeFreshness({ timeAgo: '3h ago', freshnessBasis: 'event_effective' })).toBe('3h ago')
  })

  it('labels a pipeline-side timestamp as observed rather than published', () => {
    // Spec §3: most rows on this corpus carry batch-assigned timestamps, so
    // presenting these as publication times would be a confident falsehood.
    expect(describeFreshness({ timeAgo: '2 days ago', freshnessBasis: 'observed' })).toBe('Observed 2 days ago')
    expect(describeFreshness({ timeAgo: '2 days ago', freshnessBasis: 'ingested' })).toBe('Observed 2 days ago')
    expect(describeFreshness({ timeAgo: '2 days ago', freshnessBasis: 'legacy_date' })).toBe('Observed 2 days ago')
    expect(describeFreshness({ timeAgo: '2 days ago' })).toBe('Observed 2 days ago')
  })

  it('renders nothing when there is no age to show', () => {
    expect(describeFreshness({ freshnessBasis: 'source_published' })).toBe('')
    expect(describeFreshness({ timeAgo: '   ' })).toBe('')
  })
})

describe('buildCommandDelta', () => {
  const stamp = at(new Date(2026, 8, 15, 12, 0, 0))
  const newer = { freshnessAt: at(new Date(2026, 8, 16, 7, 0, 0)) }
  const older = { freshnessAt: at(new Date(2026, 8, 14, 7, 0, 0)) }

  it('reports first-visit when no stamp is stored, without claiming a delta', () => {
    const delta = buildCommandDelta({ signals: [newer], lastViewedAt: null, nowMs: NOW })
    expect(delta.state).toBe('first-visit')
    expect(delta.newSignals).toBe(0)
    expect(formatDeltaSentence(delta)).toBe('')
  })

  it('counts only signals newer than the stamp', () => {
    const delta = buildCommandDelta({ signals: [newer, older, newer], lastViewedAt: stamp, nowMs: NOW })
    expect(delta.state).toBe('changed')
    expect(delta.newSignals).toBe(2)
  })

  it('reports quiet honestly when a stamp exists and nothing is new', () => {
    const delta = buildCommandDelta({ signals: [older], lastViewedAt: stamp, nowMs: NOW })
    expect(delta.state).toBe('quiet')
    expect(formatDeltaSentence(delta)).toBe('Since yesterday: nothing new in this context')
  })

  it('treats a watch-rule hit alone as a change worth surfacing', () => {
    const delta = buildCommandDelta({ signals: [older], watchRuleHits: 1, lastViewedAt: stamp, nowMs: NOW })
    expect(delta.state).toBe('changed')
    expect(formatDeltaSentence(delta)).toBe('Since yesterday: 1 watch rule fired')
  })
})

describe('formatDeltaSentence', () => {
  const stamp = at(new Date(2026, 8, 15, 12, 0, 0))
  const newer = { freshnessAt: at(new Date(2026, 8, 16, 7, 0, 0)) }

  it('joins both counts and singularises each independently', () => {
    expect(formatDeltaSentence(buildCommandDelta({
      signals: [newer], watchRuleHits: 2, lastViewedAt: stamp, nowMs: NOW,
    }))).toBe('Since yesterday: 1 new signal · 2 watch rules fired')

    expect(formatDeltaSentence(buildCommandDelta({
      signals: [newer, newer], watchRuleHits: 1, lastViewedAt: stamp, nowMs: NOW,
    }))).toBe('Since yesterday: 2 new signals · 1 watch rule fired')
  })
})
