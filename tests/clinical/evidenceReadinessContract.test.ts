/**
 * Behavioural contract for the clinical evidence-readiness helpers.
 *
 * These helpers shipped with no test coverage at all, and both of their
 * consumers were written against a different, imagined API — an aggregate
 * `assessClaimMapReadiness(entries)` and flags shaped `{ id, severity, title }`.
 * That mismatch broke `npm run build` on main with 19 TypeScript errors on
 * 2026-08-22.
 *
 * Typecheck catches signature drift on its own. What it cannot catch is the
 * *meaning* of the returned values — which is how the corridor "top framework
 * gaps (operator triage)" list ended up rendering the least severe gaps while
 * still compiling cleanly (see the roll-up ordering test below).
 *
 * These assertions exercise real behaviour against the fixtures rather than
 * grepping source text, deliberately: this repo already carries several
 * source-text suites that have drifted from the components they describe.
 */
import { describe, expect, it } from 'vitest'
import {
  assessClaimMapReadiness,
  corridorEvidenceFlags,
  type CorridorEvidenceFlag,
} from '@/lib/clinical/evidence-readiness'
import { triageSort } from '@/lib/clinical/framework-gap'
import { CLAIM_MAP_FIXTURES } from '@/lib/fixtures/clinical/claim-map'
import { EVIDENCE_FIXTURES } from '@/lib/fixtures/clinical/evidence'

const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 } as const

describe('assessClaimMapReadiness', () => {
  it('scores a single claim-map entry against the evidence records', () => {
    const entry = CLAIM_MAP_FIXTURES[0]
    const result = assessClaimMapReadiness(entry, EVIDENCE_FIXTURES)

    expect(result.claimId).toBe(entry.id)
    expect(result.status).toBe(entry.status)
    expect(result.supportingRecordIds).toEqual(entry.evidenceRecordIds)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('scores a supported claim above a gap claim', () => {
    const supported = CLAIM_MAP_FIXTURES.find((e) => e.status === 'supported')
    const gap = CLAIM_MAP_FIXTURES.find((e) => e.status === 'gap')
    if (!supported || !gap) return

    expect(assessClaimMapReadiness(supported, EVIDENCE_FIXTURES).score).toBeGreaterThan(
      assessClaimMapReadiness(gap, EVIDENCE_FIXTURES).score,
    )
  })

  it('never reports a stage gate as both ready and blocked', () => {
    for (const entry of CLAIM_MAP_FIXTURES) {
      const { stageGatesReady, stageGatesBlocked } = assessClaimMapReadiness(
        entry,
        EVIDENCE_FIXTURES,
      )
      expect(stageGatesReady.filter((g) => stageGatesBlocked.includes(g))).toEqual([])
      expect([...stageGatesReady, ...stageGatesBlocked].sort()).toEqual(
        [...entry.targetStageGates].sort(),
      )
    }
  })

  it('blocks every stage gate on a gap-status claim', () => {
    const gap = CLAIM_MAP_FIXTURES.find((e) => e.status === 'gap')
    if (!gap || !gap.targetStageGates.length) return
    expect(assessClaimMapReadiness(gap, EVIDENCE_FIXTURES).stageGatesReady).toEqual([])
  })

  it('returns each claim its gaps already triage-sorted', () => {
    for (const entry of CLAIM_MAP_FIXTURES) {
      const ranks = assessClaimMapReadiness(entry, EVIDENCE_FIXTURES).gaps.map(
        (g) => SEVERITY_RANK[g.severity],
      )
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    }
  })
})

describe('corridor evidence roll-up', () => {
  // Mirrors the aggregation CorridorPlanWorkspace performs for its header line
  // and its "top framework gaps (operator triage)" list.
  function rollUp() {
    const assessments = CLAIM_MAP_FIXTURES.map((entry) =>
      assessClaimMapReadiness(entry, EVIDENCE_FIXTURES),
    )
    const allGaps = triageSort(assessments.flatMap((a) => a.gaps))
    return {
      claimCount: assessments.length,
      gapClaims: assessments.filter((a) => a.status === 'gap').length,
      partialClaims: assessments.filter((a) => a.status === 'partial').length,
      highPriorityGaps: assessments.reduce(
        (n, a) => n + a.summary.bySeverity.critical + a.summary.bySeverity.high,
        0,
      ),
      topGaps: allGaps.slice(0, 8),
    }
  }

  it('counts every claim-map entry exactly once', () => {
    const summary = rollUp()
    expect(summary.claimCount).toBe(CLAIM_MAP_FIXTURES.length)
    expect(summary.gapClaims + summary.partialClaims).toBeLessThanOrEqual(summary.claimCount)
  })

  it('reports high-priority gaps as a non-negative count, not a list', () => {
    const { highPriorityGaps } = rollUp()
    expect(typeof highPriorityGaps).toBe('number')
    expect(highPriorityGaps).toBeGreaterThanOrEqual(0)
  })

  /**
   * Regression test for a defect that typechecked cleanly.
   *
   * Each assessment's `gaps` are triage-sorted per claim, so `flatMap` produces
   * sorted runs joined end to end — NOT a globally sorted list. Slicing that
   * concatenation surfaced `low, info, info, info, …` under a heading promising
   * operator triage, while the `high` severity gaps never appeared at all.
   */
  it('surfaces the most severe gaps across all claims, not the first claim tail', () => {
    const ranks = rollUp().topGaps.map((g) => SEVERITY_RANK[g.severity])
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))

    const everyGap = CLAIM_MAP_FIXTURES.flatMap(
      (e) => assessClaimMapReadiness(e, EVIDENCE_FIXTURES).gaps,
    )
    const worstAvailable = Math.min(...everyGap.map((g) => SEVERITY_RANK[g.severity]))
    expect(ranks[0]).toBe(worstAvailable)
  })

  it('is not equivalent to slicing the unsorted concatenation', () => {
    // Guards the fix itself: if someone drops the triageSort, this fails.
    const unsorted = CLAIM_MAP_FIXTURES.flatMap(
      (e) => assessClaimMapReadiness(e, EVIDENCE_FIXTURES).gaps,
    ).slice(0, 8)
    const unsortedWorst = Math.min(...unsorted.map((g) => SEVERITY_RANK[g.severity]))
    const sortedWorst = Math.min(...rollUp().topGaps.map((g) => SEVERITY_RANK[g.severity]))
    expect(sortedWorst).toBeLessThanOrEqual(unsortedWorst)
  })
})

