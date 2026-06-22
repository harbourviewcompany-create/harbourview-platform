// app/intelligence/logistics-trade-routes/page.tsx
// Replaces the static IntelligenceModulePage wrapper with a genuine live-data surface.
// Sources: jurisdiction_briefings (market status per corridor endpoint),
//          jurisdiction_playbooks (licensing steps relevant to trade),
//          signals table (trade/logistics-tagged signals).
// No private route data exposed — only publicly available market intelligence.

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { SYNTHESIS_MARKETS } from '@/lib/intelligence/jurisdictionSynthesis'

export const metadata: Metadata = {
  title: 'Logistics & Trade Routes — Cannabis Corridor Intelligence | Harbourview',
  description:
    'Trade corridor context and market status for regulated cannabis export and import. Live intelligence across 20+ markets — documentation frameworks, regulatory gates, and operator implications.',
  openGraph: {
    title: 'Cannabis Logistics & Trade Route Intelligence | Harbourview',
    description:
      'Orientation-level logistics intelligence for regulated cannabis corridors. Current market status, documentation requirements, and regulatory gates across 20+ active markets.',
  },
}

export const dynamic = 'force-dynamic'

// ── Corridor definitions (major regulated export/import pairs) ───────────────
// Each corridor pairs a source market with a destination; both must have playbooks.
// Displayed in order of commercial volume / regulatory maturity.
const CORRIDORS = [
  { from: 'CA', to: 'DE', label: 'Canada → Germany', notes: 'EU-GMP requirement for German import; Health Canada export licence + Narcotics Control Regulations; BfArM import authorisation.' },
  { from: 'CA', to: 'AU', label: 'Canada → Australia', notes: 'TGA Office of Drug Control import permit; Health Canada export licence; Narcotic Drugs Act 1967 framework.' },
  { from: 'CO', to: 'DE', label: 'Colombia → Germany', notes: 'INVIMA GMP + EU-GMP mutual recognition not yet in place; interim GMP recognition pathway; DEA 357 equivalent required.' },
  { from: 'IL', to: 'DE', label: 'Israel → Germany', notes: 'IMCA export licence; EU-GMP certification in-progress for Israeli producers; narcotics import certificate.' },
  { from: 'ZA', to: 'DE', label: 'South Africa → Germany', notes: 'SAHPRA export licence; EU-GMP or equivalence pathway; growing corridor with Lesotho/SA producers.' },
  { from: 'PT', to: 'DE', label: 'Portugal → Germany', notes: 'Intra-EU corridor; Infarmed licence; EU-GMP inherently satisfied; narcotics transport permit per 1961 convention.' },
  { from: 'NL', to: 'DE', label: 'Netherlands → Germany', notes: 'Intra-EU corridor; OMC wholesale authorisation; shortest regulatory lead time of major corridors.' },
  { from: 'AU', to: 'GB', label: 'Australia → United Kingdom', notes: 'TGA export licence; MHRA import licence; Schedule 1-to-2 reclassification pathway for individual products.' },
  { from: 'CA', to: 'GB', label: 'Canada → United Kingdom', notes: 'Health Canada export licence; MHRA specials import authorisation; UK-specific GMP certificate required.' },
  { from: 'MX', to: 'CA', label: 'Mexico → Canada', notes: 'COFEPRIS export licence; Health Canada import licence; cannabis not yet in CUSMA trade provisions.' },
  { from: 'TH', to: 'AU', label: 'Thailand → Australia', notes: 'Emerging corridor; FDA Thailand export; TGA import permit; cold-chain standard alignment in progress.' },
  { from: 'BR', to: 'PT', label: 'Brazil → Portugal', notes: 'ANVISA export; Infarmed import; Brazil–Portugal phytosanitary equivalence discussion ongoing.' },
]

type Briefing = {
  country_iso2: string
  legal_status: string
  market_maturity: string
  headline: string
  week_ending: string
  signal_count: number
}

type LogisticsSignal = {
  id: string
  headline: string
  country: string | null
  date: string | null
  top_lane: string | null
  cat: string | null
}

