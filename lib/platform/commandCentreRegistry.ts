import {
  ACTIVE_COMMAND_CENTRE_REDIRECTS,
  COMMAND_CENTRE_MODULES,
  COMMAND_CENTRE_ROUTE_POLICY,
  PUBLIC_ENTRY_EXCEPTIONS,
} from '@/config/command-centre-routes.mjs'
import type { CommandPage } from '@/components/dashboard/CommandCentre'
import { SECTION_IDS, type SectionId } from '@/components/dashboard/mobile-command/contracts'

export type CommandCentreCriticality = 'launch-critical' | 'important'
export type CommandCentreRouteMode = 'redirect-now' | 'redirect-after-parity' | 'intercept-next' | 'retain-public'

export type CommandCentreModule = Readonly<{
  id: string
  label: string
  desktopPage: CommandPage
  mobileSection: SectionId
  criticality: CommandCentreCriticality
}>

export type CommandCentreRoutePolicy = Readonly<{
  source: string
  destination: string
  mode: CommandCentreRouteMode
  reason: string
}>

const SUPPORTED_COMMAND_PAGES = Object.freeze<CommandPage[]>([
  'briefing',
  'digest',
  'access-pathway',
  'marketplace',
  'evidence',
  'education',
  'regulatory',
  'local-intel',
  'signals',
  'watchlist',
  'settings',
  'genetics',
  'clinical',
  'compliance',
  'countries',
  'assistant',
  'documents',
  'events',
  'experts',
  'banking',
  'notifications',
  'kyb',
  'prices',
  'logistics',
  'jobs',
  'insurance',
  'licences',
  'trade-calc',
  'organization',
  'talent',
])

const supportedPageSet = new Set<CommandPage>(SUPPORTED_COMMAND_PAGES)

const CANONICAL_MOBILE_SECTION_BY_PAGE: Readonly<Record<CommandPage, SectionId>> = Object.freeze({
  briefing: 'overview',
  digest: 'personal-briefing',
  'access-pathway': 'jurisdiction',
  marketplace: 'marketplace',
  evidence: 'review-gates',
  education: 'education',
  regulatory: 'jurisdiction',
  'local-intel': 'jurisdiction',
  signals: 'weekly-signals',
  watchlist: 'weekly-signals',
  settings: 'overview',
  genetics: 'genetics',
  clinical: 'clinical',
  compliance: 'compliance',
  countries: 'jurisdiction',
  assistant: 'search',
  documents: 'review-gates',
  events: 'network',
  experts: 'network',
  banking: 'financing',
  notifications: 'next-actions',
  kyb: 'review-gates',
  prices: 'market-intelligence',
  logistics: 'supply',
  jobs: 'talent',
  insurance: 'financing',
  licences: 'compliance',
  'trade-calc': 'financing',
  organization: 'review-gates',
  talent: 'talent',
})

function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`[command-centre-registry] ${field} must be a non-empty string`)
  }
}

function normalizeModule(value: unknown, index: number): CommandCentreModule {
  if (!value || typeof value !== 'object') {
    throw new Error(`[command-centre-registry] module ${index} must be an object`)
  }

  const record = value as Record<string, unknown>
  assertString(record.id, `module ${index}.id`)
  assertString(record.label, `module ${index}.label`)
  assertString(record.desktopPage, `module ${index}.desktopPage`)
  assertString(record.mobileSection, `module ${index}.mobileSection`)

  if (!supportedPageSet.has(record.desktopPage as CommandPage)) {
    throw new Error(`[command-centre-registry] module ${record.id}.desktopPage is unsupported: ${record.desktopPage}`)
  }
  if (!SECTION_IDS.has(record.mobileSection as SectionId)) {
    throw new Error(`[command-centre-registry] module ${record.id}.mobileSection is unsupported: ${record.mobileSection}`)
  }
  if (record.criticality !== 'launch-critical' && record.criticality !== 'important') {
    throw new Error(`[command-centre-registry] module ${record.id}.criticality is invalid`)
  }

  return Object.freeze({
    id: record.id,
    label: record.label,
    desktopPage: record.desktopPage as CommandPage,
    mobileSection: record.mobileSection as SectionId,
    criticality: record.criticality,
  })
}

function normalizeRoute(value: unknown, index: number): CommandCentreRoutePolicy {
  if (!value || typeof value !== 'object') {
    throw new Error(`[command-centre-registry] route ${index} must be an object`)
  }

  const record = value as Record<string, unknown>
  assertString(record.source, `route ${index}.source`)
  assertString(record.destination, `route ${index}.destination`)
  assertString(record.reason, `route ${index}.reason`)

  if (!['redirect-now', 'redirect-after-parity', 'intercept-next', 'retain-public'].includes(String(record.mode))) {
    throw new Error(`[command-centre-registry] route ${record.source}.mode is invalid`)
  }

  return Object.freeze({
    source: record.source,
    destination: record.destination,
    mode: record.mode as CommandCentreRouteMode,
    reason: record.reason,
  })
}