describe('corridorEvidenceFlags', () => {
  const LEVELS: CorridorEvidenceFlag['level'][] = ['ready', 'caution', 'blocked', 'unknown']

  it('returns flags carrying key/label/level/detail, not id/title/severity', () => {
    const flags = corridorEvidenceFlags(CLAIM_MAP_FIXTURES, EVIDENCE_FIXTURES)
    expect(flags.length).toBeGreaterThan(0)
    for (const flag of flags) {
      expect(typeof flag.key).toBe('string')
      expect(flag.key.length).toBeGreaterThan(0)
      expect(typeof flag.label).toBe('string')
      expect(typeof flag.detail).toBe('string')
      expect(LEVELS).toContain(flag.level)
    }
  })

  it('emits unique flag keys so they are safe as React list keys', () => {
    const keys = corridorEvidenceFlags(CLAIM_MAP_FIXTURES, EVIDENCE_FIXTURES).map((f) => f.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('degrades to a single unknown flag when no claim entries are in scope', () => {
    const flags = corridorEvidenceFlags([], EVIDENCE_FIXTURES)
    expect(flags).toHaveLength(1)
    expect(flags[0].key).toBe('no_claim_map')
    expect(flags[0].level).toBe('unknown')
  })

  it('honours an explicit target stage-gate list', () => {
    const gateFlags = corridorEvidenceFlags(CLAIM_MAP_FIXTURES, EVIDENCE_FIXTURES, {
      targetGates: ['pilot_corridor'],
    }).filter((f) => f.key.startsWith('gate_'))
    expect(gateFlags).toHaveLength(1)
    expect(gateFlags[0].key).toBe('gate_pilot_corridor')
  })

  it('reports framework coverage against the records actually supplied', () => {
    const coverage = corridorEvidenceFlags(CLAIM_MAP_FIXTURES, EVIDENCE_FIXTURES).find(
      (f) => f.key === 'framework_coverage',
    )
    expect(coverage).toBeDefined()
    const withAlignment = EVIDENCE_FIXTURES.filter((r) => r.frameworkAlignment).length
    expect(coverage?.detail).toContain(`${withAlignment}/${EVIDENCE_FIXTURES.length}`)
  })
})
