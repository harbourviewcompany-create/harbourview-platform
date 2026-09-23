import { describe, expect, it } from 'vitest'
import { evaluateAutonomy, type AutonomyPolicyRow } from '@/lib/signals/autonomyEvaluate'

const closedPolicy: AutonomyPolicyRow = {
  signal_class: 'tier1_regulatory',
  full_auto_min_confidence: 0.9,
  min_corroboration: 1,
  allowed_source_tiers: [1],
  requires_human: true,
  gate_passed: false,
}

const openPolicy: AutonomyPolicyRow = {
  ...closedPolicy,
  requires_human: false,
  gate_passed: true,
}

describe('evaluateAutonomy', () => {
  it('defaults to exception when policy requires human', () => {
    const result = evaluateAutonomy(
      {
        signalId: 's1',
        confidence: 0.99,
        sourceTier: 1,
        corroborationCount: 2,
        classifierGatePassed: true,
      },
      closedPolicy,
    )
    expect(result.autonomy_level).toBe(3)
    expect(result.promotion_path).toBe('human')
    expect(result.may_consider_full_auto).toBe(false)
  })

  it('rejects junk candidates', () => {
    const result = evaluateAutonomy(
      { signalId: 's2', junkLikely: true, classifierGatePassed: true },
      openPolicy,
    )
    expect(result.autonomy_level).toBe(0)
    expect(result.promotion_path).toBe('rejected')
  })

  it('marks full auto only when all mechanical gates pass', () => {
    const result = evaluateAutonomy(
      {
        signalId: 's3',
        confidence: 0.95,
        sourceTier: 1,
        corroborationCount: 1,
        classifierGatePassed: true,
      },
      openPolicy,
    )
    expect(result.may_consider_full_auto).toBe(true)
    expect(result.autonomy_level).toBe(1)
    expect(result.promotion_path).toBe('full_auto')
  })

  it('blocks full auto without classifier gate', () => {
    const result = evaluateAutonomy(
      {
        signalId: 's4',
        confidence: 0.99,
        sourceTier: 1,
        corroborationCount: 3,
        classifierGatePassed: false,
      },
      openPolicy,
    )
    expect(result.may_consider_full_auto).toBe(false)
    expect(result.reasons).toContain('classifier_validation_not_passed')
  })
})
