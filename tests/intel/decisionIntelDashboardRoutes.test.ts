import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: vi.fn(),
}))

import { applyDecisionIntelRouteRows } from '@/lib/intelligence-os/dashboardRoutes'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'

function signal(overrides: Partial<DashboardSignal> = {}): DashboardSignal {
  return {
    id: 'sig-a',
    title: 'Signal A',
    type: 'regulatory_change',
    market: 'Germany',
    tag: { label: 'REGULATION', color: '#fff', bg: '#000', border: '#333' },
    timeAgo: '1h ago',
    confidence: 80,
    commercialImpact: 'Relevant',
    sourceLabel: 'Harbourview Intelligence',
    contentType: 'signal',
    signalContentType: 'regulatory',
    ...overrides,
  }
}

describe('Decision Intel dashboard route policy', () => {
  it('uses a displayable canonical route', () => {
    const [row] = applyDecisionIntelRouteRows(
      [signal()],
      [{ signal_id: 'sig-a', event_id: 'event:sig-a', displayable: true }],
    )
    expect(row.decisionIntelEventId).toBe('event:sig-a')
  })

  it('suppresses a canonically owned but non-displayable event instead of falling back', () => {
    const [row] = applyDecisionIntelRouteRows(
      [signal()],
      [{ signal_id: 'sig-a', event_id: 'event:sig-a', displayable: false }],
    )
    expect(row.decisionIntelEventId).toBe('')
  })

  it('preserves legacy and IA compatibility when no canonical owner exists', () => {
    const [row] = applyDecisionIntelRouteRows([signal({ id: 'ia-1' })], [])
    expect(row.decisionIntelEventId).toBe('event:ia-1')
  })

  it('does not synthesize routes for story or editorial rows', () => {
    const rows = applyDecisionIntelRouteRows([
      signal({ id: 'story-1', signalContentType: 'story' }),
      signal({ id: 'news-1', contentType: 'editorial', signalContentType: null }),
    ], [])
    expect(rows[0].decisionIntelEventId).toBeUndefined()
    expect(rows[1].decisionIntelEventId).toBeUndefined()
  })

  it('preserves explicit eligibility for genuine Daily signal headlines only', () => {
    const rows = applyDecisionIntelRouteRows([
      signal({ id: 'digest-sig', sourceLabel: 'Harbourview Daily', decisionIntelEventId: 'event:digest-sig' }),
      signal({ id: 'digest-editorial', sourceLabel: 'Harbourview Daily', decisionIntelEventId: undefined }),
    ], [])
    expect(rows[0].decisionIntelEventId).toBe('event:digest-sig')
    expect(rows[1].decisionIntelEventId).toBeUndefined()
  })

  it('recognizes a regulatory mirror as canonical ownership', () => {
    const [row] = applyDecisionIntelRouteRows(
      [signal({ id: 'regulatory-native-id', decisionIntelEventId: 'event:regulatory-native-id' })],
      [{ signal_id: 'rs-regulatory-native-id', event_id: 'event:rs-regulatory-native-id', displayable: true }],
    )
    expect(row.decisionIntelEventId).toBe('event:rs-regulatory-native-id')
  })
})
