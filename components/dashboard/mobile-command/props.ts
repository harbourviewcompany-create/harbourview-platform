import type React from 'react'
import type CommandCentre from '../CommandCentre'
import type { MarketplaceMediaById } from '@/lib/dashboard/marketplaceMediaProjection'

/** Shared compile-time prop contract for desktop and rebuilt mobile shells. */
export type MobileCommandCentreProps = React.ComponentProps<typeof CommandCentre> & {
  /** Public-only marketplace media keyed by canonical listing UUID. */
  marketplaceMediaById?: MarketplaceMediaById
}
