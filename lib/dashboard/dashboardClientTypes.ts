import type { GlobeLayerId, GlobeRouterMode, IntentId, RoleId } from '@/types/globe-router'

export type DashboardProductArea = 'marketplace' | 'intelligence' | 'education' | 'signals' | 'sources' | 'requests' | 'saved' | 'preferences'
export type DashboardPreferenceField = 'countryIso2' | 'countries' | 'roleId' | 'intentId' | 'mode' | 'source' | 'layerId' | 'marketplaceTab' | 'notificationPanelOpen'

export type DashboardClientRouteContext = {
  source?: 'globe_router'
  mode?: GlobeRouterMode
  countryIso2?: string
  countries: string[]
  roleId?: RoleId
  intentId?: IntentId
  layerId?: GlobeLayerId
}

export type DashboardClientPreferences = Partial<{
  countryIso2: string
  countries: string[]
  roleId: RoleId
  intentId: IntentId
  mode: GlobeRouterMode
  source: 'globe_router'
  layerId: GlobeLayerId
  marketplaceTab: string
  notificationPanelOpen: boolean
}>

export const dashboardPreferenceWhitelist = [
  'countryIso2',
  'countries',
  'roleId',
  'intentId',
  'mode',
  'source',
  'layerId',
  'marketplaceTab',
  'notificationPanelOpen',
] as const satisfies readonly DashboardPreferenceField[]

export const dashboardProductAreas: Array<{ id: DashboardProductArea; label: string; summary: string }> = [
  { id: 'marketplace', label: 'Marketplace', summary: 'Reviewed listings, quote paths and commercial routing.' },
  { id: 'intelligence', label: 'Intelligence', summary: 'Country drill-downs, market posture and regulatory orientation.' },
  { id: 'education', label: 'Education', summary: 'Role-aware professional education and safety context.' },
  { id: 'signals', label: 'Signals', summary: 'Public-safe signal summaries and next review cadence.' },
  { id: 'sources', label: 'Sources', summary: 'Source health, freshness and fixture/live labeling.' },
  { id: 'requests', label: 'Requests', summary: 'Review state for introductions, listing requests and clarifications.' },
  { id: 'saved', label: 'Saved', summary: 'Saved markets, listings and watchlist reminders.' },
  { id: 'preferences', label: 'Preferences', summary: 'Country, role, routing and notification preferences.' },
]

export const marketplaceTabs = [
  { id: 'all', label: 'All listings' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'supply', label: 'Supply' },
  { id: 'services', label: 'Services' },
] as const

export type MarketplaceTabId = (typeof marketplaceTabs)[number]['id']