async function getMarketBriefings(): Promise<Map<string, Briefing>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return new Map()

  const svc = createClient(url, key, { auth: { persistSession: false } })
  const { data } = await svc
    .from('jurisdiction_briefings')
    .select('country_iso2, legal_status, market_maturity, headline, week_ending, signal_count')
    .eq('status', 'published')
    .order('week_ending', { ascending: false })

  if (!data) return new Map()

  const seen = new Set<string>()
  const map = new Map<string, Briefing>()
  for (const row of data) {
    if (!seen.has(row.country_iso2)) {
      seen.add(row.country_iso2)
      map.set(row.country_iso2, row as Briefing)
    }
  }
  return map
}

async function getLogisticsSignals(): Promise<LogisticsSignal[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const svc = createClient(url, key, { auth: { persistSession: false } })
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data } = await svc
    .from('signals')
    .select('id, headline, country, date, top_lane, cat')
    .eq('reviewed', true)
    .gte('date', cutoff)
    .or('top_lane.ilike.%logist%,top_lane.ilike.%trade%,top_lane.ilike.%export%,top_lane.ilike.%import%,cat.ilike.%logist%,cat.ilike.%trade%,cat.ilike.%supply%')
    .order('date', { ascending: false })
    .limit(24)

  return (data ?? []) as LogisticsSignal[]
}

const MATURITY_COLOR: Record<string, string> = {
  emerging: '#d4a84b', developing: '#5b9bd5', maturing: '#4caf82',
  mature: '#4caf82', restricted: '#e05555', unknown: 'rgba(245,240,232,.25)',
}

const LEGAL_LABEL: Record<string, string> = {
  medical_only: 'Medical', adult_use: 'Adult-use', decrim: 'Decrim',
  illegal: 'Prohibited', mixed: 'Mixed', transitional: 'Transitional', unknown: '—',
}

const FLAGS: Record<string, string> = {
  DE: '🇩🇪', GB: '🇬🇧', AU: '🇦🇺', CA: '🇨🇦', NL: '🇳🇱',
  PT: '🇵🇹', TH: '🇹🇭', IL: '🇮🇱', CO: '🇨🇴', ZA: '🇿🇦',
  MT: '🇲🇹', LU: '🇱🇺', CZ: '🇨🇿', NZ: '🇳🇿', MX: '🇲🇽',
  BR: '🇧🇷', CH: '🇨🇭', FR: '🇫🇷', ES: '🇪🇸', PL: '🇵🇱',
}

const NAMES: Record<string, string> = {
  DE: 'Germany', GB: 'United Kingdom', AU: 'Australia', CA: 'Canada',
  NL: 'Netherlands', PT: 'Portugal', TH: 'Thailand', IL: 'Israel',
  CO: 'Colombia', ZA: 'South Africa', MT: 'Malta', LU: 'Luxembourg',
  CZ: 'Czechia', NZ: 'New Zealand', MX: 'Mexico', BR: 'Brazil',
  CH: 'Switzerland', FR: 'France', ES: 'Spain', PL: 'Poland',
}

