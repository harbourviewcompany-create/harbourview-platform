import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

export const metadata: Metadata = {
  title: 'Regulatory Change Tracker | Harbourview Policy Standards',
  description: 'Live feed of cannabis regulatory changes, policy signals, and legislative developments.',
}

// ISR: regulatory tracker — short window keeps published change data fresh
export const revalidate = 900

type Signal = { id: string; headline: string; country: string | null; date: string | null; top_lane: string | null; cat: string | null }

const FL: Record<string,string> = {
  DE:'🇩🇪',GB:'🇬🇧',AU:'🇦🇺',CA:'🇨🇦',NL:'🇳🇱',PT:'🇵🇹',TH:'🇹🇭',IL:'🇮🇱',CO:'🇨🇴',ZA:'🇿🇦',
  MT:'🇲🇹',LU:'🇱🇺',CZ:'🇨🇿',NZ:'🇳🇿',MX:'🇲🇽',BR:'🇧🇷',CH:'🇨🇭',FR:'🇫🇷',ES:'🇪🇸',PL:'🇵🇱'
}

async function getRegChangeSignals(): Promise<Signal[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  const cutoff = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10)
  const client = createClient(url, key, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
  const { data } = await client
    .from('signals')
    .select('id,headline,country,date,top_lane,cat')
    .eq('reviewed', true)
    .gte('date', cutoff)
    .or('top_lane.ilike.%regulat%,top_lane.ilike.%legislat%,top_lane.ilike.%policy%,top_lane.ilike.%law%,cat.ilike.%regulat%,cat.ilike.%policy%,cat.ilike.%reform%')
    .order('date', { ascending: false })
    .limit(40)
  return (data ?? []) as Signal[]
}

