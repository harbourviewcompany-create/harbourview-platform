'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import type { MobileCommandCentreProps } from '../props'
import { readString, type SectionId } from '../contracts'
import { EmptyState, Metric, SectionShell, StatusPill, type SectionRef } from '../SectionUI'
import { CorpusWatchPanel } from '../CorpusWatchPanel'
import { matchWatchRuleHits, type WatchRuleLike } from '../watchRuleHits'

type Signal = MobileCommandCentreProps['signals'][number]
type WatchlistItem = NonNullable<MobileCommandCentreProps['watchlistData']>['items'][number]

export function RegulatoryWatchSection({ sectionRef, items, activeRules, rules, signals, regulatoryTier, outlook, sourceCoverageCount, commandHref }: {
  sectionRef: SectionRef; items: WatchlistItem[]; activeRules: number; rules?: WatchRuleLike[]; signals?: Signal[]; regulatoryTier?: string | null; outlook?: string | null; sourceCoverageCount: number; commandHref: (section: SectionId) => string
}) {
  const searchParams = useSearchParams()
  const countryCode = (searchParams.get('country') ?? '').toUpperCase()
  const countryLabel = ALL_COUNTRIES.find(country => country.iso2 === countryCode)?.displayName
  const ruleHits = useMemo(() => matchWatchRuleHits(signals ?? [], rules ?? [], 12), [signals, rules])

  return <SectionShell id="regulatory" sectionRef={sectionRef} eyebrow="Intel / regulatory watch" title="Regulatory change under watch" description="Tracked regulatory objects, session watch-rule hits, reviewed-corpus matches and the reviewed posture of the current jurisdiction." action={<Link className="hvm2-text-link" href={commandHref('jurisdiction')}>Open jurisdiction context</Link>}>
    <div className="hvm2-metric-grid hvm2-regulatory-metrics"><Metric label="Tracked items" value={items.length} detail="Under active watch" /><Metric label="Watch rules" value={activeRules} detail="Active keyword rules" /><Metric label="Rule hits" value={ruleHits.length} detail="In this session feed" /><Metric label="Source coverage" value={sourceCoverageCount} detail="Registered jurisdiction sources" /></div>
    {regulatoryTier || outlook ? <article className="hvm2-note hvm2-regulatory-posture">{regulatoryTier ? <StatusPill>{regulatoryTier}</StatusPill> : null}{outlook ? <p>{outlook}</p> : null}</article> : null}
    {activeRules > 0 ? <section aria-labelledby="hvm2-rule-hits" className="hvm2-local-intel-groups"><div className="hvm2-intel-group-heading"><span>Keyword rules</span><strong id="hvm2-rule-hits">Signals matching your watch</strong><small>{ruleHits.length} in session</small></div>{ruleHits.length > 0 ? <div className="hvm2-intel-record-list" aria-label="Watch rule hits from loaded signals">{ruleHits.map(hit => <article key={hit.signalId} className="hvm2-intel-record-card"><div className="hvm2-intel-meta-row"><span>{hit.market}</span>{hit.confidence != null ? <span>{hit.confidence}% conf</span> : null}{hit.timeAgo ? <span>{hit.timeAgo}</span> : null}</div><strong>{hit.title}</strong><p>Matched: {hit.matchedKeywords.join(', ')}</p><small>Session scope — not a full-corpus watch scan</small></article>)}</div> : <EmptyState title="No matches in this session" detail="Active keyword rules did not hit any signal currently loaded into Command Centre. Silence here is not a guarantee the full corpus is quiet." />}</section> : null}
    <CorpusWatchPanel countryLabel={countryLabel} />
    {items.length > 0 ? <div className="hvm2-intel-record-list" aria-label={`All ${items.length} tracked regulatory items`}>{items.map(item => { const source = readString(item, ['source_name','source_label'], ''); const date = readString(item, ['updated_at','last_changed_at','published_at'], ''); const status = readString(item, ['status','watch_status'], ''); const nextAction = readString(item, ['next_action'], ''); return <article key={readString(item, ['id'], `${readString(item, ['jurisdiction'], 'global')}-${readString(item, ['title'], 'watch')}`)} className="hvm2-intel-record-card"><div className="hvm2-intel-meta-row"><span>{readString(item, ['jurisdiction'], 'Global')}</span><span>{readString(item, ['item_type'], 'Regulatory watch')}</span>{status ? <span>{status}</span> : null}</div><strong>{readString(item, ['title'], 'Untitled regulatory watch item')}</strong><p>{readString(item, ['latest_change_note','subtitle'], 'No latest-change note is recorded for this watch item.')}</p>{source || date ? <small>{[source && `Source ${source}`, date].filter(Boolean).join(' · ')}</small> : <small>Evidence metadata Unknown</small>}{nextAction ? <div className="hvm2-intel-action"><span>Next action</span><p>{nextAction}</p></div> : null}</article> })}</div> : <EmptyState title="Nothing on the watch list yet" detail="Regulatory items added to the watch appear here with their latest recorded change." />}
  </SectionShell>
}