export const COMMAND_CENTRE_MODULE_REGISTRY = Object.freeze(
  (COMMAND_CENTRE_MODULES as unknown[]).map(normalizeModule),
)

export const COMMAND_CENTRE_ROUTE_REGISTRY = Object.freeze(
  (COMMAND_CENTRE_ROUTE_POLICY as unknown[]).map(normalizeRoute),
)

export const COMMAND_CENTRE_PUBLIC_EXCEPTIONS = Object.freeze(
  (PUBLIC_ENTRY_EXCEPTIONS as unknown[]).map((value, index) => {
    assertString(value, `public exception ${index}`)
    return value
  }),
)

export const COMMAND_CENTRE_ACTIVE_REDIRECTS = Object.freeze(
  (ACTIVE_COMMAND_CENTRE_REDIRECTS as Array<{ source: string; destination: string; permanent: boolean }>).map(route => Object.freeze({ ...route })),
)

const moduleIds = new Set<string>()
const modulePages = new Set<CommandPage>()
const routeSources = new Set<string>()

for (const mod of COMMAND_CENTRE_MODULE_REGISTRY) {
  if (moduleIds.has(mod.id)) {
    throw new Error(`[command-centre-registry] duplicate module id: ${mod.id}`)
  }
  moduleIds.add(mod.id)
  modulePages.add(mod.desktopPage)
}

for (const route of COMMAND_CENTRE_ROUTE_REGISTRY) {
  if (routeSources.has(route.source)) {
    throw new Error(`[command-centre-registry] duplicate route source: ${route.source}`)
  }
  routeSources.add(route.source)
}

export const COMMAND_CENTRE_MODULE_IDS = Object.freeze([...moduleIds])
export const COMMAND_CENTRE_PAGE_IDS = SUPPORTED_COMMAND_PAGES
export const COMMAND_CENTRE_CONFIGURED_PAGE_IDS = Object.freeze([...modulePages])

export function normalizeCommandPage(raw: string | null | undefined): CommandPage | null {
  if (!raw) return null
  const page = raw.trim().toLowerCase() as CommandPage
  return supportedPageSet.has(page) ? page : null
}

export function getCommandCentreModule(id: string | null | undefined): CommandCentreModule | null {
  if (!id) return null
  return COMMAND_CENTRE_MODULE_REGISTRY.find(module => module.id === id) ?? null
}

export function getCommandCentreModulesForPage(page: CommandPage): CommandCentreModule[] {
  return COMMAND_CENTRE_MODULE_REGISTRY.filter(module => module.desktopPage === page)
}

export function getCommandCentreModulesForMobileSection(section: SectionId): CommandCentreModule[] {
  return COMMAND_CENTRE_MODULE_REGISTRY.filter(module => module.mobileSection === section)
}

export function getMobileSectionForPage(page: CommandPage): SectionId {
  return CANONICAL_MOBILE_SECTION_BY_PAGE[page]
}

export function buildCommandCentreHref(
  moduleId: string,
  context: {
    country?: string | null
    role?: string | null
    section?: SectionId | null
    marketView?: string | null
    tool?: string | null
    listing?: string | null
  } = {},
): string {
  const mod = getCommandCentreModule(moduleId)
  if (!mod) throw new Error(`[command-centre-registry] unknown module: ${moduleId}`)

  const params = new URLSearchParams()
  if (context.country) params.set('country', context.country)
  if (context.role) params.set('role', context.role)
  params.set('page', mod.desktopPage)
  params.set('section', context.section ?? mod.mobileSection)
  if (context.marketView) params.set('marketView', context.marketView)
  if (context.tool) params.set('tool', context.tool)
  if (context.listing) params.set('listing', context.listing)
  return `/dashboard?${params.toString()}`
}

export function getCommandCentreReadinessSummary() {
  const critical = COMMAND_CENTRE_MODULE_REGISTRY.filter(module => module.criticality === 'launch-critical')
  return Object.freeze({
    totalModules: COMMAND_CENTRE_MODULE_REGISTRY.length,
    launchCriticalModules: critical.length,
    importantModules: COMMAND_CENTRE_MODULE_REGISTRY.length - critical.length,
    uniqueDesktopPages: COMMAND_CENTRE_PAGE_IDS.length,
    configuredDesktopPages: COMMAND_CENTRE_CONFIGURED_PAGE_IDS.length,
    mobileSections: new Set(COMMAND_CENTRE_MODULE_REGISTRY.map(module => module.mobileSection)).size,
    routePolicies: COMMAND_CENTRE_ROUTE_REGISTRY.length,
  })
}
