import { describe, expect, it } from 'vitest'
import {
  buildConfidenceLanes,
  overallConfidence,
  type ConfidenceInputs,
} from '@/lib/dashboard/confidenceScoring'

const empty: ConfidenceInputs = {}

describe('buildConfidenceLanes', () => {
  it('returns the five fixed lanes in order', () => {
    const lanes = buildConfidenceLanes(empty)
    expect(lanes.map((l) => l.key)).toEqual([
      'regulatory',
      'market',
      'pathway',
      'local',
      'education',
    ])
  })

  it('marks every lane unavailable with 0% when there is no data', () => {
    const lanes = buildConfidenceLanes(empty)
    for (const lane of lanes) {
      expect(lane.available).toBe(false)
      expect(lane.pct).toBe(0)
    }
    expect(overallConfidence(lanes)).toBe(0)
  })

  it('scores the regulatory lane from real source coverage, not a bucket', () => {
    const withCoverage = buildConfidenceLanes({
      sourceCoverage: [
        { source_type: 'regulator', tier: 1, count: 4 },
        { source_type: 'trade', tier: 2, count: 6 },
      ],
      countryIntel: { market_access_status: 'permitted' } as ConfidenceInputs['countryIntel'],
    })
    const reg = withCoverage.find((l) => l.key === 'regulatory')!
    expect(reg.available).toBe(true)
    expect(reg.pct).toBeGreaterThan(50)
    expect(reg.basis).toContain('registered source')
  })

  it('scores the pathway lane from template/steps/requirements', () => {
    const lanes = buildConfidenceLanes({
      pathwayData: {
        template: { id: 't', name: 'DE', total_steps: 5 },
        steps: [1, 2, 3, 4].map((n) => ({
          id: `s${n}`,
          step_number: n,
          title: `Step ${n}`,
          description: null,
          unlock_condition: 'none',
        })),
        requirements: [1, 2, 3, 4, 5, 6].map((n) => ({
          id: `r${n}`,
          step_id: 's1',
          title: `Req ${n}`,
          description: null,
          evidence_type: 'doc',
          is_required: true,
          sort_order: n,
        })),
        progress: null,
        requirementStatuses: [
          { requirement_id: 'r1', status: 'verified', submitted_at: null, reviewed_at: null },
        ],
      } as ConfidenceInputs['pathwayData'],
    })
    const pathway = lanes.find((l) => l.key === 'pathway')!
    expect(pathway.available).toBe(true)
    expect(pathway.pct).toBeGreaterThanOrEqual(90)
    expect(pathway.basis).toContain('verified')
  })

  it('treats a not_applicable local layer as answered, not missing', () => {
    const lanes = buildConfidenceLanes({
      localIntel: {
        coverageStatus: 'not_applicable',
        authorities: null,
        municipalities: [],
        constraints: [],
        routes: [],
        coverage: [],
        openQuestions: [],
      },
    })
    const local = lanes.find((l) => l.key === 'local')!
    expect(local.available).toBe(true)
    expect(local.basis).toContain('No subnational layer')
  })

  it('overall confidence averages only lanes that have data', () => {
    const lanes = buildConfidenceLanes({
      marketMetrics: [
        { metric_name: 'm', metric_value: 1, metric_unit: null, period_label: null, data_type: null, source_name: null },
      ],
      countryIntel: { opportunity_score: 80 } as ConfidenceInputs['countryIntel'],
    })
    const overall = overallConfidence(lanes)
    // only the market lane has data; overall must equal that lane, not be
    // diluted by the four empty lanes.
    const market = lanes.find((l) => l.key === 'market')!
    expect(market.available).toBe(true)
    expect(overall).toBe(market.pct)
  })

  it('attributes live signals to the active country by market label', () => {
    const base: ConfidenceInputs = {
      sourceCoverage: [{ source_type: 'regulator', tier: 1, count: 2 }],
      countryLabel: 'Germany',
      signals: [
        { market: 'Germany' } as ConfidenceInputs['signals'] extends (infer T)[] ? T : never,
        { market: 'Canada' } as ConfidenceInputs['signals'] extends (infer T)[] ? T : never,
      ],
    }
    const withSignal = buildConfidenceLanes(base).find((l) => l.key === 'regulatory')!
    const noSignal = buildConfidenceLanes({ ...base, countryLabel: 'Global Market' }).find(
      (l) => l.key === 'regulatory',
    )!
    expect(withSignal.pct).toBeGreaterThan(noSignal.pct)
    expect(withSignal.basis).toContain('live signal')
  })
})
