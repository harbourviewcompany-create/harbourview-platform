import type { CommandPage, MarketRow, MarketView } from '../CommandCentre'
import { MOBILE_COMMAND_COPY } from '@/lib/platform/commandCentreCopy'

export { MOBILE_COMMAND_COPY }

export type SectionId =
  | 'overview'
  | 'live-status'
  | 'market-intelligence'
  | 'marketplace'
  | 'supply'
  | 'next-actions'
  | 'weekly-signals'
  | 'personal-briefing'
  | 'search'
  | 'education'
  | 'jurisdiction'
  | 'market-status'
  | 'review-gates'
  | 'directories'
  | 'talent'
  | 'genetics'
  | 'clinical'
  | 'compliance'
  | 'network'
  | 'financing'

export type MobileCommandTool =
  | 'wanted-intake'
  | 'supply-intake'
  | 'introduction'
  | 'financing-intake'

export type Tone = 'neutral' | 'gold' | 'ok' | 'warn'

export type NavDestination = {
  id: SectionId
  label: string
  icon: string
}

export type NormalizedListing = {
  id: string
  title: string
  summary: string
  jurisdiction: string
  category: string
  status: string
  channel: string
  confidence: number | null
  view: MarketView
}

export type DirectoryRecord = {
  id: string
  kind: string
  title: string
  subtitle: string
  status: string
}

export type SubmissionRecord = {
  id: string
  title: string
  status: string
}

export type NextAction = {
  id: string
  label: string
  detail: string
  href: string
  tone: Tone
}

export const MARKET_TABS: Array<{ id: MarketView; label: string }> = [
  { id: 'cannabis', label: 'Cannabis' },
  { id: 'wanted', label: 'Wanted' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'consumables', label: 'Consumables' },
  { id: 'services', label: 'Services' },
  { id: 'new-products', label: 'New products' },
]

export const NON_SUPPLY_VIEWS = new Set<MarketView>(['wanted', 'opportunities'])
export const SUPPLY_TABS = MARKET_TABS.filter(tab => !NON_SUPPLY_VIEWS.has(tab.id))

export const PRIMARY_NAV: NavDestination[] = [
  { id: 'overview', label: 'Command', icon: '◎' },
  { id: 'marketplace', label: 'Market', icon: '⊞' },
  { id: 'weekly-signals', label: 'Intel', icon: '≋' },
  { id: 'next-actions', label: 'Actions', icon: '→' },
  { id: 'jurisdiction', label: 'Context', icon: '◉' },
]

const SECTION_NAV_BY_ID: Record<SectionId, NavDestination> = {
  overview: { id: 'overview', label: 'Command brief', icon: '◎' },
  'live-status': { id: 'live-status', label: 'Live status', icon: '◷' },
  'market-intelligence': { id: 'market-intelligence', label: 'Market intelligence', icon: '≈' },
  marketplace: { id: 'marketplace', label: 'Marketplace control', icon: '⊞' },
  supply: { id: 'supply', label: 'Supply', icon: '▤' },
  'next-actions': { id: 'next-actions', label: 'Next actions', icon: '→' },
  'weekly-signals': { id: 'weekly-signals', label: 'Weekly signals', icon: '≋' },
  'personal-briefing': { id: 'personal-briefing', label: 'Personal briefing', icon: '❑' },
  search: { id: 'search', label: 'Search', icon: '⌕' },
  education: { id: 'education', label: 'Education path', icon: '◇' },
  jurisdiction: { id: 'jurisdiction', label: 'Jurisdiction context', icon: '◉' },
  'market-status': { id: 'market-status', label: 'Marketplace status', icon: '◫' },
  'review-gates': { id: 'review-gates', label: 'Review gates', icon: '◆' },
  directories: { id: 'directories', label: 'Directories', icon: '⊚' },
  talent: { id: 'talent', label: 'Talent', icon: '✦' },
  genetics: { id: 'genetics', label: 'Genetics', icon: '⊕' },
  clinical: { id: 'clinical', label: 'Clinical', icon: '⚕' },
  compliance: { id: 'compliance', label: 'Compliance', icon: '▣' },
  network: { id: 'network', label: 'Network', icon: '⎈' },
  financing: { id: 'financing', label: 'Trade financing', icon: '¤' },
}

export const SECTION_NAV: NavDestination[] = Object.values(SECTION_NAV_BY_ID)

/**
 * One canonical target for every module. URLs carry both the desktop page and
 * mobile section, so the same link remains inside the appropriate command
 * surface before and after a responsive breakpoint change.
 */
export const SECTION_TO_DESKTOP_PAGE: Record<SectionId, CommandPage> = {
  overview: 'briefing',
  'live-status': 'briefing',
  'market-intelligence': 'prices',
  marketplace: 'marketplace',
  supply: 'marketplace',
  'next-actions': 'briefing',
  'weekly-signals': 'signals',
  'personal-briefing': 'digest',
  search: 'assistant',
  education: 'education',
  jurisdiction: 'access-pathway',
  'market-status': 'marketplace',
  'review-gates': 'evidence',
  directories: 'experts',
  talent: 'jobs',
  genetics: 'genetics',
  clinical: 'clinical',
  compliance: 'compliance',
  network: 'experts',
  financing: 'trade-calc',
}

