import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPlaybook, DIFFICULTY_LABEL, DIFFICULTY_COLOR } from '@/lib/intelligence/jurisdictionPlaybooks'
import { getLatestBriefing } from '@/lib/intelligence/jurisdictionSynthesis'

const COUNTRY_FLAGS: Record<string, string> = {
  DE: '🇩🇪', GB: '🇬🇧', AU: '🇦🇺', CA: '🇨🇦', NL: '🇳🇱',
  PT: '🇵🇹', TH: '🇹🇭', IL: '🇮🇱', CO: '🇨🇴', ZA: '🇿🇦',
  MT: '🇲🇹', LU: '🇱🇺', CZ: '🇨🇿', NZ: '🇳🇿', MX: '🇲🇽',
  BR: '🇧🇷', CH: '🇨🇭', FR: '🇫🇷', ES: '🇪🇸', PL: '🇵🇱',
}

const LEGAL_LABELS: Record<string, string> = {
  medical_only: 'Medical only',
  adult_use: 'Adult-use & medical',
  decrim: 'Decriminalised',
  illegal: 'Prohibited',
  mixed: 'Mixed / varies by region',
  transitional: 'Transitional — reform underway',
  unknown: 'Status unverified',
}

const MATURITY_COLORS: Record<string, string> = {
  emerging: '#d4a84b',
  developing: '#5b9bd5',
  maturing: '#4caf82',
  mature: '#4caf82',
  restricted: '#e05555',
  unknown: 'rgba(245,240,232,.25)',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>
}): Promise<Metadata> {
  const { country } = await params
  const iso2 = country.toUpperCase()
  const playbook = await getPlaybook(iso2)
  if (!playbook) return { title: 'Playbook Not Found | Harbourview' }
  return {
    title: `${playbook.country_name} Market Entry Playbook — Cannabis Licensing | Harbourview`,
    description: `Step-by-step cannabis market entry playbook for ${playbook.country_name}. ${playbook.steps.length} licensing steps, ${playbook.typical_timeline_months}-month pathway, key regulatory bodies, and common pitfalls.`,
    openGraph: {
      title: `${playbook.country_name} Cannabis Market Entry Playbook | Harbourview`,
      description: playbook.legal_framework_summary ?? `Market entry intelligence for ${playbook.country_name}.`,
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function PlaybookDetailPage({
  params,
}: {
  params: Promise<{ country: string }>
}) {
  const { country } = await params
  const iso2 = country.toUpperCase()
  const [playbook, briefing] = await Promise.all([
    getPlaybook(iso2),
    getLatestBriefing(iso2),
  ])
  if (!playbook) return notFound()

  const flag = COUNTRY_FLAGS[iso2] ?? '🌐'
  const difficultyColor = DIFFICULTY_COLOR[playbook.difficulty] ?? '#d4a84b'
  const totalWeeks = playbook.steps.reduce((acc, s) => acc + s.estimated_weeks, 0)

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>
      <div className="pd-wrap">

        <nav className="pd-nav">
          <Link href="/intelligence" className="pd-nav-link">Intelligence</Link>
          <span className="pd-nav-sep">›</span>
          <Link href="/intelligence/playbooks" className="pd-nav-link">Playbooks</Link>
          <span className="pd-nav-sep">›</span>
          <span className="pd-nav-current">{playbook.country_name}</span>
        </nav>

        <header className="pd-hero">
          <div className="pd-hero-flag">{flag}</div>
          <div className="pd-hero-meta">
            <p className="pd-eyebrow">Market Entry Playbook</p>
            <h1 className="pd-title">{playbook.country_name}</h1>
            <div className="pd-hero-chips">
              <span className="pd-chip pd-chip--mono">{iso2}</span>
              <span
                className="pd-chip pd-chip--diff"
                style={{ color: difficultyColor, borderColor: `${difficultyColor}30`, background: `${difficultyColor}0f` }}
              >
                {DIFFICULTY_LABEL[playbook.difficulty]}
              </span>
              <span className="pd-chip pd-chip--mono">{playbook.typical_timeline_months} months typical</span>
              {playbook.estimated_cost_range && (
                <span className="pd-chip pd-chip--mono">{playbook.estimated_cost_range}</span>
              )}
            </div>
          </div>
          <div className="pd-hero-actions">
            <Link href={`/intelligence/country/${iso2.toLowerCase()}`} className="pd-ghost">
              Country brief →
            </Link>
            <Link href="/contact" className="pd-gold">Request guidance →</Link>
          </div>
        </header>

        {playbook.legal_framework_summary && (
          <section className="pd-section">
            <p className="pd-label">Legal Framework</p>
            <p className="pd-body">{playbook.legal_framework_summary}</p>
          </section>
        )}

        {playbook.steps.length > 0 && totalWeeks > 0 && (
          <section className="pd-section">
            <p className="pd-label">Pathway Timeline — {totalWeeks} weeks estimated</p>
            <div className="pd-bar">
              {playbook.steps.map((step, i) => {
                const pct = ((step.estimated_weeks / totalWeeks) * 100).toFixed(1)
                const hue = `hsl(${(i * 47) % 360}, 40%, 48%)`
                return (
                  <div
                    key={step.step}
                    className="pd-bar-seg"
                    style={{ width: `${pct}%`, background: hue }}
                    title={`${step.title} (~${step.estimated_weeks}w)`}
                  >
                    {parseFloat(pct) > 8 && (
                      <span className="pd-bar-n">{step.step}</span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="pd-bar-legend">
              {playbook.steps.map((step, i) => (
                <span key={step.step} className="pd-bar-item">
                  <span className="pd-bar-dot" style={{ background: `hsl(${(i * 47) % 360}, 40%, 48%)` }} />
                  {step.step}. {step.title} (~{step.estimated_weeks}w)
                </span>
              ))}
            </div>
          </section>
        )}

        {playbook.steps.length > 0 && (
          <section className="pd-section">
            <p className="pd-label">Entry Steps</p>
            <ol className="pd-steps">
              {playbook.steps.map((step) => (
                <li key={step.step} className="pd-step">
                  <div className="pd-step-n">{step.step}</div>
                  <div className="pd-step-body">
                    <div className="pd-step-hd">
                      <h3 className="pd-step-title">{step.title}</h3>
                      <span className="pd-step-wks">~{step.estimated_weeks}w</span>
                    </div>
                    <p className="pd-step-text">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {playbook.key_regulators.length > 0 && (
          <section className="pd-section">
            <p className="pd-label">Key Regulatory Bodies</p>
            <div className="pd-regs">
              {playbook.key_regulators.map((reg) => (
                <div key={reg.name} className="pd-reg-card">
                  <div className="pd-reg-name">{reg.name}</div>
                  <div className="pd-reg-role">{reg.role}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {playbook.common_pitfalls.length > 0 && (
          <section className="pd-section">
            <p className="pd-label">Common Pitfalls</p>
            <ul className="pd-pitfalls">
              {playbook.common_pitfalls.map((pitfall, i) => (
                <li key={i} className="pd-pitfall">
                  <span className="pd-pitfall-ico">⚠</span>
                  <span className="pd-pitfall-text">{pitfall}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {briefing && (
          <section className="pd-section pd-section--brief">
            <div className="pd-brief-hd">
              <p className="pd-label">Current Market Intelligence</p>
              <span className="pd-brief-meta">
                w/e {briefing.week_ending} · {briefing.signal_count} signals
              </span>
            </div>
            <h2 className="pd-brief-headline">{briefing.headline}</h2>
            <div className="pd-brief-chips">
              <span className="pd-chip pd-chip--mono">
                {LEGAL_LABELS[briefing.legal_status] ?? briefing.legal_status}
              </span>
              <span
                className="pd-chip"
                style={{
                  color: MATURITY_COLORS[briefing.market_maturity],
                  borderColor: `${MATURITY_COLORS[briefing.market_maturity]}30`,
                }}
              >
                {briefing.market_maturity.charAt(0).toUpperCase() + briefing.market_maturity.slice(1)} market
              </span>
            </div>
            <p className="pd-brief-summary">{briefing.summary}</p>
            {briefing.what_changed && (
              <div className="pd-brief-block">
                <p className="pd-brief-block-lbl">What changed</p>
                <p className="pd-brief-block-body">{briefing.what_changed}</p>
              </div>
            )}
            {briefing.operator_implications && (
              <div className="pd-brief-block">
                <p className="pd-brief-block-lbl">Operator implications</p>
                <p className="pd-brief-block-body">{briefing.operator_implications}</p>
              </div>
            )}
            {briefing.whats_coming && (
              <div className="pd-brief-block">
                <p className="pd-brief-block-lbl">{"What's coming"}</p>
                <p className="pd-brief-block-body">{briefing.whats_coming}</p>
              </div>
            )}
            {briefing.key_signals.length > 0 && (
              <div className="pd-brief-block">
                <p className="pd-brief-block-lbl">Key signals</p>
                <ul className="pd-sigs">
                  {briefing.key_signals.map((sig, i) => (
                    <li key={i} className="pd-sig">
                      <span className="pd-sig-dot" />
                      {sig}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section className="pd-cta-section">
          <div>
            <p className="pd-cta-eyebrow">Need deeper intelligence?</p>
            <h2 className="pd-cta-title">Reviewed guidance for {playbook.country_name}</h2>
            <p className="pd-cta-body">
              This playbook is orientation-level. Detailed licensing pathway analysis, counterparty review,
              route intelligence, and commercial timing guidance are available through Harbourview&apos;s
              reviewed private workflows.
            </p>
            <div className="pd-cta-actions">
              <Link href="/contact" className="pd-gold">
                Request {playbook.country_name} Intelligence →
              </Link>
              <Link href="/intake" className="pd-ghost">Start confidential intake</Link>
            </div>
          </div>
          <div className="pd-meta-panel">
            {([
              ['Updated', playbook.last_reviewed],
              ['Steps', String(playbook.steps.length)],
              ['Regulators', String(playbook.key_regulators.length)],
              ['Complexity', DIFFICULTY_LABEL[playbook.difficulty]],
            ] as [string, string][]).map(([label, value]) => (
              <span key={label} className="pd-meta-row">
                <span className="pd-meta-lbl">{label}</span>
                <span
                  className="pd-meta-val"
                  style={label === 'Complexity' ? { color: difficultyColor } : {}}
                >
                  {value}
                </span>
              </span>
            ))}
          </div>
        </section>

        <footer className="pd-footnote">
          <p>
            Playbooks are orientation-level guides only and do not constitute legal, regulatory, or
            investment advice. Regulatory frameworks change frequently — verify current requirements
            with qualified local counsel before committing to any market.
          </p>
          <div className="pd-footnote-links">
            <Link href="/intelligence/playbooks">All Playbooks →</Link>
            <Link href="/intelligence/licensing-pathways">Licence Category Guide →</Link>
            <Link href="/markets">Market Briefings →</Link>
            <Link href="/signals">Signals →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.pd-wrap{max-width:900px;margin:0 auto;padding:48px 24px 80px}
.pd-nav{display:flex;align-items:center;gap:8px;margin-bottom:40px;flex-wrap:wrap}
.pd-nav-link{font-size:11px;letter-spacing:.08em;color:#d4a84b;text-decoration:none}
.pd-nav-link:hover{opacity:.7}
.pd-nav-sep{color:rgba(245,240,232,.2);font-size:11px}
.pd-nav-current{font-size:11px;color:rgba(245,240,232,.4)}
.pd-hero{display:grid;grid-template-columns:auto 1fr auto;gap:24px;align-items:start;margin-bottom:48px}
@media(max-width:680px){.pd-hero{grid-template-columns:1fr}}
.pd-hero-flag{font-size:48px;line-height:1;padding-top:4px}
.pd-eyebrow{font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(212,168,75,.7);margin-bottom:8px}
.pd-title{font-family:Georgia,serif;font-size:clamp(28px,4vw,48px);font-weight:400;color:#f5f0e8;letter-spacing:-.01em;margin:0 0 16px}
.pd-hero-chips{display:flex;flex-wrap:wrap;gap:6px}
.pd-hero-actions{display:flex;flex-direction:column;gap:8px;align-items:flex-end;padding-top:36px}
@media(max-width:680px){.pd-hero-actions{align-items:flex-start;flex-direction:row;flex-wrap:wrap}}
.pd-chip{display:inline-flex;align-items:center;padding:3px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);font-size:11px;color:rgba(245,240,232,.6)}
.pd-chip--mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.04em}
.pd-chip--diff{font-weight:600;font-size:10px;letter-spacing:.08em}
.pd-gold{display:inline-flex;align-items:center;padding:9px 18px;background:#d4a84b;color:#050c18;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:opacity .15s;white-space:nowrap}
.pd-gold:hover{opacity:.85}
.pd-ghost{display:inline-flex;align-items:center;padding:9px 18px;border:1px solid rgba(245,240,232,.15);color:rgba(245,240,232,.6);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:border-color .15s,color .15s;white-space:nowrap}
.pd-ghost:hover{border-color:rgba(245,240,232,.35);color:#f5f0e8}
.pd-section{margin-bottom:24px;padding:28px 32px;border-radius:16px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.pd-section--brief{border-color:rgba(212,168,75,.15);background:rgba(212,168,75,.025)}
.pd-label{font-size:10px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:rgba(212,168,75,.6);margin-bottom:16px}
.pd-body{font-size:14px;line-height:1.75;color:rgba(245,240,232,.65);margin:0}
.pd-bar{display:flex;height:20px;border-radius:6px;overflow:hidden;gap:2px;margin-bottom:12px}
.pd-bar-seg{position:relative;display:flex;align-items:center;justify-content:center;min-width:4px;border-radius:4px;cursor:default;transition:opacity .15s}
.pd-bar-seg:hover{opacity:.8}
.pd-bar-n{font-size:9px;font-weight:700;color:rgba(255,255,255,.8);font-family:'JetBrains Mono',ui-monospace,monospace}
.pd-bar-legend{display:flex;flex-wrap:wrap;gap:8px 14px}
.pd-bar-item{display:flex;align-items:center;gap:5px;font-size:10px;color:rgba(245,240,232,.35);font-family:'JetBrains Mono',ui-monospace,monospace}
.pd-bar-dot{width:8px;height:8px;border-radius:3px;flex-shrink:0}
.pd-steps{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:20px}
.pd-step{display:flex;gap:16px;align-items:flex-start}
.pd-step-n{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;border:1px solid rgba(212,168,75,.3);background:rgba(212,168,75,.08);font-size:11px;font-weight:700;color:#d4a84b;flex-shrink:0;font-family:'JetBrains Mono',ui-monospace,monospace;margin-top:2px}
.pd-step-body{flex:1}
.pd-step-hd{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:4px}
.pd-step-title{font-size:14px;font-weight:600;color:rgba(245,240,232,.85);margin:0;line-height:1.3}
.pd-step-wks{font-size:9px;font-family:'JetBrains Mono',ui-monospace,monospace;color:rgba(245,240,232,.2);flex-shrink:0}
.pd-step-text{font-size:13px;line-height:1.65;color:rgba(245,240,232,.5);margin:0}
.pd-regs{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.pd-reg-card{padding:16px 20px;border-radius:10px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.04)}
.pd-reg-name{font-size:13px;font-weight:600;color:rgba(212,168,75,.8);margin-bottom:4px}
.pd-reg-role{font-size:12px;line-height:1.5;color:rgba(245,240,232,.4)}
.pd-pitfalls{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
.pd-pitfall{display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-radius:8px;border:1px solid rgba(224,85,85,.12);background:rgba(224,85,85,.04)}
.pd-pitfall-ico{color:rgba(224,85,85,.5);font-size:13px;flex-shrink:0;margin-top:1px}
.pd-pitfall-text{font-size:13px;line-height:1.55;color:rgba(245,240,232,.55)}
.pd-brief-hd{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:0}
.pd-brief-meta{font-size:10px;font-family:'JetBrains Mono',ui-monospace,monospace;color:rgba(245,240,232,.2)}
.pd-brief-headline{font-size:15px;font-weight:600;color:#f5f0e8;margin:10px 0;line-height:1.4}
.pd-brief-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.pd-brief-summary{font-size:13px;line-height:1.7;color:rgba(245,240,232,.6);margin:0}
.pd-brief-block{margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.05)}
.pd-brief-block-lbl{font-size:9px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:rgba(212,168,75,.5);margin-bottom:6px}
.pd-brief-block-body{font-size:13px;line-height:1.65;color:rgba(245,240,232,.55);margin:0}
.pd-sigs{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px}
.pd-sig{display:flex;gap:10px;align-items:baseline;font-size:12px;color:rgba(245,240,232,.45);line-height:1.5}
.pd-sig-dot{width:5px;height:5px;border-radius:50%;background:rgba(212,168,75,.4);flex-shrink:0;margin-top:6px}
.pd-cta-section{margin-bottom:48px;padding:32px;border-radius:16px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);display:grid;grid-template-columns:1fr auto;gap:32px;align-items:start}
@media(max-width:680px){.pd-cta-section{grid-template-columns:1fr}}
.pd-cta-eyebrow{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.6);margin-bottom:8px}
.pd-cta-title{font-family:Georgia,serif;font-size:20px;font-weight:400;color:#f5f0e8;margin:0 0 12px}
.pd-cta-body{font-size:13px;line-height:1.7;color:rgba(245,240,232,.5);margin:0 0 20px;max-width:520px}
.pd-cta-actions{display:flex;gap:10px;flex-wrap:wrap}
.pd-meta-panel{display:flex;flex-direction:column;gap:10px;border-left:1px solid rgba(255,255,255,.07);padding-left:28px}
@media(max-width:680px){.pd-meta-panel{border-left:none;padding-left:0;border-top:1px solid rgba(255,255,255,.07);padding-top:20px}}
.pd-meta-row{display:flex;flex-direction:column;gap:2px}
.pd-meta-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.18em;color:rgba(245,240,232,.25);font-weight:600}
.pd-meta-val{font-size:13px;color:rgba(245,240,232,.65);font-family:'JetBrains Mono',ui-monospace,monospace}
.pd-footnote{margin-top:48px;padding-top:24px;border-top:1px solid rgba(255,255,255,.06)}
.pd-footnote p{font-size:11px;line-height:1.7;color:rgba(245,240,232,.25);max-width:640px;margin:0 0 16px}
.pd-footnote-links{display:flex;flex-wrap:wrap;gap:16px}
.pd-footnote-links a{font-size:11px;color:#d4a84b;text-decoration:none}
.pd-footnote-links a:hover{opacity:.7}
`
