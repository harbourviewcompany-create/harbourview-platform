// app/intelligence/logistics-trade-routes/page.tsx
// Live corridor + signal page. Replaces static IntelligenceModulePage wrapper.

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { SYNTHESIS_MARKETS } from '@/lib/intelligence/jurisdictionSynthesis'

export const metadata: Metadata = {
  title: 'Logistics & Trade Routes — Cannabis Corridor Intelligence | Harbourview',
  description:
    'Trade corridor context and market status for regulated cannabis export and import. Live intelligence across 20+ markets — documentation frameworks, regulatory gates, and operator implications.',
}

export const dynamic = 'force-dynamic'

const CORRIDORS = [
  { from: 'CA', to: 'DE', label: 'Canada → Germany', notes: 'EU-GMP requirement for German import; Health Canada export licence; BfArM narcotics import permit.' },
  { from: 'CA', to: 'AU', label: 'Canada → Australia', notes: 'TGA ODC import permit; Health Canada export licence; Narcotic Drugs Act 1967 framework.' },
  { from: 'CO', to: 'DE', label: 'Colombia → Germany', notes: 'INVIMA GMP + EU-GMP recognition pathway; BfArM narcotics import permit.' },
  { from: 'IL', to: 'DE', label: 'Israel → Germany', notes: 'IMCA export licence; EU-GMP certification in-progress for Israeli producers.' },
  { from: 'ZA', to: 'DE', label: 'South Africa → Germany', notes: 'SAHPRA export licence; EU-GMP equivalence pathway; growing corridor.' },
  { from: 'PT', to: 'DE', label: 'Portugal → Germany', notes: 'Intra-EU; Infarmed licence; EU-GMP inherently satisfied; narcotics transport permit.' },
  { from: 'NL', to: 'DE', label: 'Netherlands → Germany', notes: 'Intra-EU; OMC wholesale authorisation; shortest regulatory lead time of major corridors.' },
  { from: 'AU', to: 'GB', label: 'Australia → United Kingdom', notes: 'TGA export; MHRA import licence; Schedule 1→2 reclassification pathway per product.' },
  { from: 'CA', to: 'GB', label: 'Canada → United Kingdom', notes: 'Health Canada export; MHRA specials import authorisation; UK-specific GMP certificate.' },
  { from: 'MX', to: 'CA', label: 'Mexico → Canada', notes: 'COFEPRIS export; Health Canada import; cannabis not yet in CUSMA trade provisions.' },
  { from: 'TH', to: 'AU', label: 'Thailand → Australia', notes: 'Emerging corridor; FDA Thailand export; TGA import; cold-chain alignment in progress.' },
  { from: 'BR', to: 'PT', label: 'Brazil → Portugal', notes: 'ANVISA export; Infarmed import; Brazil–Portugal phytosanitary equivalence discussion.' },
]

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

const MATURITY_COLOR: Record<string, string> = {
  emerging: '#d4a84b', developing: '#5b9bd5', maturing: '#4caf82',
  mature: '#4caf82', restricted: '#e05555', unknown: 'rgba(245,240,232,.25)',
}
const LEGAL_LABEL: Record<string, string> = {
  medical_only: 'Medical', adult_use: 'Adult-use', decrim: 'Decrim',
  illegal: 'Prohibited', mixed: 'Mixed', transitional: 'Transitional', unknown: '—',
}

type Briefing = { country_iso2: string; legal_status: string; market_maturity: string }
type Signal = { id: string; headline: string; country: string | null; date: string | null; top_lane: string | null }

