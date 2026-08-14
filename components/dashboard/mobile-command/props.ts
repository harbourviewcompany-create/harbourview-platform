import type React from 'react'
import type CommandCentre from '../CommandCentre'
import type { MarketplaceMediaById } from '@/lib/dashboard/marketplaceMediaProjection'
import type { CommandCentreSourceMeta } from '@/lib/dashboard/commandCentreDataTypes'

export type GeneticsSourceMeta = {
  cultivarPassports?: CommandCentreSourceMeta
  serviceProviders?: CommandCentreSourceMeta
  collaborationProjects?: CommandCentreSourceMeta
}

/** Shared compile-time prop contract for desktop and rebuilt mobile shells. */
export type MobileCommandCentreProps = React.ComponentProps<typeof CommandCentre> & {
  /** Public-only marketplace media keyed by canonical listing UUID. */
  marketplaceMediaById?: MarketplaceMediaById
  /** Source-state metadata for the public Genetics projections used by Mobile Command. */
  geneticsSourceMeta?: GeneticsSourceMeta
}
