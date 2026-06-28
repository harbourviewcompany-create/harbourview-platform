import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export const metadata: Metadata = {
  title: 'Professional Briefings | Harbourview Education',
  description: 'Weekly cannabis market briefings across 200+ jurisdictions.',
}

export const dynamic = 'force-dynamic'

type Briefing = {
  id: string; country_iso2: string; country_name: string; legal_status: string
  market_maturity: string; headline: string; summary: string; week_ending: string; signal_count: number
}

const MC: Record<string,string> = {
  emerging:'#d4a84b',developing:'#5b9bd5',maturing:'#4caf82',mature:'#4caf82',restricted:'#e05555',unknown:'rgba(245,240,232,.25)'
}
const LL: Record<string,string> = {
  medical_only:'Medical',adult_use:'Adult-use',decrim:'Decrim',illegal:'Prohibited',mixed:'Mixed',transitional:'Transitional',unknown:'—'
}
const FL: Record<string,string> = {
  DE:'🇩🇪',GB:'🇬🇧',AU:'🇦🇺',CA:'🇨🇦',NL:'🇳🇱',PT:'🇵🇹',TH:'🇹🇭',IL:'🇮🇱',CO:'🇨🇴',ZA:'🇿🇦',
  MT:'🇲🇹',LU:'🇱🇺',CZ:'🇨🇿',NZ:'🇳🇿',MX:'🇲🇽',BR:'🇧🇷',CH:'🇨🇭',FR:'🇫🇷',ES:'🇪🇸',PL:'🇵🇱'
}

async function getRecentBriefings(): Promise<Briefing[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  const client = createClient(url, key, { auth: { persistSession: false } })
  const { data } = await client
    .from('jurisdiction_briefings')
    .select('id,country_iso2,country_name,legal_status,market_maturity,headline,summary,week_ending,signal_count')
    .eq('status', 'published').order('week_ending', { ascending: false }).limit(60)
  if (!data) return []
  const seen = new Set<string>()
  return (data as Briefing[]).filter(b => { if (seen.has(b.country_iso2)) return false; seen.add(b.country_iso2); return true })
}

export default async function BriefingsPage() {
  const briefings = await getRecentBriefings()
  const weekEnding = briefings[0]?.week_ending ?? null

  return (
    <main className="bg-[#020814] text-white min-h-screen">
      <style>{CSS}</style>
      <div className="br-wrap">
        <nav className="br-nav">
          <Link href="/education" className="br-a">Education</Link>
          <span className="br-sep">›</span>
          <span className="br-cur">Professional Briefings</span>
        </nav>
        <header className="br-hd">
          <p className="br-ey">Education / Intelligence Briefings</p>
          <h1 className="br-ti">Professional Briefings</h1>
          <p className="br-su">
            Weekly market intelligence briefings across{' '}
            {briefings.length > 0 ? `${briefings.length}+` : '200+'} jurisdictions — synthesised
            from Harbourview&apos;s 516-source regulatory registry.
          </p>
          {weekEnding && (
            <div className="br-me">
              <span>Most recent: w/e {weekEnding}</span>
              <span>{briefings.length} jurisdictions</span>
            </div>
          )}
        </header>

        {briefings.length === 0 ? (
          <div className="br-emp">
            <p>Briefings are synthesised weekly. Check back after the next scheduled run.</p>
            <Link href="/markets" className="br-a">Live market status →</Link>
          </div>
        ) : (
          <div className="br-grid">
            {briefings.map(b => {
              const color = MC[b.market_maturity] ?? MC.unknown
              return (
                <Link key={b.id} href={`/intelligence/country/${b.country_iso2.toLowerCase()}`} className="br-card">
                  <div className="br-ct">
                    <span style={{fontSize:18}}>{FL[b.country_iso2] ?? '🌐'}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <span className="br-cn">{b.country_name ?? b.country_iso2}</span>
                      <div className="br-ch">
                        <span className="br-chip">{LL[b.legal_status]}</span>
                        <span className="br-chip" style={{color,borderColor:`${color}30`}}>{b.market_maturity}</span>
                      </div>
                    </div>
                    <span className="br-sc">{b.signal_count ?? 0}s</span>
                  </div>
                  <p className="br-hl">{b.headline}</p>
                  {b.summary && <p className="br-sm">{b.summary.length > 130 ? b.summary.slice(0,130)+'…' : b.summary}</p>}
                  <div className="br-bar" style={{background:color}} />
                </Link>
              )
            })}
          </div>
        )}

        <div className="br-bd">
          <p className="br-bdl">Education boundary</p>
          <p className="br-bdt">Briefings are orientation-level only. Not legal, regulatory, or market-entry advice. Verify all requirements with qualified local counsel.</p>
          <div className="br-bda">
            <Link href="/markets" className="br-gold">Live Market Status →</Link>
            <Link href="/intelligence/playbooks" className="br-ghost">Market Entry Playbooks</Link>
          </div>
        </div>
      </div>
    </main>
  )
}

