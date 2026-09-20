export type IntelligenceObject = {
  id: string
  market: { iso2: string; name: string }
  category: string
  headline: string
  relevance: number | null
  observedAt: string
  source: string | null
  evidence: { key: string | null; verifiedAt: string | null; expiresAt: string | null }
  implication: string
  recommendedAction: string
}

export function buildSignalIntelligence(signal: {
  id: string
  headline: string
  score: number | null
  cat: string | null
  createdAt: string
  countryIso2: string | null
}, market: { iso2: string; name: string }): IntelligenceObject {
  const category = (signal.cat ?? 'market').trim() || 'market'
  const normalized = category.toLowerCase()
  const implication = normalized.includes('regulat')
    ? 'This signal may affect the market access or compliance picture; inspect the underlying change before acting.'
    : normalized.includes('trade') || normalized.includes('market')
      ? 'This signal may affect commercial conditions or corridor activity; review the detail before committing resources.'
      : 'This signal changes the market information picture; review the underlying detail before treating it as actionable.'

  return {
    id: signal.id,
    market,
    category,
    headline: signal.headline,
    relevance: signal.score,
    observedAt: signal.createdAt,
    source: null,
    evidence: { key: null, verifiedAt: null, expiresAt: null },
    implication,
    recommendedAction: 'Open intelligence and review the evidence before taking action.',
  }
}
