/**
 * Client-safe bridge: jurisdiction-matched signals → marketplace follow-ups.
 * Does not invent listings — only ranks already-loaded Command Centre rows.
 *
 * Ranking is deliberate:
 * 1. Same jurisdiction is required
 * 2. Topic token overlap strengthens score
 * 3. Role bias prefers commercially relevant listing views (importer → supply/wanted)
 * 4. recommended_action on the signal is surfaced in the reason when present
 */

export type BridgeSignal = {
  id?: string
  title?: string
  market?: string
  commercialImpact?: string
  analysis?: { recommended_action?: string; what_changed?: string }
}

export type BridgeListing = {
  id: string
  title: string
  jurisdiction: string
  category: string
  view: string
  summary?: string
}

export type CommercialFollowUp = {
  signalId: string
  signalTitle: string
  listingId: string
  listingTitle: string
  listingView: string
  jurisdiction: string
  reason: string
  score: number
}

/** Role → preferred marketplace views (higher index = lower preference still > 0). */
const ROLE_VIEW_BIAS: Record<string, string[]> = {
  importer: ['cannabis', 'wanted', 'extracts', 'services'],
  exporter: ['wanted', 'cannabis', 'extracts'],
  cultivator_producer: ['wanted', 'genetics', 'cannabis'],
  processor_extractor: ['cannabis', 'wanted', 'services'],
  distributor_wholesaler: ['cannabis', 'wanted', 'services'],
  investor_operator: ['opportunities', 'wanted', 'cannabis'],
  retail_operator: ['cannabis', 'wanted'],
  clinic_healthcare_operator: ['services', 'cannabis'],
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

function jurisdictionOverlap(signalMarket: string, listingJurisdiction: string): boolean {
  const a = norm(signalMarket)
  const b = norm(listingJurisdiction)
  if (!a || !b) return false
  if (a === b) return true
  if (a.includes(b) || b.includes(a)) return true
  return false
}

function roleViewScore(roleId: string | null | undefined, view: string): number {
  if (!roleId) return 0
  const preferred = ROLE_VIEW_BIAS[roleId]
  if (!preferred) return 0
  const idx = preferred.indexOf(view)
  if (idx < 0) return 0
  return Math.max(0, 24 - idx * 6)
}

function topicTokens(text: string): string[] {
  return text
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 4)
    .filter(t => !['germany', 'canada', 'australia', 'market', 'signal', 'review'].includes(t))
    .slice(0, 16)
}

/**
 * Pair jurisdiction-matched signals with marketplace rows in the same market.
 * Returns deduped, score-sorted follow-ups (one row per listing).
 */
export function matchIntelCommercialFollowUps(
  signals: BridgeSignal[],
  listings: BridgeListing[],
  countryLabel: string,
  options: { limit?: number; roleId?: string | null } = {},
): CommercialFollowUp[] {
  const limit = options.limit ?? 6
  const roleId = options.roleId ?? null
  const country = norm(countryLabel)
  const contextualSignals = signals.filter(s => {
    const m = norm(s.market ?? '')
    return m && (m === country || m.includes(country) || country.includes(m))
  })
  if (contextualSignals.length === 0 || listings.length === 0) return []

  const byListing = new Map<string, CommercialFollowUp>()

  for (const signal of contextualSignals) {
    const market = signal.market ?? countryLabel
    const signalText = norm(
      [signal.title, signal.commercialImpact, signal.analysis?.what_changed, signal.analysis?.recommended_action]
        .filter(Boolean)
        .join(' '),
    )
    const tokens = topicTokens(signalText)
    const recommended = signal.analysis?.recommended_action?.trim()

    for (const listing of listings) {
      if (!jurisdictionOverlap(market, listing.jurisdiction || countryLabel)) continue

      const listingText = norm([listing.title, listing.summary, listing.category].filter(Boolean).join(' '))
      const shared = tokens.filter(t => listingText.includes(t)).slice(0, 4)

      let score = 50 // base jurisdiction match
      score += shared.length * 12
      score += roleViewScore(roleId, listing.view)
      if (recommended) score += 8

      const reasonParts: string[] = [`Same jurisdiction as intel (${market})`]
      if (shared.length > 0) reasonParts.push(`topic: ${shared.join(', ')}`)
      if (recommended) reasonParts.push(`action: ${recommended.slice(0, 80)}`)

      const candidate: CommercialFollowUp = {
        signalId: signal.id || signal.title || 'signal',
        signalTitle: signal.title || 'Untitled signal',
        listingId: listing.id,
        listingTitle: listing.title,
        listingView: listing.view,
        jurisdiction: listing.jurisdiction || market,
        reason: reasonParts.join(' · '),
        score,
      }

      const existing = byListing.get(listing.id)
      if (!existing || candidate.score > existing.score) {
        byListing.set(listing.id, candidate)
      }
    }
  }

  return [...byListing.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
