import type { Metadata } from 'next'
import Link from 'next/link'
import { deriveCorridorPlan } from '@/lib/intelligence/workflowEngine'
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL } from '@/lib/intelligence/jurisdictionPlaybooks'

const COUNTRY_FLAGS: Record<string, string> = {
  DE: '🇩🇪', GB: '🇬🇧', AU: '🇦🇺', CA: '🇨🇦', NL: '🇳🇱',
  PT: '🇵🇹', TH: '🇹🇭', IL: '🇮🇱', CO: '🇨🇴', ZA: '🇿🇦',
  MT: '🇲🇹', LU: '🇱🇺', CZ: '🇨🇿', NZ: '🇳🇿', MX: '🇲🇽',
  BR: '🇧🇷', CH: '🇨🇭', FR: '🇫🇷', ES: '🇪🇸', PL: '🇵🇱',
}

export const metadata: Metadata = {
  title: 'Corridor Workflow Plan (Prototype) — Harbourview Intelligence',
  description:
    'A merged, ordered market-entry execution plan across two jurisdictions at once, instead of reading each country\u2019s playbook separately.',
}

export const dynamic = 'force-dynamic'

export default async function WorkflowPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ origin?: string; destination?: string }>
}) {
  const { origin = 'CA', destination = 'DE' } = await searchParams
  const plan = await deriveCorridorPlan(origin, destination)

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>
      <div className="wp-wrap">
        <nav className="wp-nav">
          <Link href="/intelligence" className="wp-nav-link">Intelligence</Link>
          <span className="wp-nav-sep">›</span>
          <Link href="/intelligence/playbooks" className="wp-nav-link">Playbooks</Link>
          <span className="wp-nav-sep">›</span>
          <span className="wp-nav-current">Workflow Plan</span>
        </nav>

        <div className="wp-eyebrow">Market Entry OS · Layer 9 prototype</div>
        <h1 className="wp-title">Corridor Workflow Plan</h1>
        <p className="wp-sub">
          One merged execution plan across both jurisdictions, instead of reading each
          country&rsquo;s playbook separately and reconciling them yourself. Built against
          jurisdiction_playbooks — no new schema, no new data entry.
        </p>

        {!plan ? (
          <div className="wp-empty">
            No published playbook for <strong>{origin.toUpperCase()}</strong> and/or{' '}
            <strong>{destination.toUpperCase()}</strong> yet. Try{' '}
            <Link href="/intelligence/workflow-plan?origin=CA&destination=DE">CA → DE</Link>, the pair
            this prototype was built and tested against.
          </div>
        ) : (
          <>
            <div className="wp-corridor-hd">
              <div className="wp-corridor-side">
                <span className="wp-flag">{COUNTRY_FLAGS[plan.origin.iso2] ?? '🌐'}</span>
                <div>
                  <div className="wp-corridor-label">Export from</div>
                  <div className="wp-corridor-name">{plan.origin.name}</div>
                </div>
              </div>
              <div className="wp-corridor-arrow">→</div>
              <div className="wp-corridor-side">
                <span className="wp-flag">{COUNTRY_FLAGS[plan.destination.iso2] ?? '🌐'}</span>
                <div>
                  <div className="wp-corridor-label">Import into</div>
                  <div className="wp-corridor-name">{plan.destination.name}</div>
                </div>
              </div>
            </div>

            <div className="wp-estimate-row">
              <div className="wp-estimate-card">
                <div className="wp-estimate-lbl">Naive sequential estimate</div>
                <div className="wp-estimate-val wp-estimate-val--dim">
                  {plan.totalSequentialWeeks}<span className="wp-estimate-unit">weeks</span>
                </div>
                <div className="wp-estimate-note">Every step, both sides, back to back</div>
              </div>
              <div className="wp-estimate-card wp-estimate-card--highlight">
                <div className="wp-estimate-lbl">Critical-path estimate</div>
                <div className="wp-estimate-val">
                  {plan.criticalPathWeeksEstimate}<span className="wp-estimate-unit">weeks</span>
                </div>
                <div className="wp-estimate-note">
                  Assumes export-side and import-side work run in parallel — see caveat below
                </div>
              </div>
            </div>

            {plan.notes.length > 0 && (
              <div className="wp-notes">
                <p className="wp-notes-lbl">⚡ Corridor-specific insight</p>
                {plan.notes.map((note, i) => (
                  <p key={i} className="wp-notes-body">{note}</p>
                ))}
              </div>
            )}

            <section className="wp-section">
              <p className="wp-label">Merged Step Sequence — {plan.steps.length} steps</p>
              <ol className="wp-steps">
                {plan.steps.map((step, i) => (
                  <li key={`${step.country_iso2}-${step.step}`} className="wp-step">
                    <div
                      className="wp-step-n"
                      style={{
                        background: step.side === 'export' ? 'rgba(91,155,213,.15)' : 'rgba(212,168,75,.15)',
                        color: step.side === 'export' ? '#5b9bd5' : '#d4a84b',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="wp-step-body">
                      <div className="wp-step-hd">
                        <span
                          className="wp-step-side"
                          style={{ color: step.side === 'export' ? '#5b9bd5' : '#d4a84b' }}
                        >
                          {COUNTRY_FLAGS[step.country_iso2] ?? '🌐'} {step.side === 'export' ? 'Export' : 'Import'} · {step.country_name}
                        </span>
                        <span className="wp-step-wks">~{step.estimated_weeks}w</span>
                      </div>
                      <h3 className="wp-step-title">{step.title}</h3>
                      <p className="wp-step-text">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="wp-section">
              <p className="wp-label">Cost & Difficulty</p>
              <div className="wp-two-col">
                {[plan.origin, plan.destination].map((side) => {
                  const cost = plan.estimatedCostRanges.find((c) => c.country_iso2 === side.iso2)
                  return (
                    <div key={side.iso2} className="wp-info-card">
                      <div className="wp-info-hd">{COUNTRY_FLAGS[side.iso2] ?? '🌐'} {side.name}</div>
                      <div className="wp-info-row">
                        <span
                          className="wp-chip"
                          style={{
                            color: DIFFICULTY_COLOR[side.difficulty],
                            borderColor: `${DIFFICULTY_COLOR[side.difficulty]}30`,
                          }}
                        >
                          {DIFFICULTY_LABEL[side.difficulty] ?? side.difficulty}
                        </span>
                      </div>
                      <div className="wp-info-cost">{cost?.range ?? 'Not estimated'}</div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="wp-section">
              <p className="wp-label">Regulators — both sides</p>
              <div className="wp-two-col">
                {plan.regulators.map((r) => (
                  <div key={r.country_iso2} className="wp-info-card">
                    <div className="wp-info-hd">{COUNTRY_FLAGS[r.country_iso2] ?? '🌐'} {r.country_iso2}</div>
                    <ul className="wp-reg-list">
                      {r.regulators.map((reg, i) => (
                        <li key={i} className="wp-reg-item">
                          <span className="wp-reg-name">{reg.name}</span>
                          {reg.tier && <span className="wp-reg-tier">{reg.tier}</span>}
                          <span className="wp-reg-role">{reg.role}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="wp-section">
              <p className="wp-label">Risks & Common Pitfalls — both sides</p>
              <div className="wp-two-col">
                {plan.risks.map((r) => (
                  <div key={r.country_iso2} className="wp-info-card">
                    <div className="wp-info-hd">{COUNTRY_FLAGS[r.country_iso2] ?? '🌐'} {r.country_iso2}</div>
                    <ul className="wp-pitfall-list">
                      {r.pitfalls.map((p, i) => (
                        <li key={i} className="wp-pitfall-item">
                          <span className="wp-pitfall-ico">⚠</span>
                          <span className="wp-pitfall-text">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <div className="wp-footnote">
              <p>
                Prototype, not a finished Layer 9. The two step lists above are ordered correctly
                within each country, but the plan does not yet model dependencies{' '}
                <em>between</em> them — so the critical-path number assumes the export-side and
                import-side work can run fully in parallel, which won&rsquo;t always be true (the
                corridor insight above is one example of exactly that). Treat the estimate as a
                starting point for planning, not a committed timeline.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

const CSS = `
.wp-wrap{max-width:820px;margin:0 auto;padding:32px 20px 80px}
.wp-nav{display:flex;align-items:center;gap:8px;margin-bottom:28px;font-size:12px}
.wp-nav-link{color:rgba(245,240,232,.4);text-decoration:none}
.wp-nav-link:hover{color:rgba(245,240,232,.7)}
.wp-nav-sep{color:rgba(245,240,232,.2)}
.wp-nav-current{color:rgba(245,240,232,.6)}
.wp-eyebrow{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.6);margin-bottom:10px}
.wp-title{font-family:Georgia,serif;font-size:32px;font-weight:400;color:#f5f0e8;margin:0 0 14px}
.wp-sub{font-size:14px;line-height:1.7;color:rgba(245,240,232,.55);max-width:600px;margin:0 0 32px}
.wp-empty{padding:24px;border-radius:12px;border:1px solid rgba(255,255,255,.08);font-size:14px;line-height:1.7;color:rgba(245,240,232,.6)}
.wp-empty a{color:#d4a84b;text-decoration:none}
.wp-corridor-hd{display:flex;align-items:center;gap:20px;padding:24px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);margin-bottom:24px}
.wp-corridor-side{display:flex;align-items:center;gap:14px}
.wp-flag{font-size:32px;line-height:1}
.wp-corridor-label{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(245,240,232,.35);margin-bottom:3px}
.wp-corridor-name{font-size:17px;color:#f5f0e8;font-weight:500}
.wp-corridor-arrow{font-size:20px;color:rgba(212,168,75,.5);margin:0 auto}
.wp-estimate-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px}
@media(max-width:560px){.wp-estimate-row{grid-template-columns:1fr}}
.wp-estimate-card{padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.015)}
.wp-estimate-card--highlight{border-color:rgba(212,168,75,.25);background:rgba(212,168,75,.04)}
.wp-estimate-lbl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(245,240,232,.4);margin-bottom:8px}
.wp-estimate-val{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:34px;color:#d4a84b;font-weight:600;line-height:1}
.wp-estimate-val--dim{color:rgba(245,240,232,.4)}
.wp-estimate-unit{font-size:14px;margin-left:6px;font-weight:400;color:rgba(245,240,232,.4)}
.wp-estimate-note{font-size:11px;line-height:1.5;color:rgba(245,240,232,.35);margin-top:8px}
.wp-notes{padding:18px 20px;border-radius:12px;background:rgba(91,155,213,.06);border:1px solid rgba(91,155,213,.18);margin-bottom:32px}
.wp-notes-lbl{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#5b9bd5;margin:0 0 8px}
.wp-notes-body{font-size:13px;line-height:1.7;color:rgba(245,240,232,.7);margin:0}
.wp-section{margin-bottom:36px}
.wp-label{font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgba(212,168,75,.55);margin:0 0 16px}
.wp-steps{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:14px}
.wp-step{display:flex;gap:16px}
.wp-step-n{flex-shrink:0;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;font-family:'JetBrains Mono',ui-monospace,monospace}
.wp-step-body{flex:1;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.05)}
.wp-step-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
.wp-step-side{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.wp-step-wks{font-size:11px;font-family:'JetBrains Mono',ui-monospace,monospace;color:rgba(245,240,232,.35)}
.wp-step-title{font-size:15px;font-weight:600;color:#f5f0e8;margin:0 0 6px}
.wp-step-text{font-size:13px;line-height:1.6;color:rgba(245,240,232,.55);margin:0}
.wp-two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:560px){.wp-two-col{grid-template-columns:1fr}}
.wp-info-card{padding:18px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.015)}
.wp-info-hd{font-size:13px;font-weight:600;color:#f5f0e8;margin-bottom:12px}
.wp-info-row{margin-bottom:10px}
.wp-chip{display:inline-block;padding:3px 10px;border-radius:100px;border:1px solid;font-size:11px;font-weight:600}
.wp-info-cost{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:15px;color:rgba(245,240,232,.7)}
.wp-reg-list,.wp-pitfall-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
.wp-reg-item{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px;font-size:12px}
.wp-reg-name{color:rgba(245,240,232,.8);font-weight:600}
.wp-reg-tier{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#d4a84b;border:1px solid rgba(212,168,75,.3);border-radius:4px;padding:1px 5px}
.wp-reg-role{color:rgba(245,240,232,.4);font-size:11px}
.wp-pitfall-item{display:flex;gap:8px;align-items:flex-start}
.wp-pitfall-ico{color:rgba(224,85,85,.5);font-size:12px;flex-shrink:0;margin-top:2px}
.wp-pitfall-text{font-size:12px;line-height:1.55;color:rgba(245,240,232,.55)}
.wp-footnote{margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,.06)}
.wp-footnote p{font-size:11px;line-height:1.7;color:rgba(245,240,232,.3);max-width:660px;margin:0}
.wp-footnote em{color:rgba(245,240,232,.45);font-style:italic}
`
