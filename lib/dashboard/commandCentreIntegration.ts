export const COMMAND_CENTRE_MODULES = [
  { id: 'briefing', label: 'Briefing', icon: '◎', page: 'briefing', custom: false },
  { id: 'digest', label: 'Digest', icon: '❑', page: 'digest', custom: false },
  { id: 'personal-briefings', label: 'My Briefings', icon: '◌', page: 'digest', custom: true },
  { id: 'intel', label: 'Intel', icon: '≋', page: 'signals', custom: false },
  { id: 'search', label: 'Search', icon: '⌕', page: 'signals', custom: true },
  { id: 'compliance', label: 'Compliance', icon: '◫', page: 'compliance', custom: false },
  { id: 'market', label: 'Market', icon: '◉', page: 'local-intel', custom: true },
  { id: 'marketplace', label: 'Marketplace', icon: '⊞', page: 'marketplace', custom: false },
  { id: 'supply', label: 'Supply', icon: '▦', page: 'marketplace', custom: true },
  { id: 'financing', label: 'Financing', icon: '¤', page: 'marketplace', custom: true },
  { id: 'directories', label: 'Directories', icon: '⊚', page: 'experts', custom: true },
  { id: 'talent', label: 'Talent', icon: '✦', page: 'jobs', custom: true },
  { id: 'genetics', label: 'Genetics', icon: '⊕', page: 'genetics', custom: false },
  { id: 'clinical', label: 'Clinical', icon: '⚕', page: 'clinical', custom: false },
  { id: 'watchlist', label: 'Watchlist', icon: '◈', page: 'watchlist', custom: false },
  { id: 'pathways', label: 'Pathways', icon: '⬡', page: 'access-pathway', custom: false },
] as const

export type CommandCentreModule = (typeof COMMAND_CENTRE_MODULES)[number]['id']
export type ExistingCommandPage = (typeof COMMAND_CENTRE_MODULES)[number]['page']

const MODULE_BY_ID = new Map(COMMAND_CENTRE_MODULES.map(definition => [definition.id, definition]))

const ALIASES: Readonly<Record<string, CommandCentreModule>> = {
  overview: 'briefing',
  briefings: 'personal-briefings',
  'my-briefings': 'personal-briefings',
  intelligence: 'intel',
  signals: 'intel',
  'signal-search': 'search',
  finance: 'financing',
  'trade-finance': 'financing',
  suppliers: 'directories',
  professionals: 'directories',
  pathway: 'pathways',
  'access-pathway': 'pathways',
}

export function normalizeCommandCentreModule(raw: string | null | undefined): CommandCentreModule | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase().replace(/_/g, '-')
  if (MODULE_BY_ID.has(key as CommandCentreModule)) return key as CommandCentreModule
  return Object.hasOwn(ALIASES, key) ? ALIASES[key] : null
}

export function getCommandCentreModule(id: CommandCentreModule) {
  const definition = MODULE_BY_ID.get(id)
  if (!definition) throw new Error(`Unknown Command Centre module: ${String(id)}`)
  return definition
}

export function isCustomCommandCentreModule(id: CommandCentreModule): boolean {
  return getCommandCentreModule(id).custom
}

export function buildCommandCentreModuleHref(
  id: CommandCentreModule,
  context?: { country?: string | null; role?: string | null },
): string {
  const definition = getCommandCentreModule(id)
  const params = new URLSearchParams()
  const country = context?.country?.trim().toUpperCase()
  const role = context?.role?.trim()
  if (country && country !== 'GLOBAL') params.set('country', country)
  if (role) params.set('role', role)
  if (definition.page !== 'briefing') params.set('page', definition.page)
  if (definition.custom) params.set('module', definition.id)
  const query = params.toString()
  return query ? `/dashboard?${query}` : '/dashboard'
}
