'use client'
/**
 * Command Centre entry — thin re-export (avoids monolith edit/push limits).
 * Impl: ./command-centre/CommandCentreRoot.tsx
 * Pages: ./command-centre/pages/bundle{A,B,C}.tsx
 * Nav:   ./command-centre/navConfig.ts
 * Types: ./command-centre/types.ts
 */
export type {
  CommandPage,
  MarketView,
  MarketRow,
  DashboardMarketplaceRows,
} from './command-centre/types'

export { default } from './command-centre/CommandCentreRoot'
