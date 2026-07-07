import type { Metadata } from 'next'

import { getLatestDailyDigest } from '@/lib/harbourview/digest'
import type { HvDigestHeadlineDto } from '@/lib/harbourview/dto'
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

function formatDigestDate(value: string) {
  const parsed = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function groupByMarket(headlines: HvDigestHeadlineDto[]) {
  const groups = new Map<string, HvDigestHeadlineDto[]>()
  for (const item of headlines) {
    const market = item.market?.trim() || 'Global'
    const bucket = groups.get(market)
    if (bucket) bucket.push(item)
    else groups.set(market, [item])
  }
  return Array.from(groups.entries())
}

export default async function DailyDigestPage() {
  const { digest } = await getLatestDailyDigest()
  const grouped = groupByMarket(digest.headlines)

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
                  <p className="text-lg font-semibold text-[#f4f1eb]">{digest.headlines.length}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/42">Headlines</p>
                </div>
                <div className="rounded border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-lg font-semibold text-[#f4f1eb]">{digest.markets.length}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/42">Markets</p>
                </div>
              </div>
              <p className="mt-5 text-xs leading-6 text-white/48">
                Edition: {formatDigestDate(digest.digest_date)}
              </p>
            </PublicCard>
          ) : undefined
        }
      >
        <p>
          A free daily read on the regulated cannabis world — the most commercially important regulatory, licensing,
          market and enforcement developments from Harbourview&apos;s qualified signal pipeline, distilled into
          headlines with one line of editorial context each.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          This is the open edition. Full signal detail, all tracked markets, country briefings and alerts are part of
          Harbourview Pro.
        </p>
      </PublicHero>

      {digest && grouped.length > 0 ? (
        <PublicSection tone="dark">
          <SectionHeader eyebrow={formatDigestDate(digest.digest_date)} title="What moved, and why it matters.">
            Curated from qualified intelligence signals. Ordered by commercial importance.
          </SectionHeader>
          <div className="space-y-10">
            {grouped.map(([market, items]) => (
              <div key={market}>
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">{market}</p>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {items.map((item, index) => (
                    <PublicCard key={item.signal_id ?? `${market}-${index}`} className="p-6">
                      <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
                      <h2 className="mb-4 text-lg font-semibold leading-snug text-[#f4f1eb]">{item.headline}</h2>
                      <p className="text-sm leading-7 text-white/58">
                        <span className="font-semibold text-gold/80">Why it matters: </span>
                        {item.why_it_matters}
                      </p>
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
        </PublicSection>
      ) : (
        <PublicSection tone="dark">
          <SectionHeader eyebrow="Harbourview Daily" title="Today's briefing is being prepared.">
            The daily edition publishes each morning once qualified signals clear review. Check back shortly, or
            explore the public signals feed in the meantime.
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
