// app/intelligence/counterparty-intelligence/page.tsx
// Live surface: recent counterparty-tagged signals + playbook cross-links.
// Replaces the static IntelligenceModulePage wrapper.

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getAllPlaybooks } from '@/lib/intelligence/jurisdictionPlaybooks'

export const metadata: Metadata = {
  title: 'Counterparty Intelligence | Harbourview',
  description:
    'Reviewed counterparty context for regulated-market importers, distributors, licensed producers, procurement bodies and institutional buyers.',
}

export const dynamic = 'force-dynamic'

type Signal = { id: string; headline: string; country: string | null; date: string | null; top_lane: string | null }

async function getCounterpartySignals(): Promise<Signal[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const client = createClient(url, key, { auth: { persistSession: false } })
  const { data } = await client
    .from('signals')
    .select('id, headline, country, date, top_lane')
    .eq('reviewed', true)
    .gte('date', cutoff)
    .or('top_lane.ilike.%counterpart%,top_lane.ilike.%operator%,top_lane.ilike.%import%,top_lane.ilike.%distributor%,top_lane.ilike.%procurement%')
    .order('date', { ascending: false })
    .limit(18)
  return (data ?? []) as Signal[]
}

const FLAGS: Record<string, string> = {
  DE: '🇩🇪', GB: '🇬🇧', AU: '🇦🇺', CA: '🇨🇦', NL: '🇳🇱',
  PT: '🇵🇹', TH: '🇹🇭', IL: '🇮🇱', CO: '🇨🇴', ZA: '🇿🇦',
  MT: '🇲🇹', LU: '🇱🇺', CZ: '🇨🇿', NZ: '🇳🇿', MX: '🇲🇽',
  BR: '🇧🇷', CH: '🇨🇭', FR: '🇫🇷', ES: '🇪🇸', PL: '🇵🇱',
}

const WHAT_WE_REVIEW = [
  { title: 'Operator role verification', body: 'Publicly available evidence of a counterparty\'s claimed role, licence category, operating scope and commercial activities in regulated markets.' },
  { title: 'Import & export alignment', body: 'Reviewed context on whether a counterparty\'s claimed authorisation is consistent with public market evidence — narcotics licences, GMP certificates, wholesale distribution authorisations.' },
  { title: 'Procurement body context', body: 'Regulatory body mandate, procurement framework, preferred supplier eligibility and institutional contact pathway orientation for public bodies.' },
  { title: 'Distribution network orientation', body: 'General market structure and distributor role mapping for priority jurisdictions, without publishing specific counterparty commercial terms.' },
  { title: 'Licensing gap signals', body: 'Publicly available signals of licence expiry, regulatory action, compliance concern or operating category mismatch relevant to a counterparty assessment.' },
]

