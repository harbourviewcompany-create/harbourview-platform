import type { CommandPage, MarketRow, MarketView } from '../CommandCentre'

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

export const PRIMARY_NAV: NavDestination[] = [
  { id: 'overview', label: 'Command', icon: '◎' },
  { id: 'marketplace', label: 'Market', icon: '⊞' },
  { id: 'weekly-signals', label: 'Intel', icon: '≋' },
  { id: 'next-actions', label: 'Actions', icon: '→' },
  { id: 'jurisdiction', label: 'Context', icon: '◉' },
]

export const SECTION_NAV: NavDestination[] = [
  { id: 'overview', label: 'Command brief', icon: '◎' },
  { id: 'live-status', label: 'Live status', icon: '◷' },
  { id: 'market-intelligence', label: 'Market intelligence', icon: '≈' },
  { id: 'marketplace', label: 'Marketplace control', icon: '⊞' },
  { id: 'supply', label: 'Supply', icon: '▤' },
  { id: 'next-actions', label: 'Next actions', icon: '→' },
  { id: 'weekly-signals', label: 'Weekly signals', icon: '≋' },
  { id: 'personal-briefing', label: 'Personal briefing', icon: '❑' },
  { id: 'search', label: 'Search', icon: '⌕' },
  { id: 'education', label: 'Education path', icon: '◇' },
  { id: 'jurisdiction', label: 'Jurisdiction context', icon: '◉' },
  { id: 'market-status', label: 'Marketplace status', icon: '◫' },
  { id: 'review-gates', label: 'Review gates', icon: '◆' },
  { id: 'directories', label: 'Directories', icon: '⊚' },
  { id: 'talent', label: 'Talent', icon: '✦' },
  { id: 'genetics', label: 'Genetics', icon: '⊕' },
  { id: 'clinical', label: 'Clinical', icon: '⚕' },
  { id: 'compliance', label: 'Compliance', icon: '▣' },
  { id: 'network', label: 'Network', icon: '◎' },
  { id: 'financing', label: 'Trade financing', icon: '¤' },
]

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
}

export const SECTION_IDS = new Set<string>(SECTION_NAV.map(section => section.id))

/**
 * Approved dashboard mediation and release-control wording.
 * Control source: docs/control/DASHBOARD_DESIGN_HANDOFF.md and the public/private
 * projection boundaries enforced by the Harbourview leakage test suite.
 */
export const MOBILE_COMMAND_COPY = {
  marketplaceDescription:
    'Review approved records, search the active category, post demand and move qualified opportunities into controlled Harbourview workflows.',
  listingFallback:
    'Commercial detail is available through a controlled Harbourview workflow.',
  listingChannel: 'Harbourview mediated',
  reviewedIntroduction: 'Request reviewed introduction',
  supplyReview: 'Start controlled supply review',
  transactionPipeline:
    'Harbourview remains the mediated layer between demand, proof review, qualified matches and controlled deal-room access.',
  reviewDescription:
    'Commercial visibility, introductions and sensitive detail remain controlled by evidence, authorization and operator review.',
  controlTitle: 'Controlled by default',
  controlDetail:
    'No supplier identity, private source evidence, internal review notes or counterparty detail is released from this mobile surface.',
  directoryDescription:
    'Directory records remain evidence-aware and mediated rather than exposing an open supplier or counterparty directory.',
  financingDescription:
    'Financing is reviewed alongside jurisdiction, evidence, counterparty and transaction readiness—not as an instant checkout product.',
} as const

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

export function clampPercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null
  const normalized = value > 0 && value < 1 ? value * 100 : value
  return Math.max(0, Math.min(100, Math.round(normalized)))
}

export function parseConfidence(raw: unknown): number | null {
  if (raw == null || (typeof raw === 'string' && !raw.trim())) return null
  if (typeof raw !== 'number' && typeof raw !== 'string') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? clampPercent(parsed) : null
}

export function normalizeListing(
  row: MarketRow,
  index: number,
  view: MarketView,
  fallbackJurisdiction: string,
): NormalizedListing {
  return {
    id: String(row[7] || `${view}-${index}`),
    title: String(row[0] || 'Reviewed marketplace record'),
    summary: String(row[1] || MOBILE_COMMAND_COPY.listingFallback),
    jurisdiction: String(row[2] || fallbackJurisdiction),
    category: String(row[3] || MARKET_TABS.find(tab => tab.id === view)?.label || 'Marketplace'),
    status: String(row[4] || 'Pending review'),
    channel: String(row[5] || MOBILE_COMMAND_COPY.listingChannel),
    confidence: parseConfidence(row[6]),
    view,
  }
}

export function matchesQuery(query: string, values: Array<unknown>): boolean {
  return values.some(value => String(value ?? '').toLowerCase().includes(query))
}
