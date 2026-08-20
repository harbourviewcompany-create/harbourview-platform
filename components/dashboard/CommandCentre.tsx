'use client'
/**
 * Command Centre entry — thin re-export (avoids 650KB monolith edit limits).
 * Impl: ./command-centre/CommandCentreRoot.tsx
 * Nav:  ./command-centre/navConfig.ts
 * Types: ./command-centre/types.ts
 */
export type {
  CommandPage,
  MarketView,
  MarketRow,
  DashboardMarketplaceRows,
} from './command-centre/types'

export { default } from './command-centre/CommandCentreRoot'
