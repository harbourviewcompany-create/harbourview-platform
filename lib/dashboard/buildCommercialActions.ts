import type { NextAction } from '@/components/dashboard/mobile-command/contracts'
import { matchIntelCommercialFollowUps, type BridgeListing, type BridgeSignal } from '@/lib/dashboard/intelCommercialBridge'

/**
 * Turn jurisdiction-matched signal × listing pairs into operator queue items.
 * Role bias prefers commercially relevant listing views (e.g. importer → cannabis/wanted).
 */
export function buildCommercialNextActions(
  signals: BridgeSignal[],
  listings: BridgeListing[],
  countryLabel: string,
  commandHref: (section: string, changes?: Record<string, string | null>) => string,
  options: { limit?: number; roleId?: string | null } = {},
): NextAction[] {
  const followUps = matchIntelCommercialFollowUps(signals, listings, countryLabel, {
    limit: options.limit ?? 4,
    roleId: options.roleId,
  })
  return followUps.map(follow => ({
    id: `commercial-${follow.signalId}-${follow.listingId}`,
    label: `Review listing: ${follow.listingTitle}`.slice(0, 96),
    detail: `${follow.reason} · from intel “${follow.signalTitle.slice(0, 48)}”`,
    href: commandHref('marketplace', { marketView: follow.listingView }),
    tone: 'gold' as const,
  }))
}
