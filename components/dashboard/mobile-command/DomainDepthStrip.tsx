import type { CommandSourceMeta } from './props'

type DomainDepthStripProps = {
  section: string
  sources?: CommandSourceMeta
}

type DomainDefinition = {
  label: string
  keys: string[]
  missing: string[]
}

const DEFINITIONS: Record<string, DomainDefinition> = {
  overview: { label: 'Command', keys: ['signals', 'pipeline', 'watchlistData', 'evidenceData', 'countryIntel'], missing: ['last-visit deltas by entity', 'role-routed events', 'cross-domain dependency graph'] },
  'market-intelligence': { label: 'Market intelligence', keys: ['marketMetrics', 'tradeFlows', 'signals'], missing: ['price history', 'supply/demand time series', 'market concentration'] },
  marketplace: { label: 'Marketplace', keys: ['marketplaceRows', 'wantedListings', 'mySubmissions'], missing: ['counterparty verification', 'availability windows', 'transaction history'] },
  supply: { label: 'Supply', keys: ['marketplaceRows', 'wantedListings'], missing: ['capacity', 'committed inventory', 'lead-time history'] },
  'next-actions': { label: 'Actions', keys: ['pipeline', 'signals', 'evidenceData', 'watchlistData'], missing: ['owner/deadline state', 'dependencies', 'completion history'] },
  'weekly-signals': { label: 'Intelligence', keys: ['signals', 'dailyDigest', 'sourceCoverage'], missing: ['corroboration graph', 'event timestamps', 'role/entity routing'] },
  'personal-briefing': { label: 'Briefing', keys: ['dailyDigest', 'signals', 'pipeline', 'watchlistData'], missing: ['personal event ledger', 'unread state by entity', 'priority rationale'] },
  search: { label: 'Search', keys: ['signals', 'marketplaceRows', 'watchlistData', 'evidenceData'], missing: ['documents', 'people/organizations graph', 'cross-domain semantic evidence'] },
  education: { label: 'Education', keys: ['liveEduTiles', 'educationTracks', 'countryEducationOverlays', 'recentEduModules'], missing: ['competency state', 'expiry tracking', 'organization requirements'] },
  jurisdiction: { label: 'Jurisdiction', keys: ['countryIntel', 'publicPathway', 'orgPathway', 'pathwayMatrix', 'sourceCoverage'], missing: ['requirement-level evidence', 'effective-date history', 'activity/product matrix'] },
  'market-status': { label: 'Market status', keys: ['pipeline', 'wantedCount', 'mySubmissions'], missing: ['stage history', 'SLA/aging', 'counterparty state'] },
  'review-gates': { label: 'Review gates', keys: ['evidenceData', 'sourceCoverage', 'pipeline', 'mySubmissions'], missing: ['requirement graph', 'verification audit trail', 'expiry state'] },
  talent: { label: 'Talent', keys: ['professionals', 'liveEduTiles'], missing: ['credential graph', 'availability', 'jurisdiction eligibility'] },
  genetics: { label: 'Genetics', keys: ['cultivarPassports', 'serviceProviders', 'collaborationProjects'], missing: ['genotype/phenotype evidence', 'lineage', 'licensing/territory state'] },
  clinical: { label: 'Clinical', keys: ['countryIntel', 'signals', 'sourceCoverage'], missing: ['clinical evidence corpus', 'safety/interaction evidence', 'professional scope'] },
  compliance: { label: 'Compliance', keys: ['countryIntel', 'jurisdictionPlaybook', 'pathwayMatrix', 'sourceCoverage'], missing: ['control-level evidence', 'owner/expiry state', 'change history'] },
  regulatory: { label: 'Regulatory', keys: ['watchlistData', 'signals', 'sourceCoverage', 'countryIntel'], missing: ['before/after requirement diff', 'effective dates', 'affected-entity routing'] },
  'local-intel': { label: 'Local intelligence', keys: ['localIntel', 'professionals', 'cannabisOperators'], missing: ['geospatial supply/demand', 'local facilities', 'local regulatory events'] },
  network: { label: 'Network', keys: ['professionals', 'serviceProviders', 'cannabisOperators', 'collaborationProjects'], missing: ['relationship history', 'verification evidence', 'opportunity matching'] },
  financing: { label: 'Financing', keys: ['pipeline', 'countryIntel'], missing: ['transaction economics', 'financing offers', 'FX/risk history'] },
  settings: { label: 'Account', keys: [], missing: ['watch configuration', 'data entitlements', 'integration state'] },
  'deal-rooms': { label: 'Deal rooms', keys: ['pipeline', 'evidenceData', 'mySubmissions'], missing: ['deal state machine', 'party/message ledger', 'document and approval history'] },
}

function sourceState(meta?: CommandSourceMeta) {
  if (!meta) return 'not loaded'
  return meta.state
}

function freshness(meta?: CommandSourceMeta) {
  if (!meta) return null
  const at = meta.freshAt ?? meta.loadedAt
  const timestamp = Date.parse(at)
  if (!Number.isFinite(timestamp)) return null
  const hours = Math.max(0, Math.round((Date.now() - timestamp) / 3_600_000))
  return hours < 1 ? 'fresh' : hours < 24 ? `updated ${hours}h ago` : `updated ${Math.round(hours / 24)}d ago`
}

export default function DomainDepthStrip({ section, sources }: DomainDepthStripProps) {
  const definition = DEFINITIONS[section] ?? { label: section, keys: [], missing: [] }
  const loaded = definition.keys
    .map(key => sources?.[key])
    .filter(Boolean) as CommandSourceMeta[string][]

  const live = loaded.filter(meta => meta.state === 'live').length
  const degraded = loaded.filter(meta => ['partial', 'fallback', 'stale', 'error'].includes(meta.state)).length
  const requested = loaded.filter(meta => meta.requested).length
  const coverage = loaded.length === 0 ? 0 : Math.round((live / loaded.length) * 100)
  const freshnessMeta = loaded.find(meta => meta.freshAt) ?? loaded[0]
  const freshLabel = freshness(freshnessMeta)
  const primaryGap = definition.missing[0]

  return (
    <aside className="hvm-domain-depth" aria-label={`${definition.label} data coverage`}>
      <div className="hvm-domain-depth-top">
        <span className="hvm-domain-depth-kicker">DATA DEPTH</span>
        <strong>{coverage}% live coverage</strong>
        <span>{requested}/{loaded.length || 0} sources requested</span>
      </div>
      <div className="hvm-domain-depth-meta">
        <span>{degraded ? `${degraded} source${degraded === 1 ? '' : 's'} need attention` : 'Source state healthy'}</span>
        {freshLabel && <span>{freshLabel}</span>}
      </div>
      {primaryGap && (
        <div className="hvm-domain-depth-gap">
          <span>Next depth:</span> {primaryGap}
        </div>
      )}
    </aside>
  )
}
