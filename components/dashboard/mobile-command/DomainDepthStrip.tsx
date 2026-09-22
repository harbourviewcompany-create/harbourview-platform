import type { CommandSourceMeta } from './props'
import type { CommandCentreSourceMeta } from '@/lib/dashboard/commandCentreDataTypes'

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
  overview: {
    label: 'Command',
    keys: ['signals', 'pipeline', 'watchlistData', 'evidenceData', 'countryIntel', 'marketplaceRows', 'marketMetrics', 'dailyDigest', 'sourceCoverage'],
    missing: ['last-visit deltas by entity', 'role-routed events', 'cross-domain dependency graph'],
  },
  'market-intelligence': {
    label: 'Market intelligence',
    keys: ['marketMetrics', 'tradeFlows', 'signals', 'pipeline', 'watchlistData', 'marketplaceRows', 'sourceCoverage'],
    missing: ['price history', 'supply/demand time series', 'market concentration'],
  },
  marketplace: {
    label: 'Marketplace',
    keys: ['marketplaceRows', 'wantedListings', 'mySubmissions', 'pipeline', 'signals', 'watchlistData', 'evidenceData'],
    missing: ['counterparty verification', 'availability windows', 'transaction history'],
  },
  supply: {
    label: 'Supply',
    keys: ['marketplaceRows', 'wantedListings', 'pipeline', 'tradeFlows', 'cannabisOperators'],
    missing: ['capacity', 'committed inventory', 'lead-time history'],
  },
  'next-actions': {
    label: 'Actions',
    keys: ['pipeline', 'signals', 'evidenceData', 'watchlistData', 'marketplaceRows'],
    missing: ['owner/deadline state', 'dependencies', 'completion history'],
  },
  'weekly-signals': {
    label: 'Intelligence',
    keys: ['signals', 'dailyDigest', 'sourceCoverage', 'watchlistData', 'pipeline', 'countryIntel'],
    missing: ['corroboration graph', 'event timestamps', 'role/entity routing'],
  },
  'personal-briefing': {
    label: 'Briefing',
    keys: ['dailyDigest', 'signals', 'pipeline', 'watchlistData', 'marketplaceRows', 'marketMetrics', 'sourceCoverage'],
    missing: ['personal event ledger', 'unread state by entity', 'priority rationale'],
  },
  search: {
    label: 'Search',
    keys: ['signals', 'marketplaceRows', 'watchlistData', 'evidenceData', 'countryIntel', 'marketMetrics'],
    missing: ['documents', 'people/organizations graph', 'cross-domain semantic evidence'],
  },
  education: {
    label: 'Education',
    keys: ['liveEduTiles', 'educationTracks', 'countryEducationOverlays', 'recentEduModules', 'signals', 'countryIntel'],
    missing: ['competency state', 'expiry tracking', 'organization requirements'],
  },
  jurisdiction: {
    label: 'Jurisdiction',
    keys: ['countryIntel', 'publicPathway', 'orgPathway', 'pathwayMatrix', 'sourceCoverage', 'signals', 'evidenceData'],
    missing: ['requirement-level evidence', 'effective-date history', 'activity/product matrix'],
  },
  'market-status': {
    label: 'Market status',
    keys: ['pipeline', 'wantedCount', 'mySubmissions', 'marketplaceRows', 'signals'],
    missing: ['stage history', 'SLA/aging', 'counterparty state'],
  },
  'review-gates': {
    label: 'Review gates',
    keys: ['evidenceData', 'sourceCoverage', 'registryCoverageSummary', 'pipeline', 'signals', 'watchlistData'],
    missing: ['gate SLA', 'reviewer assignment', 'appeal history'],
  },
  talent: {
    label: 'Talent',
    keys: ['professionals', 'serviceProviders', 'cannabisOperators', 'countryIntel', 'signals', 'pipeline'],
    missing: ['credential verification depth', 'placement outcomes'],
  },
  genetics: {
    label: 'Genetics',
    keys: ['cultivarPassports', 'serviceProviders', 'collaborationProjects', 'countryIntel', 'signals', 'marketplaceRows'],
    missing: ['IP chain of custody', 'material availability'],
  },
  clinical: {
    label: 'Clinical',
    keys: ['countryIntel', 'publicPathway', 'professionals', 'evidenceData', 'signals', 'sourceCoverage'],
    missing: ['formulary authorization matrix', 'study registry depth'],
  },
  compliance: {
    label: 'Compliance',
    keys: ['countryIntel', 'jurisdictionPlaybook', 'pathwayMatrix', 'signals', 'watchlistData', 'evidenceData'],
    missing: ['licence event stream', 'inspection history'],
  },
  network: {
    label: 'Network',
    keys: ['professionals', 'serviceProviders', 'cannabisOperators', 'countryIntel', 'signals'],
    missing: ['relationship strength', 'introduction outcomes'],
  },
  financing: {
    label: 'Trade financing',
    keys: ['tradeFlows', 'marketMetrics', 'countryIntel', 'publicPathway', 'signals', 'pipeline', 'marketplaceRows'],
    missing: ['facility terms', 'credit decisions'],
  },
  regulatory: {
    label: 'Regulatory watch',
    keys: ['signals', 'watchlistData', 'countryIntel', 'sourceCoverage', 'jurisdictionPlaybook', 'evidenceData'],
    missing: ['rule change timeline', 'consultation calendar'],
  },
  'local-intel': {
    label: 'Local intelligence',
    keys: ['signals', 'countryIntel', 'localIntel', 'sourceCoverage', 'watchlistData', 'marketMetrics'],
    missing: ['municipality coverage', 'facility-level events'],
  },
  settings: {
    label: 'Subscription',
    keys: ['sourceCoverage', 'registryCoverageSummary'],
    missing: ['entitlement usage', 'seat activity'],
  },
  'deal-rooms': {
    label: 'Deal rooms',
    keys: ['pipeline', 'marketplaceRows', 'mySubmissions', 'evidenceData', 'signals'],
    missing: ['NDA state', 'counterparty KYB'],
  },
}