const CSS = `
.br-wrap{max-width:1100px;margin:0 auto;padding:48px 24px 80px}
.br-nav{display:flex;align-items:center;gap:8px;margin-bottom:40px}
.br-a{font-size:11px;letter-spacing:.08em;color:#d4a84b;text-decoration:none}
.br-a:hover{opacity:.7}
.br-sep{color:rgba(255,255,255,.2);font-size:11px}
.br-cur{font-size:11px;color:rgba(255,255,255,.4)}
.br-hd{margin-bottom:32px}
.br-ey{font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(212,168,75,.7);margin-bottom:10px}
.br-ti{font-family:Georgia,serif;font-size:clamp(28px,4vw,44px);font-weight:400;color:#f5f0e8;letter-spacing:-.01em;margin:0 0 14px}
.br-su{font-size:14px;color:rgba(245,240,232,.55);max-width:660px;line-height:1.7;margin:0 0 14px}
.br-me{display:flex;flex-wrap:wrap;gap:16px;font-size:10px;font-family:'JetBrains Mono',ui-monospace,monospace;color:rgba(245,240,232,.3)}
.br-emp{padding:48px;text-align:center;border:1px solid rgba(255,255,255,.07);border-radius:12px;margin-bottom:40px}
.br-emp p{font-size:14px;color:rgba(245,240,232,.4);margin:0 0 16px}
.br-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:40px}
.br-card{position:relative;display:flex;flex-direction:column;gap:5px;padding:14px 16px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);text-decoration:none;overflow:hidden;transition:border-color .15s}
.br-card:hover{border-color:rgba(212,168,75,.2)}
.br-ct{display:flex;align-items:flex-start;gap:8px;margin-bottom:4px}
.br-cn{font-size:13px;font-weight:600;color:rgba(245,240,232,.85);display:block;margin-bottom:3px}
.br-ch{display:flex;flex-wrap:wrap;gap:4px}
.br-chip{font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:2px 6px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(245,240,232,.4);font-weight:600}
.br-sc{font-size:9px;font-family:'JetBrains Mono',ui-monospace,monospace;color:rgba(245,240,232,.2);white-space:nowrap;flex-shrink:0}
.br-hl{font-size:12px;font-weight:600;color:rgba(245,240,232,.75);margin:0;line-height:1.4}
.br-sm{font-size:11px;color:rgba(245,240,232,.4);margin:0;line-height:1.5}
.br-bar{position:absolute;bottom:0;left:0;right:0;height:2px;opacity:.4}
.br-bd{padding:24px 28px;border-radius:14px;border:1px solid rgba(212,168,75,.1);background:rgba(212,168,75,.03)}
.br-bdl{font-size:9px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.5);margin-bottom:6px}
.br-bdt{font-size:12px;line-height:1.65;color:rgba(245,240,232,.4);margin:0 0 14px;max-width:580px}
.br-bda{display:flex;gap:10px;flex-wrap:wrap}
.br-gold{display:inline-flex;align-items:center;padding:8px 16px;background:#d4a84b;color:#020814;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px}
.br-gold:hover{opacity:.85}
.br-ghost{display:inline-flex;align-items:center;padding:8px 16px;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px}
.br-ghost:hover{border-color:rgba(255,255,255,.35);color:#fff}
`