export default async function CounterpartyIntelligencePage() {
  const [signals, playbooks] = await Promise.all([getCounterpartySignals(), getAllPlaybooks()])

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>
      <div className="ci-wrap">

        <nav className="ci-nav">
          <Link href="/intelligence" className="ci-link">Intelligence</Link>
          <span className="ci-sep">›</span>
          <span className="ci-cur">Counterparty Intelligence</span>
        </nav>

        <header className="ci-header">
          <p className="ci-eyebrow">Intelligence / Counterparty</p>
          <h1 className="ci-title">Reviewed counterparty context for regulated cannabis markets.</h1>
          <p className="ci-sub">
            Harbourview counterparty intelligence provides reviewed context on operators, importers,
            distributors, licensed producers, procurement bodies and institutional buyers — without
            publishing sensitive identities, contact paths or private commercial details.
          </p>
        </header>

        <div className="ci-boundary">
          <span className="ci-b-ico">⚠</span>
          <p>No private counterparty names, contact details, internal assessments, or dossier findings are published on this page. Specific counterparty requests involving named parties are handled through confidential intake only.</p>
        </div>

        {signals.length > 0 && (
          <section className="ci-section">
            <h2 className="ci-section-title">Recent Operator & Market Signals</h2>
            <p className="ci-section-sub">Counterparty-relevant intelligence from the last 90 days.</p>
            <div className="ci-signals">
              {signals.map(sig => (
                <div key={sig.id} className="ci-signal">
                  <div className="ci-sig-meta">
                    {sig.country && <span className="ci-sig-country">{FLAGS[sig.country] ?? ''} {sig.country}</span>}
                    {sig.top_lane && <span className="ci-sig-lane">{sig.top_lane}</span>}
                    {sig.date && <span className="ci-sig-date">{sig.date}</span>}
                  </div>
                  <p className="ci-sig-headline">{sig.headline}</p>
                </div>
              ))}
            </div>
            <Link href="/signals" className="ci-more">View all signals →</Link>
          </section>
        )}

        <section className="ci-section">
          <h2 className="ci-section-title">What Harbourview Reviews</h2>
          <p className="ci-section-sub">Counterparty context categories available through the intake process.</p>
          <div className="ci-review-grid">
            {WHAT_WE_REVIEW.map(item => (
              <div key={item.title} className="ci-review-card">
                <h3 className="ci-review-title">{item.title}</h3>
                <p className="ci-review-body">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {playbooks.length > 0 && (
          <section className="ci-section">
            <h2 className="ci-section-title">Counterparty Context by Market</h2>
            <p className="ci-section-sub">Each playbook documents the regulatory bodies, licence categories and operator framework relevant to assessing counterparties in that market.</p>
            <div className="ci-markets">
              {playbooks.slice(0, 12).map(pb => (
                <Link key={pb.country_iso2} href={`/intelligence/playbooks/${pb.country_iso2.toLowerCase()}`} className="ci-market">
                  <span className="ci-m-flag">{FLAGS[pb.country_iso2] ?? '🌐'}</span>
                  <span className="ci-m-name">{pb.country_name}</span>
                  <span className="ci-m-arrow">→</span>
                </Link>
              ))}
            </div>
            {playbooks.length > 12 && (
              <Link href="/intelligence/playbooks" className="ci-more">All {playbooks.length} market playbooks →</Link>
            )}
          </section>
        )}

        <section className="ci-cta">
          <p className="ci-cta-eyebrow">Private counterparty intelligence</p>
          <h2 className="ci-cta-title">Request reviewed counterparty context</h2>
          <p className="ci-cta-body">
            Specific counterparty assessments involving named operators, importers, or procurement bodies
            are handled confidentially through Harbourview intake — not this public surface.
          </p>
          <div className="ci-cta-actions">
            <Link href="/intake" className="ci-gold">Start Confidential Intake →</Link>
            <Link href="/contact" className="ci-ghost">Contact Harbourview</Link>
          </div>
        </section>

        <footer className="ci-footnote">
          <p>Counterparty intelligence is orientation-level only. Harbourview does not confirm, endorse, verify or rate specific counterparties on this public surface.</p>
          <div className="ci-f-links">
            <Link href="/intelligence/playbooks">Market Playbooks →</Link>
            <Link href="/signals">Intelligence Signals →</Link>
            <Link href="/intelligence/regulatory-pathways">Regulatory Pathways →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.ci-wrap{max-width:960px;margin:0 auto;padding:48px 24px 80px}
.ci-nav{display:flex;align-items:center;gap:8px;margin-bottom:40px}
.ci-link{font-size:11px;letter-spacing:.08em;color:#d4a84b;text-decoration:none}
.ci-link:hover{opacity:.7}
.ci-sep{color:rgba(245,240,232,.2);font-size:11px}
.ci-cur{font-size:11px;color:rgba(245,240,232,.4)}
.ci-header{margin-bottom:28px}
.ci-eyebrow{font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(212,168,75,.7);margin-bottom:10px}
.ci-title{font-family:Georgia,serif;font-size:clamp(24px,3.5vw,40px);font-weight:400;color:#f5f0e8;letter-spacing:-.01em;margin:0 0 14px;max-width:700px}
.ci-sub{font-size:14px;color:rgba(245,240,232,.55);max-width:600px;line-height:1.7;margin:0}
.ci-boundary{display:flex;gap:12px;align-items:flex-start;padding:14px 18px;border-radius:8px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin-bottom:36px}
.ci-b-ico{color:rgba(212,168,75,.5);font-size:13px;flex-shrink:0;margin-top:2px}
.ci-boundary p{font-size:12px;line-height:1.65;color:rgba(245,240,232,.4);margin:0}
.ci-section{margin-bottom:40px}
.ci-section-title{font-family:Georgia,serif;font-size:20px;font-weight:400;color:#f5f0e8;margin:0 0 6px}
.ci-section-sub{font-size:13px;color:rgba(245,240,232,.4);max-width:560px;line-height:1.6;margin:0 0 20px}
.ci-signals{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.ci-signal{padding:14px 18px;border-radius:8px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.ci-sig-meta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px}
.ci-sig-country{font-size:10px;font-weight:600;letter-spacing:.08em;color:rgba(212,168,75,.6);text-transform:uppercase}
.ci-sig-lane{font-size:10px;color:rgba(245,240,232,.3);font-family:'JetBrains Mono',ui-monospace,monospace}
.ci-sig-date{font-size:10px;color:rgba(245,240,232,.2);font-family:'JetBrains Mono',ui-monospace,monospace;margin-left:auto}
.ci-sig-headline{font-size:13px;color:rgba(245,240,232,.65);line-height:1.5;margin:0}
.ci-more{font-size:12px;color:#d4a84b;text-decoration:none;display:inline-block;margin-top:4px}
.ci-more:hover{opacity:.7}
.ci-review-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.ci-review-card{padding:18px 20px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.ci-review-title{font-size:13px;font-weight:600;color:rgba(245,240,232,.85);margin:0 0 6px}
.ci-review-body{font-size:12px;line-height:1.65;color:rgba(245,240,232,.45);margin:0}
.ci-markets{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:14px}
.ci-market{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);text-decoration:none;transition:border-color .15s}
.ci-market:hover{border-color:rgba(212,168,75,.3)}
.ci-m-flag{font-size:16px;flex-shrink:0}
.ci-m-name{font-size:13px;color:rgba(245,240,232,.7);flex:1}
.ci-m-arrow{font-size:11px;color:rgba(212,168,75,.4)}
.ci-cta{padding:32px;border-radius:16px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin-bottom:48px}
.ci-cta-eyebrow{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.6);margin-bottom:8px}
.ci-cta-title{font-family:Georgia,serif;font-size:22px;font-weight:400;color:#f5f0e8;margin:0 0 10px}
.ci-cta-body{font-size:13px;line-height:1.7;color:rgba(245,240,232,.5);margin:0 0 18px;max-width:520px}
.ci-cta-actions{display:flex;gap:10px;flex-wrap:wrap}
.ci-gold{display:inline-flex;align-items:center;padding:10px 20px;background:#d4a84b;color:#050c18;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:opacity .15s}
.ci-gold:hover{opacity:.85}
.ci-ghost{display:inline-flex;align-items:center;padding:10px 20px;border:1px solid rgba(245,240,232,.15);color:rgba(245,240,232,.6);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px}
.ci-ghost:hover{border-color:rgba(245,240,232,.35);color:#f5f0e8}
.ci-footnote{padding-top:24px;border-top:1px solid rgba(255,255,255,.06)}
.ci-footnote p{font-size:11px;line-height:1.7;color:rgba(245,240,232,.25);max-width:600px;margin:0 0 14px}
.ci-f-links{display:flex;flex-wrap:wrap;gap:16px}
.ci-f-links a{font-size:11px;color:#d4a84b;text-decoration:none}
.ci-f-links a:hover{opacity:.7}
`
