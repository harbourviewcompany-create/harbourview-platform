export type RelationshipProfile = {
  counterparty_name: string
  preferred_markets?: string[]
  relationship_strength_score?: number
  reliability_score?: number
  responsiveness_score?: number
  execution_score?: number
  successful_introductions_count?: number
  failed_introductions_count?: number
  repeat_counterparty_count?: number
  preferred_operator?: string
}

export function calculateRelationshipStrength(profile: RelationshipProfile) {
  const strength =
    (profile.relationship_strength_score || 0) * 0.35 +
    (profile.reliability_score || 0) * 0.25 +
    (profile.execution_score || 0) * 0.2 +
    (profile.responsiveness_score || 0) * 0.1 +
    Math.min((profile.successful_introductions_count || 0) * 2, 10)

  return Math.round(Math.min(strength, 100))
}

export function reliabilityBand(score: number) {
  if (score >= 85) return 'institutional'
  if (score >= 70) return 'trusted'
  if (score >= 50) return 'review_required'
  return 'high_risk'
}

export function recommendOperator(args: {
  market?: string
  profiles: RelationshipProfile[]
}) {
  const matches = args.profiles.filter((profile) =>
    (profile.preferred_markets || []).includes(args.market || '')
  )

  const sorted = [...matches].sort((a, b) =>
    calculateRelationshipStrength(b) - calculateRelationshipStrength(a)
  )

  return sorted[0]?.preferred_operator || null
}

export function topRelationshipProfiles(profiles: RelationshipProfile[]) {
  return [...profiles]
    .sort((a, b) => calculateRelationshipStrength(b) - calculateRelationshipStrength(a))
    .slice(0, 10)
}

export function repeatCounterpartyProfiles(profiles: RelationshipProfile[]) {
  return profiles
    .filter((profile) => (profile.repeat_counterparty_count || 0) > 1)
    .sort((a, b) =>
      (b.repeat_counterparty_count || 0) - (a.repeat_counterparty_count || 0)
    )
}
