import type { NextAction } from '@/components/dashboard/mobile-command/contracts'
import { matchIntelCommercialFollowUps, type BridgeListing, type BridgeSignal } from '@/lib/dashboard/intelCommercialBridge'

/**
 * Turn jurisdiction-matched signal × listing pairs into operator queue items.
 */
export function buildCommercialNextActions(
  signals: BridgeSignal[],
  listings: BridgeListing[],
  countryLabel: string,
  commandHref: (section: string, changes?: Record<string, string | null>) => string,
  limit = 4,
): NextAction[] {
  const followUps = matchIntelCommercialFollowUps(signals, listings, countryLabel, limit)
  return followUps.map(follow => ({
    id: `commercial-${follow.signalId}-${follow.listingId}`,
    label: `Review listing: ${follow.listingTitle}`.slice(0, 96),
    detail: `${follow.reason} · from intel “${follow.signalTitle.slice(0, 48)}”`,
    href: commandHref('marketplace', { marketView: follow.listingView }),
    tone: 'gold' as const,
  }))
}