export default async function RegulatoryChangeTrackerPage() {
  const signals = await getRegChangeSignals()

  const byCountry: Record<string, Signal[]> = {}
  signals.forEach(s => {
    const k = s.country ?? 'Global'
    if (!byCountry[k]) byCountry[k] = []
    byCountry[k].push(s)
  })
  const countries = Object.keys(byCountry).sort()

  return (
    <main className="bg-[#020814] text-white min-h-screen">
      <style>{CSS}</style>
      <div className="rc-wrap">
        <nav className="rc-nav">
          <Link href="/policy-standards" className="rc-a">Policy Standards</Link>
          <span className="rc-sep">›</span>
          <span className="rc-cur">Regulatory Change Tracker</span>
        </nav>

        <header className="rc-hd">
          <p className="rc-ey">Policy Standards / Intelligence</p>
          <h1 className="rc-ti">Regulatory Change Tracker</h1>
          <p className="rc-su">
            Live feed of cannabis regulatory changes, policy signals, and legislative developments
            from Harbourview&apos;s reviewed intelligence database — last 180 days.
          </p>
          <div className="rc-me">
            <span>{signals.length} regulatory signals</span>
            {countries.length > 0 && <span>{countries.length} jurisdictions</span>}
          </div>
        </header>

        <div className="rc-bd">
          <span className="rc-bdi">⚠</span>
          <p>Verify the status and implications of any regulatory change with qualified local counsel before acting on it.</p>
        </div>

        {signals.length === 0 ? (
          <div className="rc-emp">
            <p>No regulatory signals found in the last 180 days.</p>
            <Link href="/signals" className="rc-a">Browse all signals →</Link>
          </div>
        ) : (
          <>
            <section className="rc-sec">
              <h2 className="rc-sth">Recent Regulatory Signals</h2>
              <div className="rc-sigs">
                {signals.map(sig => (
                  <div key={sig.id} className="rc-sig">
                    <div className="rc-sm">
                      {sig.country && <span className="rc-sc">{FL[sig.country] ?? '🌐'} {sig.country}</span>}
                      {sig.top_lane && <span className="rc-sl">{sig.top_lane}</span>}
                      {sig.date && <span className="rc-sd">{sig.date}</span>}
                    </div>
                    <p className="rc-sh">{sig.headline}</p>
                  </div>
                ))}
              </div>
            </section>

            {countries.length > 1 && (
              <section className="rc-sec">
                <h2 className="rc-sth">By Jurisdiction</h2>
                <div className="rc-bc">
                  {countries.slice(0, 18).map(c => (
                    <div key={c} className="rc-cg">
                      <div className="rc-ch">
                        <span style={{fontSize:16}}>{FL[c] ?? '🌐'}</span>
                        <span className="rc-cn">{c}</span>
                        <span className="rc-cc">{byCountry[c].length}</span>
                      </div>
                      {byCountry[c].slice(0,2).map(s => (
                        <p key={s.id} className="rc-cs">{s.headline}</p>
                      ))}
                      {byCountry[c].length > 2 && <p className="rc-cm">+{byCountry[c].length - 2} more</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <section className="rc-cta">
          <p className="rc-cey">Private regulatory monitoring</p>
          <h2 className="rc-cti">Watchlist and alert workflows</h2>
          <p className="rc-cbo">
            Jurisdiction-specific monitoring, watchlist configuration, and alert delivery are
            available through Harbourview&apos;s private operator workflows — not this public surface.
          </p>
          <div className="rc-ca">
            <Link href="/intake" className="rc-gold">Start Confidential Intake →</Link>
            <Link href="/signals" className="rc-ghost">Browse All Signals</Link>
          </div>
        </section>

        <footer className="rc-ft">
          <p>Not legal or regulatory advice. Verify all regulatory changes with qualified local counsel.</p>
          <div className="rc-fl">
            <Link href="/intelligence/regulatory-pathways">Regulatory Pathways →</Link>
            <Link href="/intelligence/playbooks">Market Playbooks →</Link>
            <Link href="/markets">Market Briefings →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.rc-wrap{max-width:960px;margin:0 auto;padding:48px 24px 80px}
.rc-nav{display:flex;align-items:center;gap:8px;margin-bottom:40px}
.rc-a{font-size:11px;letter-spacing:.08em;color:#d4a84b;text-decoration:none}
.rc-a:hover{opacity:.7}
.rc-sep{color:rgba(255,255,255,.2);font-size:11px}
.rc-cur{font-size:11px;color:rgba(255,255,255,.4)}
.rc-hd{margin-bottom:24px}
.rc-ey{font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(212,168,75,.7);margin-bottom:10px}
.rc-ti{font-family:Georgia,serif;font-size:clamp(26px,4vw,40px);font-weight:400;color:#f5f0e8;letter-spacing:-.01em;margin:0 0 14px}
.rc-su{font-size:14px;color:rgba(245,240,232,.55);max-width:620px;line-height:1.7;margin:0 0 12px}
.rc-me{display:flex;flex-wrap:wrap;gap:16px;font-size:10px;font-family:'JetBrains Mono',ui-monospace,monospace;color:rgba(245,240,232,.3)}
.rc-bd{display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-radius:8px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin:20px 0 28px}
.rc-bdi{color:rgba(212,168,75,.5);font-size:13px;flex-shrink:0;margin-top:2px}
.rc-bd p{font-size:12px;line-height:1.6;color:rgba(245,240,232,.4);margin:0}
.rc-emp{padding:40px;text-align:center;border:1px solid rgba(255,255,255,.07);border-radius:12px;margin-bottom:40px}
.rc-emp p{font-size:14px;color:rgba(245,240,232,.4);margin:0 0 14px}
.rc-sec{margin-bottom:36px}
.rc-sth{font-family:Georgia,serif;font-size:20px;font-weight:400;color:#f5f0e8;margin:0 0 14px}
.rc-sigs{display:flex;flex-direction:column;gap:8px}
.rc-sig{padding:11px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.rc-sm{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px}
.rc-sc{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(212,168,75,.6)}
.rc-sl,.rc-sd{font-size:10px;color:rgba(245,240,232,.25);font-family:'JetBrains Mono',ui-monospace,monospace}
.rc-sd{margin-left:auto}
.rc-sh{font-size:13px;color:rgba(245,240,232,.65);line-height:1.5;margin:0}
.rc-bc{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}
.rc-cg{padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.rc-ch{display:flex;align-items:center;gap:7px;margin-bottom:7px}
.rc-cn{font-size:13px;font-weight:600;color:rgba(245,240,232,.8);flex:1}
.rc-cc{font-size:10px;font-family:'JetBrains Mono',ui-monospace,monospace;color:rgba(212,168,75,.5);padding:1px 6px;border-radius:8px;border:1px solid rgba(212,168,75,.2)}
.rc-cs{font-size:11px;color:rgba(245,240,232,.45);margin:0 0 4px;line-height:1.4}
.rc-cm{font-size:10px;color:rgba(245,240,232,.2);margin:0;font-style:italic}
.rc-cta{padding:24px 28px;border-radius:14px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin-bottom:36px}
.rc-cey{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.6);margin-bottom:6px}
.rc-cti{font-family:Georgia,serif;font-size:18px;font-weight:400;color:#f5f0e8;margin:0 0 8px}
.rc-cbo{font-size:13px;line-height:1.7;color:rgba(245,240,232,.5);margin:0 0 14px;max-width:500px}
.rc-ca{display:flex;gap:10px;flex-wrap:wrap}
.rc-gold{display:inline-flex;align-items:center;padding:8px 16px;background:#d4a84b;color:#020814;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px}
.rc-gold:hover{opacity:.85}
.rc-ghost{display:inline-flex;align-items:center;padding:8px 16px;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px}
.rc-ghost:hover{border-color:rgba(255,255,255,.35);color:#fff}
.rc-ft{padding-top:20px;border-top:1px solid rgba(255,255,255,.06)}
.rc-ft p{font-size:11px;line-height:1.7;color:rgba(245,240,232,.25);margin:0 0 10px}
.rc-fl{display:flex;flex-wrap:wrap;gap:14px}
.rc-fl a{font-size:11px;color:#d4a84b;text-decoration:none}
.rc-fl a:hover{opacity:.7}
`
