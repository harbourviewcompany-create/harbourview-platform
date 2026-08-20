import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { SYNTHESIS_MARKETS } from '@/lib/intelligence/jurisdictionSynthesis'
import { flagEmoji } from '@/lib/utils/flagEmoji'

export const metadata: Metadata = {
  title: 'Global Cannabis Markets — Weekly Intelligence Briefings | Harbourview',
  description:
    'Weekly AI-synthesised intelligence briefings for 20+ active cannabis markets. Current legal status, market maturity, regulatory changes, and operator implications — updated every week.',
  openGraph: {
    title: 'Global Cannabis Market Intelligence | Harbourview',
    description:
      'Current market status, legal frameworks, and weekly intelligence briefings across the world\'s most active regulated cannabis markets.',
  },
}

// ISR: weekly market briefings
export const revalidate = 1800

type Briefing = {
  country_iso2: string
  country_name: string | null
  headline: string
  legal_status: string
  market_maturity: string
  summary: string
  week_ending: string
  signal_count: number
}

const MATURITY_COLOR: Record<string, string> = {
  emerging:   '#d4a84b',
  developing: '#5b9bd5',
  maturing:   '#4caf82',
  mature:     '#4caf82',
  restricted: '#e05555',
  unknown:    'rgba(245,240,232,.3)',
}

const LEGAL_LABEL: Record<string, string> = {
  medical_only:  'Medical',
  adult_use:     'Adult-use',
  decrim:        'Decrim',
  illegal:       'Prohibited',
  mixed:         'Mixed',
  transitional:  'Transitional',
  unknown:       'Unknown',
}