export const PAGE_TO_SECTION: Partial<Record<CommandPage, SectionId>> = {
  briefing: 'overview',
  digest: 'personal-briefing',
  marketplace: 'marketplace',
  signals: 'weekly-signals',
  watchlist: 'weekly-signals',
  education: 'education',
  'access-pathway': 'jurisdiction',
  regulatory: 'jurisdiction',
  'local-intel': 'jurisdiction',
  countries: 'jurisdiction',
  evidence: 'review-gates',
  prices: 'market-intelligence',
  logistics: 'supply',
  talent: 'talent',
  jobs: 'talent',
  genetics: 'genetics',
  clinical: 'clinical',
  compliance: 'compliance',
  licences: 'compliance',
  experts: 'directories',
  banking: 'financing',
  'trade-calc': 'financing',
  insurance: 'financing',
  events: 'weekly-signals',
  assistant: 'search',
  documents: 'review-gates',
  notifications: 'next-actions',
  kyb: 'review-gates',
  organization: 'overview',
  settings: 'overview',
}

/**
 * The five bottom-nav destinations. Declared explicitly rather than derived from
 * PRIMARY_NAV, because that is typed `NavDestination[]` and would widen this to
 * every SectionId — which silently defeats the exhaustiveness check on
 * SECTION_GROUPS below.
 */
export type PrimarySectionId =
  | 'overview'
  | 'marketplace'
  | 'weekly-signals'
  | 'next-actions'
  | 'jurisdiction'

/**
 * Every section folded under exactly one of the five primary destinations.
 *
 * The mobile renderer previously mounted all twenty sections at once in a single
 * scrolling column, and the bottom nav only called `scrollIntoView` — so the five
 * "tabs" were anchors into one endless page rather than navigation, and the
 * fifteen sections with no tab were reached by scrolling past them. The desktop
 * Command Centre has always switched on `activePage` and rendered one page at a
 * time; this restores the same model on mobile.
 *
 * Order within each group is render order. Reordering or moving a section
 * between groups is a single edit here — nothing else reads the arrangement.
 */
export const SECTION_GROUPS: Record<PrimarySectionId, SectionId[]> = {
  overview: ['overview', 'live-status', 'personal-briefing', 'review-gates'],
  marketplace: ['marketplace', 'supply', 'market-status', 'market-intelligence'],
  'weekly-signals': ['weekly-signals', 'search', 'education'],
  'next-actions': ['next-actions', 'financing'],
  jurisdiction: ['jurisdiction', 'compliance', 'clinical', 'genetics', 'network', 'directories', 'talent'],
}

/**
 * Reverse lookup so a deep link to any section activates the destination that
 * owns it. Built from SECTION_GROUPS rather than hand-maintained, so the two
 * cannot drift.
 */
export const SECTION_TO_GROUP: Record<SectionId, PrimarySectionId> = (() => {
  const lookup = {} as Record<SectionId, PrimarySectionId>
  for (const [group, sections] of Object.entries(SECTION_GROUPS) as Array<[PrimarySectionId, SectionId[]]>) {
    for (const section of sections) lookup[section] = group
  }
  return lookup
})()

export const SECTION_IDS = new Set<SectionId>(SECTION_NAV.map(section => section.id))
export const MOBILE_COMMAND_TOOLS = new Set<MobileCommandTool>([
  'wanted-intake',
  'supply-intake',
  'introduction',
  'financing-intake',
])

// Customer-facing control copy is versioned in lib/platform/commandCentreCopy.ts.

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

export function readString(value: unknown, keys: string[], fallback = ''): string {
  const item = asRecord(value)
  for (const key of keys) {
    const candidate = item[key]
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate)
  }
  return fallback
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

export function formatStatus(value: unknown, fallback = 'Review required'): string {
  return typeof value === 'string' && value.trim() ? titleCase(value) : fallback
}

/** Clamp values already stored on a 0–100 scale. */
export function clampPercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return Math.max(0, Math.min(100, Math.round(value)))
}

/** Convert a confidence fraction (0–1) into a percentage. */
export function confidenceFractionToPercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return clampPercent(value * 100)
}

export function parseConfidence(raw: unknown): number | null {
  if (raw == null || (typeof raw === 'string' && !raw.trim())) return null
  if (typeof raw !== 'number' && typeof raw !== 'string') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? clampPercent(parsed) : null
}

export function parseMobileCommandTool(raw: string | null): MobileCommandTool | null {
  return raw && MOBILE_COMMAND_TOOLS.has(raw as MobileCommandTool)
    ? raw as MobileCommandTool
    : null
}

export function defaultListingTypeForView(view: MarketView): string {
  const byView: Record<MarketView, string> = {
    cannabis: 'Cannabis Inventory',
    wanted: 'Wanted Request',
    opportunities: 'Business Opportunity',
    equipment: 'Used / Surplus Equipment',
    consumables: 'Consumables',
    services: 'Service',
    'new-products': 'New Product',
  }
  return byView[view]
}

export function normalizeListing(
  row: MarketRow,
  index: number,
  view: MarketView,
  fallbackJurisdiction: string,
): NormalizedListing {
  const [title, summary, jurisdiction, category, status, channel, confidence, id] = row

  return {
    id: String(id || `${view}-${index}`),
    title: String(title || 'Reviewed marketplace record'),
    summary: String(summary || MOBILE_COMMAND_COPY.listingFallback),
    jurisdiction: String(jurisdiction || fallbackJurisdiction),
    category: String(category || MARKET_TABS.find(tab => tab.id === view)?.label || 'Marketplace'),
    status: String(status || 'Pending review'),
    channel: String(channel || MOBILE_COMMAND_COPY.listingChannel),
    confidence: parseConfidence(confidence),
    view,
  }
}

export function matchesQuery(query: string, values: Array<unknown>): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true
  return values.some(value => String(value ?? '').toLowerCase().includes(normalizedQuery))
}
