import type { Metadata } from 'next'

import { getLatestDailyDigest, formatDigestDateLabel } from '@/lib/harbourview/digest'
import type { HvDigestHeadlineDto, HvEditorialHeadlineDto, HvDigestPriorityDomain } from '@/lib/harbourview/dto'
import { PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

// Force dynamic rendering — page fetches live Supabase data at request time
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Daily Cannabis Intelligence Briefing — Regulatory & Market Headlines',
  description:
    'Free daily headlines from Harbourview intelligence: qualified cannabis regulatory, licensing, market and enforcement signals with editorial context — updated every morning.',
  openGraph: {
    title: 'Daily Cannabis Intelligence Briefing | Harbourview',
    description:
      'Free daily headlines from Harbourview intelligence: qualified cannabis regulatory, licensing, market and enforcement signals with editorial context.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harbourview Daily — Cannabis Intelligence Headlines',
    description:
      'Qualified cannabis regulatory and market signals, distilled into daily headlines with editorial context.',
  },
  alternates: { canonical: '/daily' },
}

const PRIORITY_DOMAIN_LABELS: Record<HvDigestPriorityDomain, string> = {
  global_medical: 'Global medical',
  import_export_eu_gmp: 'Import / export · EU-GMP',
  m_and_a: 'M&A',
  licensing_regulatory: 'Licensing / regulation',
  commercial_distribution: 'Commercial distribution',
  genetics: 'Genetics',
  formulations: 'Formulations',
  pharmaceutical_cannabinoid_technology: 'Pharmaceutical cannabinoid technology',
  other: 'Other',
}

function groupByMarket<T extends { market: string }>(headlines: T[]) {
  const groups = new Map<string, T[]>()
  for (const item of headlines) {
    const market = item.market?.trim() || 'Global'
    const bucket = groups.get(market)
    if (bucket) bucket.push(item)
    else groups.set(market, [item])
  }
  return Array.from(groups.entries())
}

function DeltaMeta({ item }: { item: HvDigestHeadlineDto }) {
  const isAdvancement = item.delta_status === 'material_advancement'
  const isNew = item.delta_status === 'new_event'
  return (
    <div className="mb-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
      {isAdvancement && (
        <span className="rounded-full border border-gold/35 bg-gold/[0.08] px-3 py-1 text-gold/85">
          Material advancement
        </span>
      )}
      {isNew && (
        <span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-white/62">
          New event
        </span>
      )}
      <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1 text-white/48">
        {PRIORITY_DOMAIN_LABELS[item.priority_domain]}
      </span>
      {item.competitive_position_change && (
        <span className="rounded-full border border-gold/50 bg-gold/[0.12] px-3 py-1 text-gold">
          Competitive position changed
        </span>
      )}
    </div>
  )
}

