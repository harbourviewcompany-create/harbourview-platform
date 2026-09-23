/**
 * Fail-closed autonomy evaluator (stub).
 * Proposes autonomy_level / promotion_path / gate_scores for a signal candidate.
 * Never promotes and never bypasses classifier_validation.
 *
 * Spec: docs/SIGNALS_MAX_AUTOMATION_DESIGN.md §4–5
 */

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4

export type AutonomyPromotionPath = 'full_auto' | 'shadow' | 'human' | 'rejected'

export type AutonomyPolicyRow = {
  signal_class: string
  full_auto_min_confidence: number
  min_corroboration: number
  allowed_source_tiers: number[]
  requires_human: boolean
  gate_passed: boolean
}

export type AutonomyCandidate = {
  signalId: string
  signalClass?: string
  confidence?: number | null
  sourceTier?: number | null
  corroborationCount?: number | null
  classifierGatePassed?: boolean
  junkLikely?: boolean
}

export type AutonomyEvaluation = {
  signalId: string
  autonomy_level: AutonomyLevel
  promotion_path: AutonomyPromotionPath
  gate_scores: Record<string, number>
  reasons: string[]
  /** True only if policy allows Full Auto *and* mechanical gates pass. Still does not promote. */
  may_consider_full_auto: boolean
}

const DEFAULT_POLICY: AutonomyPolicyRow = {
  signal_class: 'default',
  full_auto_min_confidence: 0.95,
  min_corroboration: 1,
  allowed_source_tiers: [1],
  requires_human: true,
  gate_passed: false,
}

/**
 * Pure evaluation. Callers may persist scores onto signals; must not call promote.
 */
export function evaluateAutonomy(
  candidate: AutonomyCandidate,
  policy: AutonomyPolicyRow | null | undefined = DEFAULT_POLICY,
): AutonomyEvaluation {
  const p = policy ?? DEFAULT_POLICY
  const confidence = candidate.confidence ?? 0
  const sourceTier = candidate.sourceTier ?? 99
  const corroboration = candidate.corroborationCount ?? 0
  const classifierOk = candidate.classifierGatePassed === true
  const reasons: string[] = []
  const gate_scores: Record<string, number> = {
    confidence,
    source_tier: sourceTier,
    corroboration,
    classifier_gate: classifierOk ? 1 : 0,
    policy_gate_passed: p.gate_passed ? 1 : 0,
    requires_human: p.requires_human ? 1 : 0,
  }

  if (candidate.junkLikely) {
    reasons.push('junk_likely')
    return {
      signalId: candidate.signalId,
      autonomy_level: 0,
      promotion_path: 'rejected',
      gate_scores,
      reasons,
      may_consider_full_auto: false,
    }
  }

  if (!classifierOk) {
    reasons.push('classifier_validation_not_passed')
  }
  if (p.requires_human || !p.gate_passed) {
    reasons.push('policy_requires_human_or_gate_closed')
  }
  if (confidence < p.full_auto_min_confidence) {
    reasons.push('confidence_below_policy')
  }
  if (corroboration < p.min_corroboration) {
    reasons.push('corroboration_below_policy')
  }
  if (!p.allowed_source_tiers.includes(sourceTier)) {
    reasons.push('source_tier_not_allowed')
  }

  const may_consider_full_auto =
    classifierOk &&
    !p.requires_human &&
    p.gate_passed &&
    confidence >= p.full_auto_min_confidence &&
    corroboration >= p.min_corroboration &&
    p.allowed_source_tiers.includes(sourceTier)

  if (may_consider_full_auto) {
    reasons.push('eligible_full_auto_pending_promote_rpc')
    return {
      signalId: candidate.signalId,
      autonomy_level: 1,
      promotion_path: 'full_auto',
      gate_scores,
      reasons,
      may_consider_full_auto: true,
    }
  }

  // Default: hold for human / exception path
  reasons.push('default_exception')
  return {
    signalId: candidate.signalId,
    autonomy_level: 3,
    promotion_path: 'human',
    gate_scores,
    reasons,
    may_consider_full_auto: false,
  }
}