function sourceState(meta?: CommandCentreSourceMeta) {
  if (!meta) return 'not loaded'
  return meta.state
}

function freshness(meta?: CommandCentreSourceMeta) {
  if (!meta) return null
  const at = meta.freshAt ?? meta.loadedAt
  const timestamp = Date.parse(at)
  if (!Number.isFinite(timestamp)) return null
  const hours = Math.max(0, Math.round((Date.now() - timestamp) / 3_600_000))
  return hours < 1 ? 'fresh' : hours < 24 ? `updated ${hours}h ago` : `updated ${Math.round(hours / 24)}d ago`
}

function diagnoseSources(
  keys: string[],
  sources?: CommandSourceMeta,
): { label: string; detail: string }[] {
  const notes: { label: string; detail: string }[] = []
  for (const key of keys) {
    const meta = sources?.[key]
    if (!meta || !meta.requested) {
      notes.push({ label: key, detail: 'not requested for this surface' })
      continue
    }
    switch (meta.state) {
      case 'live':
        break
      case 'empty':
        notes.push({ label: key, detail: 'live source, no rows for this context' })
        break
      case 'stale':
        notes.push({ label: key, detail: freshness(meta) ? `stale · ${freshness(meta)}` : 'stale' })
        break
      case 'error':
        notes.push({ label: key, detail: meta.errorCode ? `error · ${meta.errorCode}` : 'error' })
        break
      case 'partial':
      case 'fallback':
        notes.push({ label: key, detail: meta.state })
        break
      default:
        notes.push({ label: key, detail: String(meta.state) })
    }
  }
  return notes.slice(0, 4)
}

export default function DomainDepthStrip({ section, sources }: DomainDepthStripProps) {
  const definition = DEFINITIONS[section] ?? { label: section, keys: [], missing: [] }
  const loaded = definition.keys
    .map(key => sources?.[key])
    .filter((meta): meta is CommandCentreSourceMeta => Boolean(meta))

  const live = loaded.filter(meta => meta.state === 'live').length
  const empty = loaded.filter(meta => meta.state === 'empty').length
  const degraded = loaded.filter(meta => ['partial', 'fallback', 'stale', 'error'].includes(meta.state)).length
  const requested = loaded.filter(meta => meta.requested).length
  const coverage = loaded.length === 0 ? 0 : Math.round((live / loaded.length) * 100)
  const freshnessMeta = loaded.find(meta => meta.freshAt) ?? loaded[0]
  const freshLabel = freshness(freshnessMeta)
  const primaryGap = definition.missing[0]
  const diagnoses = diagnoseSources(definition.keys, sources)
  const attention = diagnoses.filter(d => !d.detail.includes('not requested'))

  let healthLabel = 'Source state healthy'
  if (degraded > 0) healthLabel = `${degraded} source${degraded === 1 ? '' : 's'} need attention`
  else if (empty > 0 && live === 0) healthLabel = `${empty} source${empty === 1 ? '' : 's'} empty for this context`
  else if (empty > 0) healthLabel = `${live} live · ${empty} empty`

  return (
    <aside className="hvm-domain-depth" aria-label={`${definition.label} data coverage`}>
      <div className="hvm-domain-depth-top">
        <span className="hvm-domain-depth-kicker">DATA DEPTH</span>
        <strong>{coverage}% live coverage</strong>
        <span>{requested}/{definition.keys.length || 0} sources tracked</span>
      </div>
      <div className="hvm-domain-depth-meta">
        <span>{healthLabel}</span>
        {freshLabel && <span>{freshLabel}</span>}
      </div>
      {attention.length > 0 && (
        <ul className="hvm-domain-depth-diag" style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 12, opacity: 0.9 }}>
          {attention.map((row) => (
            <li key={row.label}><span style={{ opacity: 0.75 }}>{row.label}</span> — {row.detail}</li>
          ))}
        </ul>
      )}
      {primaryGap && (
        <div className="hvm-domain-depth-gap">
          <span>Next depth:</span> {primaryGap}
        </div>
      )}
    </aside>
  )
}
