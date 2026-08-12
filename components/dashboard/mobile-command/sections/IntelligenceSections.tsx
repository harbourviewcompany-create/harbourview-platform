'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { MOBILE_COMMAND_COPY } from '@/lib/platform/commandCentreCopy'
import type { MobileCommandCentreProps } from '../props'
import { asRecord, readString, type NextAction, type NormalizedListing, type SectionId } from '../contracts'
import { EmptyState, Metric, SectionShell, StatusPill, type SectionRef } from '../SectionUI'
import { commandSearchKindCounts, searchCommandRecords, type CommandSearchKind, type CommandSearchRecord } from '../intelSearch'
import { matchWatchRuleHits, type WatchRuleLike } from '../watchRuleHits'

type Signal = MobileCommandCentreProps['signals'][number]
type EducationTile = MobileCommandCentreProps['eduCategories'][number] | NonNullable<MobileCommandCentreProps['liveTiles']>[number]
type WatchlistItem = NonNullable<MobileCommandCentreProps['watchlistData']>['items'][number]
type LocalIntel = NonNullable<MobileCommandCentreProps['localIntel']>

function signalContextMatches(signal: Signal, countryLabel: string) {
  const market = readString(signal, ['market', 'jurisdiction', 'country'], '')
  return Boolean(market && market.localeCompare(countryLabel, undefined, { sensitivity: 'base' }) === 0)
}