async function getAllBriefings(): Promise<Briefing[]> {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const svc = createClient(url, key, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
  const { data } = await svc
    .from('jurisdiction_briefings')
    .select('country_iso2, country_name, headline, legal_status, market_maturity, summary, week_ending, signal_count')
    .eq('status', 'published')
    .order('week_ending', { ascending: false })

  if (!data) return []

  // One per country — latest week only
  const seen = new Set<string>()
  const result: Briefing[] = []
  for (const row of data) {
    if (!seen.has(row.country_iso2)) {
      seen.add(row.country_iso2)
      result.push(row as Briefing)
    }
  }
  return result
}

export default async function MarketsPage() {
  const briefings = await getAllBriefings()
  const briefingMap = new Map(briefings.map(b => [b.country_iso2, b]))

  const hasBriefings = briefings.length > 0

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>

      <div className="mkt-wrap">
        {/* Header */}
        <header className="mkt-header">
          <Link href="/intelligence" className="mkt-back">← Intelligence</Link>
          <div className="mkt-eyebrow">Global Market Intelligence</div>
          <h1 className="mkt-title">Cannabis Market Briefings</h1>
          <p className="mkt-sub">
            Weekly synthesised intelligence across {SYNTHESIS_MARKETS.length} active regulated markets.
            {hasBriefings
              ? ` Last updated ${briefings[0]?.week_ending ?? ''}.`
              : ' Briefings are generated every Monday — check back soon.'}
          </p>
          {hasBriefings && (
            <div className="mkt-legend">
              {(['emerging', 'developing', 'maturing', 'mature'] as const).map(m => (
                <span key={m} className="mkt-legend-item">
                  <span className="mkt-legend-dot" style={{ background: MATURITY_COLOR[m] }} />
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Market grid */}
        <div className="mkt-grid">
          {SYNTHESIS_MARKETS.map(market => {
            const briefing = briefingMap.get(market.iso2)
            const flag = flagEmoji(market.iso2)
            const maturityColor = briefing ? (MATURITY_COLOR[briefing.market_maturity] ?? MATURITY_COLOR.unknown) : 'rgba(245,240,232,.15)'

            return (
              <Link
                key={market.iso2}
                href={`/intelligence/country/${market.iso2.toLowerCase()}`}
                className="mkt-card"
                style={{ '--accent': maturityColor } as React.CSSProperties}
              >
                <div className="mkt-card-top">
                  <span className="mkt-flag">{flag}</span>
                  <span className="mkt-iso">{market.iso2}</span>
                  {briefing && (
                    <span className="mkt-maturity" style={{ color: maturityColor, borderColor: `${maturityColor}40` }}>
                      {briefing.market_maturity}
                    </span>
                  )}
                </div>

                <h2 className="mkt-country">{market.name}</h2>

                {briefing ? (
                  <>
                    <div className="mkt-legal">
                      {LEGAL_LABEL[briefing.legal_status] ?? briefing.legal_status}
                    </div>
                    <p className="mkt-headline">{briefing.headline}</p>
                    <div className="mkt-footer">
                      <span className="mkt-signals">{briefing.signal_count} signals</span>
                      <span className="mkt-week">w/e {briefing.week_ending}</span>
                    </div>
                  </>
                ) : (
                  <p className="mkt-pending">Briefing pending — first synthesis runs Monday 03:00 UTC</p>
                )}

                <div className="mkt-card-accent" style={{ background: maturityColor }} />
              </Link>
            )
          })}
        </div>

        <footer className="mkt-footnote">
          <p>Briefings are AI-synthesised from Harbourview&apos;s curated intelligence signal database and reviewed before publication. They are orientation-level only and do not constitute legal, regulatory, or investment advice.</p>
          <div className="mkt-footnote-links">
            <Link href="/signals">Intelligence Signals →</Link>
            <Link href="/contact">Request Country Intelligence →</Link>
            <Link href="/intake">Start Confidential Intake →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.mkt-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.mkt-back {
  display: inline-block;
  font-size: 11px;
  color: #d4a84b;
  text-decoration: none;
  letter-spacing: .08em;
  margin-bottom: 32px;
}
.mkt-back:hover { opacity: .7; }

.mkt-header { margin-bottom: 40px; }
.mkt-eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: rgba(212,168,75,.7);
  margin-bottom: 12px;
}
.mkt-title {
  font-family: 'Georgia', serif;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 400;
  color: #f5f0e8;
  letter-spacing: -.01em;
  margin: 0 0 12px;
}
.mkt-sub {
  font-size: 14px;
  color: rgba(245,240,232,.5);
  max-width: 640px;
  line-height: 1.6;
  margin: 0 0 20px;
}
.mkt-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.mkt-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(245,240,232,.4);
}
.mkt-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mkt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.mkt-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.07);
  background: rgba(255,255,255,.02);
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: border-color .15s, background .15s, transform .12s;
}
.mkt-card:hover {
  border-color: var(--accent);
  background: rgba(255,255,255,.04);
  transform: translateY(-1px);
}
.mkt-card-accent {
  position: absolute;
  top: 0; left: 0;
  width: 3px;
  height: 100%;
  opacity: .5;
  border-radius: 12px 0 0 12px;
}

.mkt-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.mkt-flag { font-size: 18px; line-height: 1; }
.mkt-iso {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: .18em;
  color: rgba(245,240,232,.35);
}
.mkt-maturity {
  margin-left: auto;
  font-size: 9px;
  letter-spacing: .12em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid;
  font-weight: 600;
}

.mkt-country {
  font-size: 17px;
  font-weight: 600;
  color: #f5f0e8;
  margin: 0;
  line-height: 1.2;
}
.mkt-legal {
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(245,240,232,.35);
  font-weight: 500;
}
.mkt-headline {
  font-size: 12px;
  line-height: 1.55;
  color: rgba(245,240,232,.6);
  margin: 4px 0 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mkt-pending {
  font-size: 11px;
  color: rgba(245,240,232,.25);
  font-style: italic;
  margin: 4px 0 0;
}
.mkt-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,.05);
}
.mkt-signals, .mkt-week {
  font-size: 9px;
  color: rgba(245,240,232,.25);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.mkt-footnote {
  margin-top: 64px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,.06);
}
.mkt-footnote p {
  font-size: 11px;
  line-height: 1.7;
  color: rgba(245,240,232,.3);
  max-width: 640px;
  margin: 0 0 16px;
}
.mkt-footnote-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.mkt-footnote-links a {
  font-size: 11px;
  color: #d4a84b;
  text-decoration: none;
}
.mkt-footnote-links a:hover { opacity: .7; }
`