export default async function DailyDigestPage() {
  const { digest } = await getLatestDailyDigest()
  const grouped = groupByMarket(digest.headlines)
  const groupedEditorial = groupByMarket(digest.editorial_headlines)
  const hasContent = grouped.length > 0 || groupedEditorial.length > 0
  const competitiveChanges = digest.headlines.filter((item) => item.competitive_position_change).length
  const materialAdvancements = digest.headlines.filter((item) => item.delta_status === 'material_advancement').length

  return (
    <main>
      <PublicHero
        eyebrow="Harbourview Daily"
        title="Today's cannabis intelligence headlines."
        actions={[
          { label: 'Get the Full Briefing', href: '/intake' },
          { label: 'Explore Signals', href: '/signals', variant: 'secondary' },
        ]}
        aside={
          digest ? (
            <PublicCard className="p-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">
                Briefing snapshot
              </p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-lg font-semibold text-[#f4f1eb]">{digest.headlines.length + digest.editorial_headlines.length}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/42">Headlines</p>
                </div>
                <div className="rounded border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-lg font-semibold text-[#f4f1eb]">{digest.markets.length}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/42">Markets</p>
                </div>
                <div className="rounded border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-lg font-semibold text-[#f4f1eb]">{materialAdvancements}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/42">Advancements</p>
                </div>
                <div className="rounded border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-lg font-semibold text-[#f4f1eb]">{competitiveChanges}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/42">Position shifts</p>
                </div>
              </div>
              <p className="mt-5 text-xs leading-6 text-white/48">
                Edition: {formatDigestDateLabel(digest.digest_date)}
              </p>
            </PublicCard>
          ) : undefined
        }
      >
        <p>
          A free daily read on the regulated cannabis world — only genuinely new developments and material advances
          that cleared Harbourview&apos;s qualified signal pipeline and cross-edition event comparison.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Repeated coverage and unchanged follow-on commentary are suppressed from the trade briefing while underlying
          source evidence remains retained internally.
        </p>
      </PublicHero>

      {digest && hasContent ? (
        <PublicSection tone="dark">
          <SectionHeader eyebrow={formatDigestDateLabel(digest.digest_date)} title="What changed since the last edition.">
            New events and material advancements only, ordered by commercial importance. Competitive-position changes are flagged explicitly.
          </SectionHeader>
          {grouped.length > 0 && (
            <div className="space-y-10">
              {grouped.map(([market, items]) => (
                <div key={market}>
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">{market}</p>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {items.map((item, index) => (
                      <PublicCard key={item.event_key ?? item.signal_id ?? `${market}-${index}`} className="p-6">
                        <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
                        <DeltaMeta item={item} />
                        <h2 className="mb-4 text-lg font-semibold leading-snug text-[#f4f1eb]">{item.headline}</h2>
                        <p className="text-sm leading-7 text-white/58">
                          <span className="font-semibold text-gold/80">Why it matters: </span>
                          {item.why_it_matters}
                        </p>
                        {item.advancement_reason && (
                          <p className="mt-4 text-sm leading-7 text-white/54">
                            <span className="font-semibold text-gold/80">What advanced: </span>
                            {item.advancement_reason}
                          </p>
                        )}
                        {item.competitive_position_change && item.competitive_position_detail && (
                          <p className="mt-4 rounded border border-gold/25 bg-gold/[0.05] p-3 text-sm leading-7 text-white/62">
                            <span className="font-semibold text-gold/90">Competitive-position change: </span>
                            {item.competitive_position_detail}
                          </p>
                        )}
                        {item.entities.length > 0 && (
                          <p className="mt-4 text-xs leading-6 text-white/42">
                            Entities: {item.entities.join(' · ')}
                          </p>
                        )}
                        {(item.verified_facts.length > 0 || item.inferences.length > 0) && (
                          <div className="mt-5 grid gap-4 border-t border-white/8 pt-4 sm:grid-cols-2">
                            <div>
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Verified facts</p>
                              {item.verified_facts.length > 0 ? (
                                <ul className="space-y-1 text-xs leading-6 text-white/52">
                                  {item.verified_facts.map((fact) => <li key={fact}>• {fact}</li>)}
                                </ul>
                              ) : <p className="text-xs text-white/36">None separately recorded.</p>}
                            </div>
                            <div>
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Inference</p>
                              {item.inferences.length > 0 ? (
                                <ul className="space-y-1 text-xs leading-6 text-white/52">
                                  {item.inferences.map((inference) => <li key={inference}>• {inference}</li>)}
                                </ul>
                              ) : <p className="text-xs text-white/36">No separate inference recorded.</p>}
                            </div>
                          </div>
                        )}
                        {item.whats_next && (
                          <p className="mt-4 text-sm leading-7 text-white/48">
                            <span className="font-semibold text-gold/80">What&apos;s next: </span>
                            {item.whats_next}
                          </p>
                        )}
                      </PublicCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {groupedEditorial.length > 0 && (
            <div className={grouped.length > 0 ? 'mt-14 space-y-10' : 'space-y-10'}>
              <SectionHeader eyebrow="Global Cannabis News" title="This week, beyond the trade press.">
                Editorial coverage from mainstream news outlets worldwide, rewritten in Harbourview&apos;s voice —
                emerging markets first.
              </SectionHeader>
              {groupedEditorial.map(([market, items]) => (
                <div key={market}>
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color: 'rgba(184,175,158,0.72)' }}>{market}</p>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {items.map((item: HvEditorialHeadlineDto, index: number) => (
                      <PublicCard key={item.item_id ?? `${market}-editorial-${index}`} className="p-6">
                        <div className="mb-5 h-px w-12" style={{ background: 'linear-gradient(to right, #B8AF9E, rgba(184,175,158,0.4))' }} />
                        <h2 className="mb-4 text-lg font-semibold leading-snug text-[#f4f1eb]">{item.headline}</h2>
                        <p className="text-sm leading-7 text-white/58">{item.why_it_matters}</p>
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-block text-sm font-semibold underline"
                            style={{ color: '#B8AF9E' }}
                          >
                            Read at {item.outlet_name ?? 'source'} →
                          </a>
                        )}
                      </PublicCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PublicSection>
      ) : (
        <PublicSection tone="dark">
          <SectionHeader eyebrow="Harbourview Daily" title="Today's briefing is being prepared.">
            The daily edition publishes once genuinely new or materially advanced qualified signals clear review.
            An empty trade edition can therefore mean the prior briefing remains current rather than that the pipeline failed.
          </SectionHeader>
        </PublicSection>
      )}

      <PublicSection tone="navy">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <SectionHeader eyebrow="Harbourview Pro" title="This is a fraction of the picture." className="mb-0">
              The daily edition covers a handful of headlines. Pro members get the full qualified signal feed across
              every tracked market, country intelligence briefings, and alerts when developments hit their markets of
              interest.
            </SectionHeader>
          </div>
          <PublicCard className="p-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/78">Included in Pro</p>
            <ul className="space-y-3 text-sm leading-7 text-white/58">
              <li>Full signal feed — every qualified signal, every market</li>
              <li>Country intelligence briefings and market dossiers</li>
              <li>Market and category alerts</li>
            </ul>
            <a href="/intake" className="btn-marketplace mt-6 min-h-[52px] w-full justify-center text-center">
              <span>Request Access</span>
              <span aria-hidden="true" className="text-xl leading-none">→</span>
            </a>
          </PublicCard>
        </div>
      </PublicSection>

      <PublicSection tone="dark">
        <p className="max-w-3xl text-xs leading-6 text-white/42">
          Harbourview Daily summaries are informational only and are not legal advice, market entry clearance,
          transaction confirmation or regulatory certainty. Headlines are generated from reviewed intelligence signals
          and reflect source material as captured; verify independently before acting.
        </p>
      </PublicSection>
    </main>
  )
}