export default async function LogisticsTradeRoutesPage() {
  const [briefings, signals] = await Promise.all([
    getMarketBriefings(),
    getLogisticsSignals(),
  ])

  const hasBriefings = briefings.size > 0
  const hasSignals = signals.length > 0

  // Markets active in at least one corridor as source or destination
  const corridorMarkets = new Set(CORRIDORS.flatMap(c => [c.from, c.to]))
  const allMarkets = SYNTHESIS_MARKETS.filter(m => corridorMarkets.has(m.iso2))

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>
      <div className="lt-wrap">

        <nav className="lt-nav">
          <Link href="/intelligence" className="lt-nav-link">Intelligence</Link>
          <span className="lt-nav-sep">›</span>
          <span className="lt-nav-cur">Logistics & Trade Routes</span>
        </nav>

        <header className="lt-header">
          <p className="lt-eyebrow">Intelligence / Logistics</p>
          <h1 className="lt-title">Cannabis Trade Corridor Intelligence</h1>
          <p className="lt-sub">
            Orientation-level intelligence for regulated cannabis export and import corridors.
            Current market status, documentation frameworks, and regulatory gates across{' '}
            {SYNTHESIS_MARKETS.length} active markets — sourced from Harbourview&apos;s{' '}
            348-source intelligence registry.
          </p>
          <div className="lt-hd-chips">
            <span className="lt-chip">{CORRIDORS.length} tracked corridors</span>
            <span className="lt-chip">{allMarkets.length} endpoint markets</span>
            {hasSignals && <span className="lt-chip">{signals.length} recent trade signals</span>}
            {hasBriefings && <span className="lt-chip">Live market status</span>}
          </div>
        </header>

        {/* Privacy boundary notice */}
        <div className="lt-boundary">
          <span className="lt-boundary-ico">⚠</span>
          <p>
            Harbourview does not publish operator identities, commercial terms, or private route
            analysis on public-facing pages. The intelligence below is orientation-level only.
            Qualified operators can request reviewed private corridor analysis through the intake process.
          </p>
        </div>

        {/* Corridor grid */}
        <section className="lt-section">
          <h2 className="lt-section-title">Active Export–Import Corridors</h2>
          <p className="lt-section-sub">
            Major regulated corridors by documentation framework complexity. Live market status shown
            for each endpoint where a current briefing exists.
          </p>
          <div className="lt-corridors">
            {CORRIDORS.map(corridor => {
              const fromBriefing = briefings.get(corridor.from)
              const toBriefing = briefings.get(corridor.to)
              const fromColor = fromBriefing ? (MATURITY_COLOR[fromBriefing.market_maturity] ?? MATURITY_COLOR.unknown) : MATURITY_COLOR.unknown
              const toColor = toBriefing ? (MATURITY_COLOR[toBriefing.market_maturity] ?? MATURITY_COLOR.unknown) : MATURITY_COLOR.unknown

              return (
                <div key={`${corridor.from}-${corridor.to}`} className="lt-corridor-card">
                  <div className="lt-corridor-header">
                    <span className="lt-corridor-label">{corridor.label}</span>
                    <span className="lt-corridor-arrow">→</span>
                  </div>

                  <div className="lt-corridor-endpoints">
                    <Link href={`/intelligence/playbooks/${corridor.from.toLowerCase()}`} className="lt-endpoint">
                      <span className="lt-ep-flag">{FLAGS[corridor.from] ?? '🌐'}</span>
                      <div className="lt-ep-meta">
                        <span className="lt-ep-name">{NAMES[corridor.from] ?? corridor.from}</span>
                        {fromBriefing && (
                          <span className="lt-ep-status" style={{ color: fromColor }}>
                            {LEGAL_LABEL[fromBriefing.legal_status]}
                            {' · '}{fromBriefing.market_maturity}
                          </span>
                        )}
                      </div>
                      <span className="lt-ep-role">Source</span>
                    </Link>

                    <span className="lt-corridor-dir">→</span>

                    <Link href={`/intelligence/playbooks/${corridor.to.toLowerCase()}`} className="lt-endpoint">
                      <span className="lt-ep-flag">{FLAGS[corridor.to] ?? '🌐'}</span>
                      <div className="lt-ep-meta">
                        <span className="lt-ep-name">{NAMES[corridor.to] ?? corridor.to}</span>
                        {toBriefing && (
                          <span className="lt-ep-status" style={{ color: toColor }}>
                            {LEGAL_LABEL[toBriefing.legal_status]}
                            {' · '}{toBriefing.market_maturity}
                          </span>
                        )}
                      </div>
                      <span className="lt-ep-role">Destination</span>
                    </Link>
                  </div>

                  <p className="lt-corridor-notes">{corridor.notes}</p>

                  <div className="lt-corridor-links">
                    <Link href={`/intelligence/playbooks/${corridor.from.toLowerCase()}`} className="lt-corr-link">
                      {NAMES[corridor.from]} playbook →
                    </Link>
                    <Link href={`/intelligence/playbooks/${corridor.to.toLowerCase()}`} className="lt-corr-link">
                      {NAMES[corridor.to]} playbook →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Market status grid — all endpoint markets */}
        <section className="lt-section">
          <h2 className="lt-section-title">Corridor Endpoint Market Status</h2>
          <p className="lt-section-sub">
            Current legal framework and market maturity for all active source and destination markets.
          </p>
          <div className="lt-markets">
            {allMarkets.map(market => {
              const briefing = briefings.get(market.iso2)
              const color = briefing ? (MATURITY_COLOR[briefing.market_maturity] ?? MATURITY_COLOR.unknown) : MATURITY_COLOR.unknown
              return (
                <Link
                  key={market.iso2}
                  href={`/intelligence/playbooks/${market.iso2.toLowerCase()}`}
                  className="lt-market-card"
                  style={{ '--accent': color } as React.CSSProperties}
                >
                  <div className="lt-mc-top">
                    <span className="lt-mc-flag">{FLAGS[market.iso2] ?? '🌐'}</span>
                    <span className="lt-mc-iso">{market.iso2}</span>
                    {briefing && (
                      <span className="lt-mc-mat" style={{ color, borderColor: `${color}40` }}>
                        {briefing.market_maturity}
                      </span>
                    )}
                  </div>
                  <p className="lt-mc-name">{market.name}</p>
                  {briefing ? (
                    <p className="lt-mc-legal">{LEGAL_LABEL[briefing.legal_status]}</p>
                  ) : (
                    <p className="lt-mc-pending">Briefing pending</p>
                  )}
                  <div className="lt-mc-accent" style={{ background: color }} />
                </Link>
              )
            })}
          </div>
        </section>

        {/* Logistics signals */}
        {hasSignals && (
          <section className="lt-section">
            <h2 className="lt-section-title">Recent Trade & Logistics Signals</h2>
            <p className="lt-section-sub">
              From Harbourview&apos;s curated intelligence signal database — last 90 days, logistics and trade-tagged.
            </p>
            <div className="lt-signals">
              {signals.map(sig => (
                <div key={sig.id} className="lt-signal">
                  <div className="lt-signal-meta">
                    {sig.country && <span className="lt-signal-country">{sig.country}</span>}
                    {sig.top_lane && <span className="lt-signal-lane">{sig.top_lane}</span>}
                    {sig.date && <span className="lt-signal-date">{sig.date}</span>}
                  </div>
                  <p className="lt-signal-headline">{sig.headline}</p>
                </div>
              ))}
            </div>
            <Link href="/signals" className="lt-signals-more">View all intelligence signals →</Link>
          </section>
        )}

        {/* Documentation framework orientation */}
        <section className="lt-section lt-section--doc">
          <h2 className="lt-section-title">Documentation Framework Orientation</h2>
          <p className="lt-section-sub">
            Key documentation layers for regulated cannabis international trade. This is orientation-level only —
            specific requirements vary by corridor, product category, and calendar year.
          </p>
          <div className="lt-docs">
            {[
              {
                title: 'Export authorisation',
                body: 'Source-market competent authority export licence or certificate. Typically issued by the national drugs regulator (e.g. Health Canada, INVIMA, IMCA). Required before any cross-border movement.',
                ref: 'Health Canada / INVIMA / IMCA',
              },
              {
                title: 'Import authorisation / permit',
                body: 'Destination-market import licence or narcotics import certificate. EU markets require BfArM / Infarmed / AGES narcotics import permits aligned to the 1961 Single Convention framework.',
                ref: 'BfArM / Infarmed / TGA / MHRA',
              },
              {
                title: 'GMP certification',
                body: 'EU market imports require EU-GMP or equivalently recognised manufacturing certification. Non-EU producers (Canada, Colombia, South Africa) must obtain EU-GMP certification or demonstrate equivalence on a product-by-product basis.',
                ref: 'EudraGMDP / Health Canada',
              },
              {
                title: 'Phytosanitary certificate',
                body: 'Required for plant-origin products. Issued by the export-country national plant protection organisation. Not applicable to extracted or processed products in most corridors.',
                ref: 'IPPC / national NPPO',
              },
              {
                title: 'Certificate of Analysis (CoA)',
                body: 'Batch-specific analytical report from an accredited laboratory. Destination-market regulators typically require CoA from both a source-market and a destination-market accredited lab for controlled substance imports.',
                ref: 'ISO 17025 accredited lab',
              },
              {
                title: 'Cold chain documentation',
                body: 'GDP-aligned temperature excursion log, packaging qualification, and carrier qualification records. Required for medicinal cannabis products in most regulated destination markets.',
                ref: 'EU GDP Guidelines / WHO TRS 961',
              },
            ].map(doc => (
              <div key={doc.title} className="lt-doc-card">
                <h3 className="lt-doc-title">{doc.title}</h3>
                <p className="lt-doc-body">{doc.body}</p>
                <p className="lt-doc-ref">{doc.ref}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="lt-cta">
          <div>
            <p className="lt-cta-eyebrow">Private corridor intelligence</p>
            <h2 className="lt-cta-title">Route analysis for qualified operators</h2>
            <p className="lt-cta-body">
              Harbourview provides reviewed, operator-specific route intelligence — including counterparty
              introduction, documentation review, regulatory timing, and corridor viability analysis — to
              qualified operators through a confidential intake process. Not published here.
            </p>
            <div className="lt-cta-actions">
              <Link href="/intake" className="lt-gold">Start confidential intake →</Link>
              <Link href="/contact" className="lt-ghost">Contact Harbourview</Link>
            </div>
          </div>
        </section>

        <footer className="lt-footnote">
          <p>
            Logistics and trade route intelligence is orientation-level only and does not constitute legal, regulatory,
            transport, or compliance advice. Documentation requirements change frequently and vary by product category,
            jurisdiction, and time. Verify current requirements with qualified local counsel and your market regulatory
            authority before shipping product.
          </p>
          <div className="lt-footnote-links">
            <Link href="/intelligence/playbooks">Market Entry Playbooks →</Link>
            <Link href="/markets">Market Briefings →</Link>
            <Link href="/intelligence/licensing-pathways">Licensing Pathways →</Link>
            <Link href="/signals">Signals →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.lt-wrap{max-width:1100px;margin:0 auto;padding:48px 24px 80px}
.lt-nav{display:flex;align-items:center;gap:8px;margin-bottom:40px;flex-wrap:wrap}
.lt-nav-link{font-size:11px;letter-spacing:.08em;color:#d4a84b;text-decoration:none}
.lt-nav-link:hover{opacity:.7}
.lt-nav-sep{color:rgba(245,240,232,.2);font-size:11px}
.lt-nav-cur{font-size:11px;color:rgba(245,240,232,.4)}
.lt-header{margin-bottom:32px}
.lt-eyebrow{font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(212,168,75,.7);margin-bottom:12px}
.lt-title{font-family:Georgia,serif;font-size:clamp(26px,4vw,44px);font-weight:400;color:#f5f0e8;letter-spacing:-.01em;margin:0 0 14px}
.lt-sub{font-size:14px;color:rgba(245,240,232,.55);max-width:680px;line-height:1.7;margin:0 0 18px}
.lt-hd-chips{display:flex;flex-wrap:wrap;gap:8px}
.lt-chip{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);font-size:11px;color:rgba(245,240,232,.5);font-family:'JetBrains Mono',ui-monospace,monospace}
.lt-boundary{display:flex;gap:12px;align-items:flex-start;padding:16px 20px;border-radius:8px;border:1px solid rgba(212,168,75,.15);background:rgba(212,168,75,.03);margin-bottom:40px}
.lt-boundary-ico{color:rgba(212,168,75,.5);font-size:14px;flex-shrink:0;margin-top:2px}
.lt-boundary p{font-size:12px;line-height:1.65;color:rgba(245,240,232,.45);margin:0}
.lt-section{margin-bottom:48px}
.lt-section--doc{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:28px 32px}
.lt-section-title{font-family:Georgia,serif;font-size:20px;font-weight:400;color:#f5f0e8;margin:0 0 8px}
.lt-section-sub{font-size:13px;color:rgba(245,240,232,.45);max-width:620px;line-height:1.65;margin:0 0 24px}
.lt-corridors{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
.lt-corridor-card{padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);display:flex;flex-direction:column;gap:12px}
.lt-corridor-header{display:flex;align-items:center;justify-content:space-between}
.lt-corridor-label{font-size:13px;font-weight:600;color:rgba(245,240,232,.8)}
.lt-corridor-arrow{color:rgba(212,168,75,.4);font-size:16px}
.lt-corridor-endpoints{display:flex;align-items:center;gap:8px}
.lt-endpoint{display:flex;align-items:center;gap:8px;text-decoration:none;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);flex:1;transition:border-color .15s}
.lt-endpoint:hover{border-color:rgba(212,168,75,.3)}
.lt-ep-flag{font-size:16px;flex-shrink:0}
.lt-ep-meta{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.lt-ep-name{font-size:12px;font-weight:600;color:rgba(245,240,232,.75);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt-ep-status{font-size:10px;color:rgba(245,240,232,.4)}
.lt-ep-role{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:rgba(245,240,232,.2);font-weight:600;white-space:nowrap}
.lt-corridor-dir{color:rgba(212,168,75,.3);font-size:18px;flex-shrink:0}
.lt-corridor-notes{font-size:12px;line-height:1.6;color:rgba(245,240,232,.4);margin:0}
.lt-corridor-links{display:flex;gap:12px;flex-wrap:wrap}
.lt-corr-link{font-size:11px;color:#d4a84b;text-decoration:none}
.lt-corr-link:hover{opacity:.7}
.lt-markets{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
.lt-market-card{position:relative;display:flex;flex-direction:column;gap:4px;padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);text-decoration:none;color:inherit;overflow:hidden;transition:border-color .15s,transform .1s}
.lt-market-card:hover{border-color:var(--accent,rgba(212,168,75,.4));transform:translateY(-1px)}
.lt-mc-top{display:flex;align-items:center;gap:6px;margin-bottom:4px}
.lt-mc-flag{font-size:16px}
.lt-mc-iso{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.15em;color:rgba(245,240,232,.3)}
.lt-mc-mat{margin-left:auto;font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:1px 6px;border-radius:8px;border:1px solid;font-weight:600}
.lt-mc-name{font-size:13px;font-weight:600;color:rgba(245,240,232,.8);margin:0}
.lt-mc-legal{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,240,232,.3);margin:0}
.lt-mc-pending{font-size:10px;color:rgba(245,240,232,.2);font-style:italic;margin:0}
.lt-mc-accent{position:absolute;top:0;left:0;width:3px;height:100%;opacity:.4;border-radius:10px 0 0 10px}
.lt-signals{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
.lt-signal{padding:14px 18px;border-radius:8px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.lt-signal-meta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px}
.lt-signal-country{font-size:10px;font-weight:600;letter-spacing:.08em;color:rgba(212,168,75,.6);text-transform:uppercase}
.lt-signal-lane{font-size:10px;color:rgba(245,240,232,.3);font-family:'JetBrains Mono',ui-monospace,monospace}
.lt-signal-date{font-size:10px;color:rgba(245,240,232,.2);font-family:'JetBrains Mono',ui-monospace,monospace;margin-left:auto}
.lt-signal-headline{font-size:13px;color:rgba(245,240,232,.65);line-height:1.5;margin:0}
.lt-signals-more{font-size:12px;color:#d4a84b;text-decoration:none}
.lt-signals-more:hover{opacity:.7}
.lt-docs{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.lt-doc-card{padding:18px 20px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.lt-doc-title{font-size:14px;font-weight:600;color:rgba(245,240,232,.85);margin:0 0 8px}
.lt-doc-body{font-size:12px;line-height:1.65;color:rgba(245,240,232,.5);margin:0 0 8px}
.lt-doc-ref{font-size:10px;color:rgba(212,168,75,.5);font-family:'JetBrains Mono',ui-monospace,monospace;margin:0}
.lt-cta{padding:32px;border-radius:16px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin-bottom:48px}
.lt-cta-eyebrow{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.6);margin-bottom:8px}
.lt-cta-title{font-family:Georgia,serif;font-size:22px;font-weight:400;color:#f5f0e8;margin:0 0 12px}
.lt-cta-body{font-size:13px;line-height:1.7;color:rgba(245,240,232,.5);margin:0 0 20px;max-width:560px}
.lt-cta-actions{display:flex;gap:10px;flex-wrap:wrap}
.lt-gold{display:inline-flex;align-items:center;padding:10px 20px;background:#d4a84b;color:#050c18;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:opacity .15s}
.lt-gold:hover{opacity:.85}
.lt-ghost{display:inline-flex;align-items:center;padding:10px 20px;border:1px solid rgba(245,240,232,.15);color:rgba(245,240,232,.6);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:border-color .15s,color .15s}
.lt-ghost:hover{border-color:rgba(245,240,232,.35);color:#f5f0e8}
.lt-footnote{margin-top:48px;padding-top:24px;border-top:1px solid rgba(255,255,255,.06)}
.lt-footnote p{font-size:11px;line-height:1.7;color:rgba(245,240,232,.25);max-width:640px;margin:0 0 16px}
.lt-footnote-links{display:flex;flex-wrap:wrap;gap:16px}
.lt-footnote-links a{font-size:11px;color:#d4a84b;text-decoration:none}
.lt-footnote-links a:hover{opacity:.7}
`
