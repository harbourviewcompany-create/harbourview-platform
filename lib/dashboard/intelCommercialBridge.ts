/**
 * Client-safe bridge: jurisdiction-matched signals → marketplace follow-ups.
 * Does not invent listings — only ranks already-loaded Command Centre rows.
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

/**
 * Pair jurisdiction-matched signals with marketplace rows in the same market.
 * Optional keyword overlap on title/summary strengthens the reason string.
 */
export function matchIntelCommercialFollowUps(
  signals: BridgeSignal[],
  listings: BridgeListing[],
  countryLabel: string,
  limit = 6,
): CommercialFollowUp[] {
  const country = norm(countryLabel)
  const contextualSignals = signals.filter(s => {
    const m = norm(s.market ?? '')
    return m && (m === country || m.includes(country) || country.includes(m))
  })
  if (contextualSignals.length === 0 || listings.length === 0) return []

  const followUps: CommercialFollowUp[] = []

  for (const signal of contextualSignals) {
    const market = signal.market ?? countryLabel
    const signalText = norm(
      [signal.title, signal.commercialImpact, signal.analysis?.what_changed].filter(Boolean).join(' '),
    )

    for (const listing of listings) {
      if (!jurisdictionOverlap(market, listing.jurisdiction || countryLabel)) continue

      const listingText = norm([listing.title, listing.summary, listing.category].filter(Boolean).join(' '))
      let reason = `Same jurisdiction as intel (${market})`
      // Light keyword intersection for a stronger reason — never required.
      const tokens = signalText.split(/[^a-z0-9]+/).filter(t => t.length > 4).slice(0, 12)
      const shared = tokens.filter(t => listingText.includes(t)).slice(0, 3)
      if (shared.length > 0) {
        reason = `Jurisdiction match · topic overlap: ${shared.join(', ')}`
      }

      followUps.push({
        signalId: signal.id || signal.title || 'signal',
        signalTitle: signal.title || 'Untitled signal',
        listingId: listing.id,
        listingTitle: listing.title,
        listingView: listing.view,
        jurisdiction: listing.jurisdiction || market,
        reason,
      })

      if (followUps.length >= limit) return followUps
    }
  }

  return followUps
}