function signalConfidence(signal: Signal) {
  const raw = asRecord(signal).confidence
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function signalEvidence(signal: Signal) {
  const source = readString(signal, ['sourceName', 'source_name', 'sourceLabel', 'source_label'], '')
  const observed = readString(signal, ['published_at', 'observed_at', 'updated_at', 'timeAgo'], '')
  return { source, observed }
}

function signalQualityBits(signal: Signal): string[] {
  const item = asRecord(signal)
  const bits: string[] = []
  const corr = item.corroborationCount ?? item.corroboration_count
  if (typeof corr === 'number' && corr > 1) bits.push(`${Math.round(corr)} sources`)
  if (item.translated === true) {
    const lang = readString(item, ['originalLanguageLabel', 'original_language_label'], '')
    bits.push(lang ? `via ${lang}` : 'Translated')
  }
  return bits
}

function highlightMatch(value: string, query: string): ReactNode {
  const trimmed = query.trim()
  if (!trimmed) return value
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = value.match(new RegExp(escaped, 'i'))
  if (!match || match.index == null) return value
  const start = match.index
  const end = start + match[0].length
  return <>{value.slice(0, start)}<mark>{value.slice(start, end)}</mark>{value.slice(end)}</>
}

export function NextActionsSection({ sectionRef, actions }: { sectionRef: SectionRef; actions: NextAction[] }) {
  return (
    <SectionShell id="next-actions" sectionRef={sectionRef} eyebrow="Context / next actions" title="Operator action queue" description="Actions are derived from the selected jurisdiction, role, marketplace pipeline and current evidence state.">
      <div className="hvm2-action-stack">
        {actions.map((action, index) => (
          <Link key={action.id} href={action.href} className={`hvm2-action-card hvm2-tone-${action.tone}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div><strong>{action.label}</strong><p>{action.detail}</p></div>
            <i aria-hidden="true">→</i>
          </Link>
        ))}
      </div>
    </SectionShell>
  )
}

export function WeeklySignalsSection({ sectionRef, signals, countryLabel }: { sectionRef: SectionRef; signals: Signal[]; countryLabel: string }) {
  const orderedSignals = useMemo(
    () => signals.map((signal, index) => ({ signal, index, contextual: signalContextMatches(signal, countryLabel) }))
      .sort((a, b) => Number(b.contextual) - Number(a.contextual) || a.index - b.index),
    [countryLabel, signals],
  )

  return (
    <SectionShell id="weekly-signals" sectionRef={sectionRef} eyebrow="Context / weekly signals" title="Intelligence requiring attention" description="Jurisdiction matches for the active context appear first; broader-watch items remain reviewable below.">
      {orderedSignals.length > 0 ? (
        <div className="hvm2-intel-record-list" aria-label="Weekly intelligence signals">
          {orderedSignals.map(({ signal, contextual }) => {
            const analysis = asRecord(asRecord(signal).analysis)
            const whatChanged = readString(analysis, ['what_changed'], readString(signal, ['commercialImpact', 'commercial_impact'], ''))
            const recommendedAction = readString(analysis, ['recommended_action'], '')
            const market = readString(signal, ['market', 'jurisdiction', 'country'], 'Global')
            const confidence = signalConfidence(signal)
            const evidence = signalEvidence(signal)
            const quality = signalQualityBits(signal)
            return (
              <article className="hvm2-signal-card hvm2-intel-signal-card" key={readString(signal, ['id'], `${market}-${readString(signal, ['title'], 'signal')}`)}>
                <div className="hvm2-card-topline">
                  <StatusPill>{readString(signal, ['type'], 'Signal')}</StatusPill>
                  <span>{market}</span>
                </div>
                <div className="hvm2-intel-context-row">
                  <StatusPill tone={contextual ? 'ok' : 'neutral'}>{contextual ? 'Context match' : 'Broader watch'}</StatusPill>
                  {!contextual ? <small>No direct {countryLabel} match is recorded in this signal's jurisdiction metadata.</small> : null}
                </div>
                <h3>{readString(signal, ['title_en', 'headline_en', 'title'], 'Untitled signal')}</h3>
                {whatChanged ? <p>{whatChanged}</p> : <p className="hvm2-intel-unknown">Change summary not recorded in the loaded signal.</p>}
                <div className="hvm2-intel-meta-row">
                  {confidence != null ? <span>Confidence {confidence}%</span> : <span>Confidence Unknown</span>}
                  {quality.map(bit => <span key={bit}>{bit}</span>)}
                  {evidence.source ? <span>Source {evidence.source}</span> : <span>Source Unknown</span>}
                  {evidence.observed ? <span>{evidence.observed}</span> : null}
                </div>
                {recommendedAction ? <div className="hvm2-intel-action"><span>Action</span><p>{recommendedAction}</p></div> : null}
              </article>
            )
          })}
        </div>
      ) : <EmptyState title="No reviewed signals loaded" detail="The intelligence surface is available, but no current signal records are loaded for review." />}
    </SectionShell>
  )
}

export function PersonalBriefingSection({
  sectionRef,
  roleShort,
  countryLabel,
  narrative,
  marketplaceCount,
  signalCount,
  pipelineTotal,
  actionCount,
  signals,
  reviewStatus,
  sourceCoverageCount,
  nextAction,
}: {
  sectionRef: SectionRef
  roleShort: string
  countryLabel: string
  narrative: string
  marketplaceCount: number
  signalCount: number
  pipelineTotal: number
  actionCount: number
  signals: Signal[]
  reviewStatus: string
  sourceCoverageCount: number
  nextAction?: NextAction
}) {
  const contextualSignal = signals.find(signal => signalContextMatches(signal, countryLabel))
  const signalAnalysis = asRecord(asRecord(contextualSignal).analysis)
  const whatChanged = contextualSignal ? readString(signalAnalysis, ['what_changed'], readString(contextualSignal, ['title'], '')) : ''
  const whyItMatters = contextualSignal ? readString(contextualSignal, ['commercialImpact', 'commercial_impact'], '') : ''
  const recommendedAction = contextualSignal ? readString(signalAnalysis, ['recommended_action'], '') : ''

  return (
    <SectionShell id="personal-briefing" sectionRef={sectionRef} eyebrow="Personal briefing" title={`${roleShort} briefing for ${countryLabel}`} description="A deterministic summary of the active jurisdiction, market pipeline, signal feed and next operational decisions.">
      <div className="hvm2-briefing-decision-grid" aria-label="Briefing decision summary">
        <article>
          <span>What changed</span>
          <strong>{whatChanged || 'Unknown'}</strong>
          {!whatChanged ? <p>No jurisdiction-matched change is present in the loaded signal feed.</p> : null}
        </article>
        <article>
          <span>Why it matters</span>
          <strong>{whyItMatters || 'Unknown'}</strong>
          {!whyItMatters ? <p>No supported commercial-impact statement is loaded for the current matched signal.</p> : null}
        </article>
        <article>
          <span>Evidence state</span>
          <strong>{reviewStatus || 'Unknown'}</strong>
          <p>{sourceCoverageCount > 0 ? `${sourceCoverageCount} jurisdiction source${sourceCoverageCount === 1 ? '' : 's'} registered.` : 'Jurisdiction source coverage is Unknown in this session.'}</p>
        </article>
        <article>
          <span>Action</span>
          <strong>{recommendedAction || nextAction?.label || 'Unknown'}</strong>
          {nextAction?.detail && !recommendedAction ? <p>{nextAction.detail}</p> : null}
          {nextAction?.href ? (
            <p><Link className="hvm2-text-link" href={nextAction.href}>Open action →</Link></p>
          ) : null}
        </article>
      </div>

      <article className="hvm2-narrative-card hvm2-briefing-narrative">
        <span className="hvm2-intel-kicker">Longer briefing</span>
        <p>{narrative}</p>
        <div className="hvm2-narrative-grid">
          <div><span>Commercial records</span><strong>{marketplaceCount}</strong></div>
          <div><span>Signals tracked</span><strong>{signalCount}</strong></div>
          <div><span>Pipeline items</span><strong>{pipelineTotal}</strong></div>
          <div><span>Action queue</span><strong>{actionCount}</strong></div>
        </div>
      </article>
    </SectionShell>
  )
}

const SEARCH_KIND_LABELS: Record<CommandSearchKind, string> = {
  signal: 'Signals',
  marketplace: 'Marketplace',
  regulatory: 'Regulatory',
  jurisdiction: 'Jurisdiction / local',
  directory: 'Directory',
  genetics: 'Genetics',
  action: 'Actions',
  evidence: 'Evidence',
  talent: 'Talent',
}

export function SearchSection({ sectionRef, searchQuery, searchRecords, countryLabel, onQueryChange, onNavigate, onListingSelect }: {
  sectionRef: SectionRef
  searchQuery: string
  searchRecords: CommandSearchRecord[]
  countryLabel?: string
  onQueryChange: (value: string) => void
  onNavigate: (section: SectionId) => void
  onListingSelect: (row: NormalizedListing) => void
}) {
  const [activeKind, setActiveKind] = useState<CommandSearchKind | 'all'>('all')
  const label = 'Search signals, markets, regulations, authorities, operators or actions'
  const allMatches = useMemo(
    () => searchCommandRecords(searchRecords, searchQuery, countryLabel),
    [searchQuery, searchRecords, countryLabel],
  )
  const visibleMatches = activeKind === 'all' ? allMatches : allMatches.filter(record => record.kind === activeKind)
  const corpusCounts = useMemo(() => commandSearchKindCounts(searchRecords), [searchRecords])
  const availableKinds = useMemo(() => [...corpusCounts.keys()], [corpusCounts])
  const hasQuery = Boolean(searchQuery.trim())

  function openRecord(record: CommandSearchRecord) {
    if (record.listing) onListingSelect(record.listing)
    else onNavigate(record.destination)
  }

  return (
    <SectionShell id="search" sectionRef={sectionRef} eyebrow="Cross-command search" title="Search authenticated command records" description={MOBILE_COMMAND_COPY.searchDescription}>
      <label className="hvm2-search-field hvm2-search-field-large">
        <span aria-hidden="true">⌕</span>
        <input value={searchQuery} onChange={event => onQueryChange(event.target.value)} aria-label={label} placeholder={label} />
      </label>

      <div className="hvm2-search-summary" role="status" aria-live="polite" aria-atomic="true">
        {hasQuery ? <span>{allMatches.length} matched record{allMatches.length === 1 ? '' : 's'}</span> : <span>Indexed {searchRecords.length} authenticated record{searchRecords.length === 1 ? '' : 's'}</span>}
        {availableKinds.map(kind => <span key={kind}>{corpusCounts.get(kind) ?? 0} {SEARCH_KIND_LABELS[kind].toLowerCase()}</span>)}
      </div>

      <p className="hvm2-intel-search-scope">
        Session scope only — does not query the full reviewed corpus.{' '}
        <Link className="hvm2-text-link" href="/dashboard/signals/search">Search full corpus →</Link>
      </p>

      {availableKinds.length > 1 ? (
        <div className="hvm2-search-filters" role="group" aria-label="Search result type">
          <button type="button" className={activeKind === 'all' ? 'active' : ''} aria-pressed={activeKind === 'all'} onClick={() => setActiveKind('all')}>All</button>
          {availableKinds.map(kind => (
            <button key={kind} type="button" className={activeKind === kind ? 'active' : ''} aria-pressed={activeKind === kind} onClick={() => setActiveKind(kind)}>
              {SEARCH_KIND_LABELS[kind]}
            </button>
          ))}
        </div>
      ) : null}

      {hasQuery ? (
        <div className="hvm2-search-results">
          {visibleMatches.length > 0 ? (
            <ul aria-label="Command search results">
              {visibleMatches.map(record => (
                <li key={record.id}>
                  <button type="button" onClick={() => openRecord(record)} className="hvm2-intel-search-result">
                    <span className="hvm2-intel-search-kind">{record.kindLabel}</span>
                    <strong>{highlightMatch(record.title, searchQuery)}</strong>
                    {record.subtitle ? <p>{highlightMatch(record.subtitle, searchQuery)}</p> : null}
                    <small>
                      {[
                        record.jurisdiction,
                        record.category,
                        record.confidence != null ? `${record.confidence}% conf` : null,
                        record.corroborationCount && record.corroborationCount > 1 ? `${record.corroborationCount} sources` : null,
                        record.translated && record.originalLanguageLabel ? `via ${record.originalLanguageLabel}` : null,
                        record.sourceLabel,
                        record.dateLabel,
                        record.status,
                      ].filter(Boolean).join(' · ') || 'Metadata Unknown'}
                    </small>
                    <i aria-hidden="true">→</i>
                  </button>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No command records matched" detail="Try a jurisdiction, authority, operator, product, regulatory topic or commercial category already loaded in this session — or open full corpus search." />}
        </div>
      ) : (
        <div className="hvm2-intel-search-prompt">
          <strong>Search the loaded command corpus</strong>
          <p>Results appear only after a query. The indexed counts above describe session coverage, not the global signal store.</p>
        </div>
      )}
    </SectionShell>
  )
}

export function EducationSection({
  sectionRef,
  roleShort,
  tiles,
  commandHref,
}: {
  sectionRef: SectionRef
  roleShort: string
  tiles: EducationTile[]
  commandHref: (section: SectionId, changes?: Record<string, string | null>) => string
}) {
  return (
    <SectionShell id="education" sectionRef={sectionRef} eyebrow="Context / education path" title={`${roleShort} learning path`} description="Role-relevant education is kept in the same operational context as market, access and compliance work.">
      {tiles.length > 0 ? (
        <div className="hvm2-horizontal-deck">
          {tiles.map((tile, index) => {
            const moduleSlug = readString(tile, ['slug'], 'overview')
            const title = readString(tile, ['title'], 'Education module')
            const description = readString(tile, ['desc', 'description'], 'Role-relevant education content.')
            const icon = readString(tile, ['icon'], '◇')
            return (
              <article className="hvm2-education-card" key={`${moduleSlug}-${index}`}>
                <span aria-hidden="true">{icon}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link href={commandHref('education', { module: moduleSlug })}>Open module</Link>
              </article>
            )
          })}
        </div>
      ) : <EmptyState title="Education path pending" detail="No published modules matched the active role yet." />}
    </SectionShell>
  )
}

export function RegulatoryWatchSection({
  sectionRef, items, activeRules, rules, signals, regulatoryTier, outlook, sourceCoverageCount, commandHref,
}: {
  sectionRef: SectionRef
  items: WatchlistItem[]
  activeRules: number
  rules?: WatchRuleLike[]
  signals?: Signal[]
  regulatoryTier?: string | null
  outlook?: string | null
  sourceCoverageCount: number
  commandHref: (section: SectionId) => string
}) {
  const ruleHits = useMemo(
    () => matchWatchRuleHits(signals ?? [], rules ?? [], 12),
    [signals, rules],
  )

  return (
    <SectionShell
      id="regulatory"
      sectionRef={sectionRef}
      eyebrow="Intel / regulatory watch"
      title="Regulatory change under watch"
      description="Tracked regulatory objects, active watch rules and the reviewed posture of the current jurisdiction."
      action={<Link className="hvm2-text-link" href={commandHref('jurisdiction')}>Open jurisdiction context</Link>}
    >
      <div className="hvm2-metric-grid hvm2-regulatory-metrics">
        <Metric label="Tracked items" value={items.length} detail="Under active watch" />
        <Metric label="Watch rules" value={activeRules} detail="Active keyword rules" />
        <Metric label="Rule hits" value={ruleHits.length} detail="In this session feed" />
        <Metric label="Source coverage" value={sourceCoverageCount} detail="Registered jurisdiction sources" />
      </div>

      {regulatoryTier || outlook ? (
        <article className="hvm2-note hvm2-regulatory-posture">
          {regulatoryTier ? <StatusPill>{regulatoryTier}</StatusPill> : null}
          {outlook ? <p>{outlook}</p> : null}
        </article>
      ) : null}

      {activeRules > 0 ? (
        <section aria-labelledby="hvm2-rule-hits" className="hvm2-local-intel-groups">
          <div className="hvm2-intel-group-heading">
            <span>Keyword rules</span>
            <strong id="hvm2-rule-hits">Signals matching your watch</strong>
            <small>{ruleHits.length} in session</small>
          </div>
          {ruleHits.length > 0 ? (
            <div className="hvm2-intel-record-list" aria-label="Watch rule hits from loaded signals">
              {ruleHits.map(hit => (
                <article key={hit.signalId} className="hvm2-intel-record-card">
                  <div className="hvm2-intel-meta-row">
                    <span>{hit.market}</span>
                    {hit.confidence != null ? <span>{hit.confidence}% conf</span> : null}
                    {hit.timeAgo ? <span>{hit.timeAgo}</span> : null}
                  </div>
                  <strong>{hit.title}</strong>
                  <p>Matched: {hit.matchedKeywords.join(', ')}</p>
                  <small>Session scope — not a full-corpus watch scan</small>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matches in this session"
              detail="Active keyword rules did not hit any signal currently loaded into Command Centre. Silence here is not a guarantee the full corpus is quiet."
            />
          )}
        </section>
      ) : null}

      {items.length > 0 ? (
        <div className="hvm2-intel-record-list" aria-label={`All ${items.length} tracked regulatory items`}>
          {items.map(item => {
            const source = readString(item, ['source_name', 'source_label'], '')
            const date = readString(item, ['updated_at', 'last_changed_at', 'published_at'], '')
            const status = readString(item, ['status', 'watch_status'], '')
            const nextAction = readString(item, ['next_action'], '')
            return (
              <article key={readString(item, ['id'], `${readString(item, ['jurisdiction'], 'global')}-${readString(item, ['title'], 'watch')}`)} className="hvm2-intel-record-card">
                <div className="hvm2-intel-meta-row">
                  <span>{readString(item, ['jurisdiction'], 'Global')}</span>
                  <span>{readString(item, ['item_type'], 'Regulatory watch')}</span>
                  {status ? <span>{status}</span> : null}
                </div>
                <strong>{readString(item, ['title'], 'Untitled regulatory watch item')}</strong>
                <p>{readString(item, ['latest_change_note', 'subtitle'], 'No latest-change note is recorded for this watch item.')}</p>
                {(source || date) ? <small>{[source && `Source ${source}`, date].filter(Boolean).join(' · ')}</small> : <small>Evidence metadata Unknown</small>}
                {nextAction ? <div className="hvm2-intel-action"><span>Next action</span><p>{nextAction}</p></div> : null}
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState title="Nothing on the watch list yet" detail="Regulatory items added to the watch appear here with their latest recorded change." />
      )}
    </SectionShell>
  )
}

export function LocalIntelSection({
  sectionRef, localIntel, countryLabel,
}: {
  sectionRef: SectionRef
  localIntel: LocalIntel | null
  countryLabel: string
}) {
  const coverage = localIntel?.coverageStatus
  const localNotes = localIntel ? [...localIntel.constraints, ...localIntel.routes] : []

  return (
    <SectionShell
      id="local-intel"
      sectionRef={sectionRef}
      eyebrow="Intel / local intelligence"
      title={`Jurisdiction intelligence for ${countryLabel}`}
      description="National authorities, subdivision differences, market-access routes, constraints and unresolved local questions in the reviewed record set."
    >
      {!localIntel || coverage !== 'available' ? (
        <EmptyState
          title={coverage === 'not_applicable' ? 'No sub-national layer for this jurisdiction' : 'Local research pending'}
          detail={coverage === 'not_applicable'
            ? `${countryLabel} is recorded as nationally regulated without a subdivision layer in the current reviewed data.`
            : `Local intelligence for ${countryLabel} has not been researched and reviewed yet.`}
        />
      ) : (
        <div className="hvm2-local-intel-groups">
          {localIntel.authorities?.keyList?.length ? (
            <section aria-labelledby="hvm2-local-authorities">
              <div className="hvm2-intel-group-heading"><span>Authorities</span><strong id="hvm2-local-authorities">Regulating bodies</strong><small>{localIntel.authorities.keyList.length} records</small></div>
              <div className="hvm2-intel-record-list">
                {localIntel.authorities.keyList.map(a => (
                  <article className="hvm2-intel-record-card" key={`${a.name}-${a.role}`}>
                    <span className="hvm2-intel-record-type">Authority</span>
                    <strong>{a.name}</strong>
                    <p>{a.role}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {localIntel.municipalities.length > 0 ? (
            <section aria-labelledby="hvm2-local-subdivisions">
              <div className="hvm2-intel-group-heading"><span>Subdivisions</span><strong id="hvm2-local-subdivisions">Local activity</strong><small>{localIntel.municipalities.length} records</small></div>
              <div className="hvm2-intel-record-list">
                {localIntel.municipalities.map(m => (
                  <article className="hvm2-intel-record-card" key={m.name}>
                    <div className="hvm2-intel-meta-row"><span>Subdivision</span><span>{m.status || 'Status Unknown'}</span></div>
                    <strong>{m.name}</strong>
                    <p>{m.note ?? 'Local note Unknown'}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {localNotes.length > 0 ? (
            <section aria-labelledby="hvm2-local-routes">
              <div className="hvm2-intel-group-heading"><span>Routes & constraints</span><strong id="hvm2-local-routes">Operating differences</strong><small>{localNotes.length} records</small></div>
              <div className="hvm2-intel-record-list">
                {localNotes.map(note => {
                  const isRoute = localIntel.routes.includes(note)
                  return (
                    <article className="hvm2-intel-record-card" key={`${isRoute ? 'route' : 'constraint'}-${note.label}-${note.text.slice(0, 24)}`}>
                      <span className="hvm2-intel-record-type">{isRoute ? 'Market-access route' : 'Constraint'}</span>
                      <strong>{note.icon ? `${note.icon} ` : ''}{note.label}</strong>
                      <p>{note.text}</p>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : null}

          {localIntel.openQuestions.length > 0 ? (
            <section aria-labelledby="hvm2-local-questions">
              <div className="hvm2-intel-group-heading"><span>Unresolved</span><strong id="hvm2-local-questions">Open questions</strong><small>{localIntel.openQuestions.length} records</small></div>
              <article className="hvm2-note hvm2-open-questions">
                <StatusPill tone="warn">Open questions</StatusPill>
                <ul>{localIntel.openQuestions.map(q => <li key={q}>{q}</li>)}</ul>
              </article>
            </section>
          ) : null}
        </div>
      )}
    </SectionShell>
  )
}