async function getData(): Promise<{ briefings: Map<string, Briefing>; signals: Signal[] }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { briefings: new Map(), signals: [] }
  const client = createClient(url, key, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })

  const [bRes, sRes] = await Promise.all([
    client.from('jurisdiction_briefings')
      .select('country_iso2, legal_status, market_maturity')
      .eq('status', 'published')
      .order('week_ending', { ascending: false }),
    client.from('signals')
      .select('id, headline, country, date, top_lane')
      .eq('reviewed', true)
      .gte('date', new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10))
      .or('top_lane.ilike.%logist%,top_lane.ilike.%trade%,top_lane.ilike.%export%,top_lane.ilike.%import%')
      .order('date', { ascending: false })
      .limit(20),
  ])

  const seen = new Set<string>()
  const briefings = new Map<string, Briefing>()
  for (const row of bRes.data ?? []) {
    if (!seen.has(row.country_iso2)) { seen.add(row.country_iso2); briefings.set(row.country_iso2, row as Briefing) }
  }
  return { briefings, signals: (sRes.data ?? []) as Signal[] }
}

export default async function LogisticsTradeRoutesPage() {
  const { briefings, signals } = await getData()
  const corridorIso2s = new Set(CORRIDORS.flatMap(c => [c.from, c.to]))
  const endpointMarkets = SYNTHESIS_MARKETS.filter(m => corridorIso2s.has(m.iso2))

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>
      <div className="lt-wrap">

        <nav className="lt-nav">
          <Link href="/intelligence" className="lt-link">Intelligence</Link>
          <span className="lt-sep">›</span>
          <span className="lt-cur">Logistics & Trade Routes</span>
        </nav>

        <header className="lt-header">
          <p className="lt-eyebrow">Intelligence / Logistics</p>
          <h1 className="lt-title">Cannabis Trade Corridor Intelligence</h1>
          <p className="lt-sub">
            Orientation-level intelligence for regulated cannabis export and import corridors across{' '}
            {SYNTHESIS_MARKETS.length} active markets — sourced from Harbourview&apos;s 516-source registry.
          </p>
          <div className="lt-chips">
            <span className="lt-chip">{CORRIDORS.length} tracked corridors</span>
            <span className="lt-chip">{endpointMarkets.length} endpoint markets</span>
            {signals.length > 0 && <span className="lt-chip">{signals.length} recent trade signals</span>}
          </div>
        </header>

        <div className="lt-boundary">
          <span className="lt-b-ico">⚠</span>
          <p>Harbourview does not publish operator identities, commercial terms, or private route analysis here. This surface is orientation-level only.</p>
        </div>

        {/* Corridors */}
        <section className="lt-section">
          <h2 className="lt-section-title">Active Export–Import Corridors</h2>
          <p className="lt-section-sub">Major regulated corridors by documentation complexity. Click either endpoint for the full licensing playbook.</p>
          <div className="lt-corridors">
            {CORRIDORS.map(c => {
              const fb = briefings.get(c.from), tb = briefings.get(c.to)
              const fc = fb ? MATURITY_COLOR[fb.market_maturity] ?? MATURITY_COLOR.unknown : MATURITY_COLOR.unknown
              const tc = tb ? MATURITY_COLOR[tb.market_maturity] ?? MATURITY_COLOR.unknown : MATURITY_COLOR.unknown
              return (
                <div key={`${c.from}-${c.to}`} className="lt-corridor">
                  <div className="lt-corr-header">
                    <span className="lt-corr-label">{c.label}</span>
                  </div>
                  <div className="lt-corr-eps">
                    <Link href={`/intelligence/playbooks/${c.from.toLowerCase()}`} className="lt-ep">
                      <span className="lt-ep-flag">{FLAGS[c.from] ?? '🌐'}</span>
                      <div>
                        <div className="lt-ep-name">{NAMES[c.from] ?? c.from}</div>
                        {fb && <div className="lt-ep-status" style={{ color: fc }}>{LEGAL_LABEL[fb.legal_status]} · {fb.market_maturity}</div>}
                      </div>
                      <span className="lt-ep-role">Source</span>
                    </Link>
                    <span className="lt-corr-arr">→</span>
                    <Link href={`/intelligence/playbooks/${c.to.toLowerCase()}`} className="lt-ep">
                      <span className="lt-ep-flag">{FLAGS[c.to] ?? '🌐'}</span>
                      <div>
                        <div className="lt-ep-name">{NAMES[c.to] ?? c.to}</div>
                        {tb && <div className="lt-ep-status" style={{ color: tc }}>{LEGAL_LABEL[tb.legal_status]} · {tb.market_maturity}</div>}
                      </div>
                      <span className="lt-ep-role">Dest.</span>
                    </Link>
                  </div>
                  <p className="lt-corr-notes">{c.notes}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Market status grid */}
        <section className="lt-section">
          <h2 className="lt-section-title">Corridor Endpoint Market Status</h2>
          <div className="lt-markets">
            {endpointMarkets.map(market => {
              const b = briefings.get(market.iso2)
              const color = b ? MATURITY_COLOR[b.market_maturity] ?? MATURITY_COLOR.unknown : MATURITY_COLOR.unknown
              return (
                <Link key={market.iso2} href={`/intelligence/playbooks/${market.iso2.toLowerCase()}`}
                  className="lt-market" style={{ '--accent': color } as React.CSSProperties}>
                  <div className="lt-mc-top">
                    <span>{FLAGS[market.iso2] ?? '🌐'}</span>
                    <span className="lt-mc-iso">{market.iso2}</span>
                    {b && <span className="lt-mc-mat" style={{ color, borderColor: `${color}40` }}>{b.market_maturity}</span>}
                  </div>
                  <p className="lt-mc-name">{market.name}</p>
                  {b ? <p className="lt-mc-legal">{LEGAL_LABEL[b.legal_status]}</p> : <p className="lt-mc-pending">Briefing pending</p>}
                  <div className="lt-mc-bar" style={{ background: color }} />
                </Link>
              )
            })}
          </div>
        </section>

        {/* Trade signals */}
        {signals.length > 0 && (
          <section className="lt-section">
            <h2 className="lt-section-title">Recent Trade & Logistics Signals</h2>
            <div className="lt-signals">
              {signals.map(sig => (
                <div key={sig.id} className="lt-signal">
                  <div className="lt-sig-meta">
                    {sig.country && <span className="lt-sig-country">{sig.country}</span>}
                    {sig.top_lane && <span className="lt-sig-lane">{sig.top_lane}</span>}
                    {sig.date && <span className="lt-sig-date">{sig.date}</span>}
                  </div>
                  <p className="lt-sig-headline">{sig.headline}</p>
                </div>
              ))}
            </div>
            <Link href="/signals" className="lt-more">View all signals →</Link>
          </section>
        )}

        {/* Documentation orientation */}
        <section className="lt-section lt-section--doc">
          <h2 className="lt-section-title">Documentation Framework Orientation</h2>
          <div className="lt-docs">
            {([
              ['Export authorisation', 'Source-market competent authority export licence. Required before any cross-border movement.', 'Health Canada / INVIMA / IMCA / SAHPRA'],
              ['Import authorisation', 'Destination-market narcotics import permit. EU markets require BfArM / Infarmed / AGES narcotics permits aligned to the 1961 Single Convention.', 'BfArM / Infarmed / TGA / MHRA'],
              ['GMP certification', 'EU market imports require EU-GMP or recognised equivalent. Non-EU producers must obtain EU-GMP certification or demonstrate equivalence.', 'EudraGMDP / Health Canada'],
              ['Certificate of Analysis', 'Batch-specific analytical report from an ISO 17025 accredited laboratory. Most regulated markets require dual-lab CoA (source + destination market).', 'ISO 17025 accredited laboratory'],
              ['Phytosanitary certificate', 'Required for plant-origin material. Issued by source-country NPPO. Not typically required for extracts or finished dosage forms.', 'IPPC / national NPPO'],
              ['Cold chain documentation', 'GDP-aligned temperature excursion log, packaging qualification, and carrier qualification records.', 'EU GDP Guidelines / WHO TRS 961'],
            ] as [string, string, string][]).map(([title, body, ref]) => (
              <div key={title} className="lt-doc">
                <h3 className="lt-doc-title">{title}</h3>
                <p className="lt-doc-body">{body}</p>
                <p className="lt-doc-ref">{ref}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lt-cta">
          <p className="lt-cta-eyebrow">Private corridor intelligence</p>
          <h2 className="lt-cta-title">Route analysis for qualified operators</h2>
          <p className="lt-cta-body">Counterparty introduction, documentation review, regulatory timing, and corridor viability analysis handled through confidential intake.</p>
          <div className="lt-cta-actions">
            <Link href="/intake" className="lt-gold">Start Confidential Intake →</Link>
            <Link href="/contact" className="lt-ghost">Contact Harbourview</Link>
          </div>
        </section>

        <footer className="lt-footnote">
          <p>Orientation-level only — not legal, regulatory, transport, or compliance advice. Verify requirements with qualified counsel before shipping product.</p>
          <div className="lt-f-links">
            <Link href="/intelligence/playbooks">Market Playbooks →</Link>
            <Link href="/markets">Market Briefings →</Link>
            <Link href="/intelligence/regulatory-pathways">Regulatory Pathways →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.lt-wrap{max-width:1100px;margin:0 auto;padding:48px 24px 80px}
.lt-nav{display:flex;align-items:center;gap:8px;margin-bottom:40px}
.lt-link{font-size:11px;letter-spacing:.08em;color:#d4a84b;text-decoration:none}
.lt-link:hover{opacity:.7}
.lt-sep{color:rgba(245,240,232,.2);font-size:11px}
.lt-cur{font-size:11px;color:rgba(245,240,232,.4)}
.lt-header{margin-bottom:28px}
.lt-eyebrow{font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(212,168,75,.7);margin-bottom:10px}
.lt-title{font-family:Georgia,serif;font-size:clamp(26px,4vw,44px);font-weight:400;color:#f5f0e8;letter-spacing:-.01em;margin:0 0 14px}
.lt-sub{font-size:14px;color:rgba(245,240,232,.55);max-width:660px;line-height:1.7;margin:0 0 16px}
.lt-chips{display:flex;flex-wrap:wrap;gap:8px}
.lt-chip{font-size:10px;font-family:'JetBrains Mono',ui-monospace,monospace;padding:3px 10px;border-radius:20px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(255,255,255,.4)}
.lt-boundary{display:flex;gap:12px;align-items:flex-start;padding:14px 18px;border-radius:8px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin-bottom:36px}
.lt-b-ico{color:rgba(212,168,75,.5);font-size:13px;flex-shrink:0;margin-top:2px}
.lt-boundary p{font-size:12px;line-height:1.65;color:rgba(245,240,232,.4);margin:0}
.lt-section{margin-bottom:44px}
.lt-section--doc{padding:28px 32px;border-radius:16px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.lt-section-title{font-family:Georgia,serif;font-size:20px;font-weight:400;color:#f5f0e8;margin:0 0 6px}
.lt-section-sub{font-size:13px;color:rgba(245,240,232,.4);max-width:560px;line-height:1.6;margin:0 0 20px}
.lt-corridors{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.lt-corridor{padding:18px 20px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);display:flex;flex-direction:column;gap:10px}
.lt-corr-header{display:flex;align-items:center;justify-content:space-between}
.lt-corr-label{font-size:13px;font-weight:600;color:rgba(245,240,232,.8)}
.lt-corr-eps{display:flex;align-items:center;gap:6px}
.lt-ep{display:flex;align-items:center;gap:8px;text-decoration:none;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);flex:1;transition:border-color .15s}
.lt-ep:hover{border-color:rgba(212,168,75,.3)}
.lt-ep-flag{font-size:15px;flex-shrink:0}
.lt-ep-name{font-size:12px;font-weight:600;color:rgba(245,240,232,.75)}
.lt-ep-status{font-size:10px;color:rgba(245,240,232,.4)}
.lt-ep-role{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:rgba(245,240,232,.2);font-weight:600;white-space:nowrap;margin-left:auto}
.lt-corr-arr{color:rgba(212,168,75,.3);font-size:18px;flex-shrink:0}
.lt-corr-notes{font-size:12px;line-height:1.6;color:rgba(245,240,232,.4);margin:0}
.lt-markets{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px}
.lt-market{position:relative;display:flex;flex-direction:column;gap:4px;padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);text-decoration:none;color:inherit;overflow:hidden;transition:border-color .15s}
.lt-market:hover{border-color:var(--accent,rgba(212,168,75,.4))}
.lt-mc-top{display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:16px}
.lt-mc-iso{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.15em;color:rgba(245,240,232,.3)}
.lt-mc-mat{margin-left:auto;font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:1px 6px;border-radius:8px;border:1px solid;font-weight:600}
.lt-mc-name{font-size:13px;font-weight:600;color:rgba(245,240,232,.8);margin:0}
.lt-mc-legal,.lt-mc-pending{font-size:10px;letter-spacing:.08em;text-transform:uppercase;margin:0}
.lt-mc-legal{color:rgba(245,240,232,.3)}
.lt-mc-pending{color:rgba(245,240,232,.2);font-style:italic}
.lt-mc-bar{position:absolute;top:0;left:0;width:3px;height:100%;opacity:.4;border-radius:10px 0 0 10px}
.lt-signals{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
.lt-signal{padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.lt-sig-meta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:5px}
.lt-sig-country{font-size:10px;font-weight:600;letter-spacing:.08em;color:rgba(212,168,75,.6);text-transform:uppercase}
.lt-sig-lane{font-size:10px;color:rgba(245,240,232,.3);font-family:'JetBrains Mono',ui-monospace,monospace}
.lt-sig-date{font-size:10px;color:rgba(245,240,232,.2);font-family:'JetBrains Mono',ui-monospace,monospace;margin-left:auto}
.lt-sig-headline{font-size:13px;color:rgba(245,240,232,.65);line-height:1.5;margin:0}
.lt-more{font-size:12px;color:#d4a84b;text-decoration:none}
.lt-more:hover{opacity:.7}
.lt-docs{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.lt-doc{padding:16px 18px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.lt-doc-title{font-size:13px;font-weight:600;color:rgba(245,240,232,.85);margin:0 0 6px}
.lt-doc-body{font-size:12px;line-height:1.65;color:rgba(245,240,232,.5);margin:0 0 6px}
.lt-doc-ref{font-size:10px;color:rgba(212,168,75,.5);font-family:'JetBrains Mono',ui-monospace,monospace;margin:0}
.lt-cta{padding:32px;border-radius:16px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin-bottom:48px}
.lt-cta-eyebrow{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.6);margin-bottom:8px}
.lt-cta-title{font-family:Georgia,serif;font-size:22px;font-weight:400;color:#f5f0e8;margin:0 0 10px}
.lt-cta-body{font-size:13px;line-height:1.7;color:rgba(245,240,232,.5);margin:0 0 18px;max-width:520px}
.lt-cta-actions{display:flex;gap:10px;flex-wrap:wrap}
.lt-gold{display:inline-flex;align-items:center;padding:10px 20px;background:#d4a84b;color:#050c18;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:opacity .15s}
.lt-gold:hover{opacity:.85}
.lt-ghost{display:inline-flex;align-items:center;padding:10px 20px;border:1px solid rgba(245,240,232,.15);color:rgba(245,240,232,.6);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px}
.lt-ghost:hover{border-color:rgba(245,240,232,.35);color:#f5f0e8}
.lt-footnote{padding-top:24px;border-top:1px solid rgba(255,255,255,.06)}
.lt-footnote p{font-size:11px;line-height:1.7;color:rgba(245,240,232,.25);max-width:600px;margin:0 0 14px}
.lt-f-links{display:flex;flex-wrap:wrap;gap:16px}
.lt-f-links a{font-size:11px;color:#d4a84b;text-decoration:none}
.lt-f-links a:hover{opacity:.7}
`
