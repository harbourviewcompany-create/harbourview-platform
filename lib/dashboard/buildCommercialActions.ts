import type { NextAction, SectionId } from '@/components/dashboard/mobile-command/contracts'
import { matchIntelCommercialFollowUps, type BridgeListing, type BridgeSignal } from '@/lib/dashboard/intelCommercialBridge'

export type CommandHref = (section: SectionId, changes?: Record<string, string | null>) => string

export function buildCommercialNextActions(signals: BridgeSignal[], listings: BridgeListing[], countryLabel: string, commandHref: CommandHref, options: { limit?: number; roleId?: string | null } = {}): NextAction[] {
  return matchIntelCommercialFollowUps(signals, listings, countryLabel, { limit: options.limit ?? 4, roleId: options.roleId }).map(follow => ({
    id: `commercial-${follow.signalId}-${follow.listingId}`,
    label: `Review listing: ${follow.listingTitle}`.slice(0, 96),
    detail: `${follow.reason} · from intel “${follow.signalTitle.slice(0, 48)}”`,
    href: commandHref('marketplace', { marketView: follow.listingView }),
    tone: 'gold' as const,
  }))
}
