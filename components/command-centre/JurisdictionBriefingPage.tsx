'use client'

import Link from 'next/link'
import type {
  JurisdictionRouteContract,
  CCReviewState,
  CCWatchRegion,
  CCChangeNote,
} from '@/lib/command-centre/jurisdictionRouteContext'

// ── Flag map ──────────────────────────────────────────────────────────────────

const FLAG: Record<string, string> = {
  US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', AU: '🇦🇺',
  NL: '🇳🇱', MX: '🇲🇽', ES: '🇪🇸', BR: '🇧🇷', IL: '🇮🇱', PT: '🇵🇹',
  PL: '🇵🇱', IT: '🇮🇹', DK: '🇩🇰', CH: '🇨🇭', CZ: '🇨🇿', NZ: '🇳🇿',
  CO: '🇨🇴', TH: '🇹🇭', MT: '🇲🇹', LU: '🇱🇺', ZA: '🇿🇦', UY: '🇺🇾',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PendingBadge({ label = 'Pending review' }: { label?: string }) {
  return <span className="jb-pending-badge">{label}</span>
}

function StatusField({
  label, value, reviewState, icon,
}: {
  label: string
  value: string | null
  reviewState: CCReviewState
  icon: string
}) {
  return (
    <div className="jb-status-field">
      <span className="jb-status-icon" aria-hidden="true">{icon}</span>
      <div className="jb-status-body">
        <small>{label}</small>
        {value
          ? <strong>{value}</strong>
          : reviewState === 'unavailable'
            ? <span className="jb-unavailable">Unavailable</span>
            : <PendingBadge />
        }
      </div>
    </div>
  )
}

function ConfidenceDonut({ pct }: { pct: number }) {
  const r = 26
  const circ = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 64 64" className="jb-donut" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="7" />
      <circle
        cx="32" cy="32" r={r} fill="none" stroke="#d4a84b" strokeWidth="7"
        strokeDasharray={`${circ * pct / 100} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 32 32)"
      />
    </svg>
  )
}

function WatchRegionRow({ region }: { region: CCWatchRegion }) {
  return (
    <div className="jb-watch-row">
      <span className="jb-watch-star" aria-hidden="true">{region.isActive ? '★' : '○'}</span>
      <div className="jb-watch-info">
        <strong>{region.name}</strong>
        <small>{region.statusLabel}</small>
      </div>
      {region.isAvailable && region.href
        ? <Link href={region.href} className="jb-watch-btn">View</Link>
        : <span className="jb-watch-btn-na">Pending</span>
      }
    </div>
  )
}

function ChangeNoteRow({ note }: { note: CCChangeNote }) {
  const dirClass = note.direction === 'up'
    ? 'jb-dir-up'
    : note.direction === 'down'
      ? 'jb-dir-down'
      : 'jb-dir-neutral'
  const dirIcon = note.direction === 'up' ? '↑' : note.direction === 'down' ? '↓' : '●'
  return (
    <div className="jb-change">
      <span className={`jb-change-dir ${dirClass}`} aria-hidden="true">{dirIcon}</span>
      <div className="jb-change-body">
        <strong>{note.market}</strong>
        <small>{note.title}</small>
        <time>{note.timeAgo}</time>
        {note.reviewState === 'pending' && (
          <span className="jb-source-pending">Source pending review</span>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function JurisdictionBriefingPage({
  contract,
}: {
  contract: JurisdictionRouteContract
}) {
  const { route, briefing, evidence, confidence, watchRegions, changeNotes, ctas } = contract
  const flag = FLAG[route.countryIso2] ?? '🌐'
  const regionLabel = route.stateName ?? route.countryName
  const subLabel = route.stateName ? route.countryName : null

  return (
    <div className="jb-root">
      <style>{CSS}</style>

      {/* ── CC Header ────────────────────────────────────────────── */}
      <header className="jb-header">
        <Link href="/dashboard" className="jb-wordmark" aria-label="Harbourview Command Centre">
          HARBOURVIEW
        </Link>
        <nav className="jb-breadcrumb" aria-label="Jurisdiction breadcrumb">
          <Link href="/dashboard" className="jb-bc-link">Command Centre</Link>
          <span className="jb-bc-sep" aria-hidden="true">›</span>
          {route.parentCountryHref && (
            <>
              <Link href={route.parentCountryHref} className="jb-bc-link">{route.countryName}</Link>
              <span className="jb-bc-sep" aria-hidden="true">›</span>
            </>
          )}
          <span className="jb-bc-current">
            {regionLabel}{route.roleName ? ` · ${route.roleName}` : ''}
          </span>
        </nav>
      </header>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="jb-main">

        {/* Hero */}
        <section className="jb-hero">
          <span className="jb-flag" aria-hidden="true">{flag}</span>
          <div className="jb-hero-text">
            <h1 className="jb-hero-name">{regionLabel}</h1>
            {subLabel && <p className="jb-hero-parent">{subLabel}</p>}
            {route.roleName && (
              <span className="jb-hero-role">{route.roleName}</span>
            )}
          </div>
        </section>

        {/* Evidence strip — all fields from contract or explicit pending */}
        <section className="jb-strip" aria-label="Data evidence and coverage">
          {([
            { label: 'Data Sources',   value: evidence.dataSourceSummary },
            { label: 'Verification',   value: evidence.verificationSummary },
            { label: 'Update Cadence', value: evidence.updateCadence },
            { label: 'Coverage',       value: evidence.coverageSummary },
          ] as { label: string; value: string | null }[]).map(col => (
            <div key={col.label} className="jb-strip-col">
              <small className="jb-strip-label">{col.label}</small>
              {col.value
                ? <p className="jb-strip-val">{col.value}</p>
                : <PendingBadge label="Pending review" />
              }
            </div>
          ))}
        </section>

        {/* Two-col grid — stacks to single column at ≤767px */}
        <div className="jb-grid">

          {/* Left — Jurisdiction brief */}
          <section className="jb-left">
            <h2 className="jb-sec-head">Jurisdiction Brief</h2>

            {briefing.publicSummary
              ? <p className="jb-summary">{briefing.publicSummary}</p>
              : <p className="jb-summary-na"><PendingBadge label="Summary pending review" /></p>
            }

            <div className="jb-status-fields">
              <StatusField label="Program Status"    value={briefing.programStatus}    reviewState={briefing.programStatusReviewState} icon="◎" />
              <StatusField label="Patient Access"    value={briefing.patientAccess}    reviewState={briefing.programStatusReviewState} icon="↑" />
              <StatusField label="Physician Access"  value={briefing.physicianAccess}  reviewState={briefing.programStatusReviewState} icon="◐" />
              <StatusField label="Market Dynamics"   value={briefing.marketDynamics}   reviewState={briefing.programStatusReviewState} icon="⊛" />
              <StatusField label="Regulatory Outlook" value={briefing.regulatoryOutlook} reviewState={briefing.programStatusReviewState} icon="⊙" />
            </div>

            {ctas.fullProfileAvailable && ctas.fullProfileHref
              ? <Link href={ctas.fullProfileHref} className="jb-cta-btn">View Full Jurisdiction Profile →</Link>
              : <p className="jb-cta-na">Full profile pending review</p>
            }
          </section>

          {/* Right — Confidence, watch regions, change notes */}
          <aside className="jb-right">

            {/* Evidence confidence */}
            <section className="jb-card">
              <h3 className="jb-card-head">
                Evidence Confidence
                <span className="jb-info" title="Weighted scoring across source authority, jurisdiction relevance, recency, and consistency." aria-label="About confidence scoring">ⓘ</span>
              </h3>

              {confidence.reviewState === 'pending' ? (
                <div className="jb-conf-pending">
                  <PendingBadge label="Confidence pending review" />
                  <p className="jb-conf-note">Confidence scoring for this jurisdiction has not yet been reviewed.</p>
                </div>
              ) : (
                <div className="jb-conf">
                  <div className="jb-donut-wrap">
                    <ConfidenceDonut pct={confidence.overall ?? 0} />
                    <div className="jb-donut-text">
                      <strong>{confidence.overall}%</strong>
                      <small>Overall<br />Confidence</small>
                    </div>
                  </div>
                  <div className="jb-bars">
                    {confidence.categories.map(cat => (
                      <div key={cat.label} className="jb-bar-row">
                        <span className="jb-bar-lbl">{cat.label}</span>
                        {cat.reviewState === 'pending'
                          ? <PendingBadge label="Pending" />
                          : <>
                              <div className="jb-bar-track">
                                <div className="jb-bar-fill" style={{ width: `${cat.pct ?? 0}%` }} />
                              </div>
                              <span className="jb-bar-pct">{cat.pct}%</span>
                            </>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ctas.confidenceMethodologyAvailable && ctas.confidenceMethodologyHref
                ? <Link href={ctas.confidenceMethodologyHref} className="jb-link">Confidence methodology →</Link>
                : <span className="jb-link-na">Confidence methodology pending</span>
              }
            </section>

            {/* Watch regions */}
            <section className="jb-card">
              <h3 className="jb-card-head">Watch Regions</h3>

              {watchRegions.isDefaultSuggested && (
                <p className="jb-watch-label">Suggested regions</p>
              )}

              {watchRegions.regions.length > 0
                ? <div className="jb-watch-list">{watchRegions.regions.map(r => <WatchRegionRow key={r.name} region={r} />)}</div>
                : <PendingBadge label="Watch regions pending review" />
              }

              {watchRegions.reviewState === 'pending' && watchRegions.regions.length <= 1 && (
                <PendingBadge label="Additional regions pending review" />
              )}

              <Link href={ctas.allJurisdictionsHref} className="jb-link">View all jurisdictions →</Link>
            </section>

            {/* Recent change notes */}
            <section className="jb-card">
              <h3 className="jb-card-head">Recent Change Notes</h3>

              {changeNotes.reviewState === 'pending' || changeNotes.notes.length === 0
                ? <PendingBadge label="Change activity pending review" />
                : <div className="jb-changes">{changeNotes.notes.map((n, i) => <ChangeNoteRow key={i} note={n} />)}</div>
              }

              {ctas.changeActivityAvailable && ctas.changeActivityHref
                ? <Link href={ctas.changeActivityHref} className="jb-link">View all change activity →</Link>
                : <span className="jb-link-na">Change activity pending review</span>
              }
            </section>

          </aside>
        </div>
      </main>
    </div>
  )
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
:root{--gold:#d4a84b;--bg:#020814;--bdr:rgba(255,255,255,.08);--dim:rgba(255,255,255,.55);}
*,*::before,*::after{box-sizing:border-box;}
.jb-root{display:flex;flex-direction:column;min-height:100vh;background:var(--bg);color:#fff;font-family:inherit;overflow-x:hidden;}

/* Header */
.jb-header{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--bdr);background:rgba(2,8,20,.96);backdrop-filter:blur(12px);}
.jb-wordmark{font-size:12px;font-weight:700;letter-spacing:.22em;color:var(--gold);text-decoration:none;white-space:nowrap;flex-shrink:0;}
.jb-breadcrumb{display:flex;align-items:center;gap:5px;flex-wrap:wrap;font-size:11px;color:var(--dim);min-width:0;}
.jb-bc-link{color:var(--dim);text-decoration:none;}.jb-bc-link:hover{color:#fff;}
.jb-bc-sep{color:var(--dim);}
.jb-bc-current{color:#fff;font-weight:600;overflow-wrap:anywhere;}

/* Main */
.jb-main{flex:1;padding:16px;max-width:1200px;width:100%;margin:0 auto;}

/* Hero */
.jb-hero{display:flex;align-items:center;gap:12px;padding:18px 0 14px;border-bottom:1px solid var(--bdr);margin-bottom:16px;flex-wrap:wrap;}
.jb-flag{font-size:34px;line-height:1;flex-shrink:0;}
.jb-hero-text{min-width:0;}
.jb-hero-name{font-size:22px;font-weight:700;margin:0 0 2px;overflow-wrap:break-word;}
.jb-hero-parent{font-size:12px;color:var(--dim);margin:2px 0 0;}
.jb-hero-role{display:inline-block;margin-top:5px;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--gold);color:var(--gold);border-radius:3px;padding:2px 7px;}

/* Evidence strip */
.jb-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:10px;padding:12px 14px;background:rgba(255,255,255,.02);border:1px solid var(--bdr);border-radius:4px;margin-bottom:18px;}
.jb-strip-col{display:flex;flex-direction:column;gap:3px;min-width:0;}
.jb-strip-label{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);}
.jb-strip-val{font-size:11px;color:rgba(255,255,255,.75);margin:0;overflow-wrap:break-word;}

/* Grid — two cols on desktop, one on mobile */
.jb-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;align-items:start;}

/* Section heads */
.jb-sec-head,.jb-card-head{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;gap:6px;}
.jb-info{cursor:help;color:var(--dim);font-size:12px;}

/* Left */
.jb-left{display:flex;flex-direction:column;gap:14px;min-width:0;}
.jb-summary{font-size:13px;line-height:1.6;color:rgba(255,255,255,.82);margin:0;overflow-wrap:break-word;}
.jb-summary-na{margin:0;}

/* Status fields */
.jb-status-fields{display:flex;flex-direction:column;gap:8px;}
.jb-status-field{display:flex;align-items:flex-start;gap:9px;padding:9px 11px;background:rgba(255,255,255,.02);border:1px solid var(--bdr);border-radius:4px;}
.jb-status-icon{font-size:14px;flex-shrink:0;margin-top:2px;color:var(--gold);}
.jb-status-body{display:flex;flex-direction:column;gap:2px;min-width:0;}
.jb-status-body small{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--dim);}
.jb-status-body strong{font-size:12px;font-weight:600;overflow-wrap:break-word;}
.jb-unavailable{font-size:11px;color:var(--dim);font-style:italic;}

/* CTAs */
.jb-cta-btn{display:inline-block;padding:9px 16px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);border:1px solid var(--gold);border-radius:3px;text-decoration:none;transition:background .15s;width:fit-content;}
.jb-cta-btn:hover{background:rgba(212,168,75,.08);}
.jb-cta-na{font-size:10px;color:var(--dim);font-style:italic;padding:8px 0;margin:0;}

/* Right / cards */
.jb-right{display:flex;flex-direction:column;gap:14px;min-width:0;}
.jb-card{background:rgba(255,255,255,.02);border:1px solid var(--bdr);border-radius:4px;padding:12px;display:flex;flex-direction:column;gap:10px;}

/* Confidence */
.jb-conf{display:flex;gap:12px;align-items:flex-start;}
.jb-donut-wrap{position:relative;width:68px;height:68px;flex-shrink:0;}
.jb-donut{width:68px;height:68px;}
.jb-donut-text{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
.jb-donut-text strong{font-size:13px;font-weight:700;color:var(--gold);}
.jb-donut-text small{font-size:8px;color:var(--dim);line-height:1.3;}
.jb-bars{flex:1;display:flex;flex-direction:column;gap:5px;min-width:0;}
.jb-bar-row{display:flex;align-items:center;gap:5px;}
.jb-bar-lbl{font-size:9px;color:var(--dim);min-width:72px;flex-shrink:0;}
.jb-bar-track{flex:1;height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden;min-width:0;}
.jb-bar-fill{height:100%;background:var(--gold);border-radius:2px;}
.jb-bar-pct{font-size:9px;color:var(--dim);min-width:22px;text-align:right;}
.jb-conf-pending{display:flex;flex-direction:column;gap:6px;}
.jb-conf-note{font-size:11px;color:var(--dim);margin:0;}

/* Watch regions */
.jb-watch-list{display:flex;flex-direction:column;gap:6px;}
.jb-watch-label{font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:.1em;margin:0;}
.jb-watch-row{display:flex;align-items:center;gap:7px;padding:7px;background:rgba(255,255,255,.02);border-radius:3px;}
.jb-watch-star{font-size:12px;color:var(--gold);flex-shrink:0;}
.jb-watch-info{flex:1;display:flex;flex-direction:column;gap:1px;min-width:0;}
.jb-watch-info strong{font-size:11px;font-weight:600;overflow-wrap:break-word;}
.jb-watch-info small{font-size:9px;color:var(--dim);}
.jb-watch-btn{font-size:9px;padding:2px 7px;border:1px solid var(--bdr);color:rgba(255,255,255,.55);border-radius:2px;text-decoration:none;flex-shrink:0;}
.jb-watch-btn:hover{border-color:var(--gold);color:var(--gold);}
.jb-watch-btn-na{font-size:9px;padding:2px 7px;color:var(--dim);flex-shrink:0;font-style:italic;}

/* Change notes */
.jb-changes{display:flex;flex-direction:column;gap:7px;}
.jb-change{display:flex;gap:7px;align-items:flex-start;}
.jb-change-dir{width:17px;height:17px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;margin-top:2px;}
.jb-dir-up{background:rgba(74,222,128,.12);color:#4ade80;}
.jb-dir-down{background:rgba(248,113,113,.12);color:#f87171;}
.jb-dir-neutral{background:rgba(255,255,255,.05);color:var(--dim);}
.jb-change-body{display:flex;flex-direction:column;gap:2px;min-width:0;}
.jb-change-body strong{font-size:11px;font-weight:600;overflow-wrap:break-word;}
.jb-change-body small{font-size:10px;color:var(--dim);overflow-wrap:break-word;}
.jb-change-body time{font-size:9px;color:var(--dim);}
.jb-source-pending{font-size:9px;color:var(--dim);font-style:italic;}

/* Links */
.jb-link{font-size:10px;color:var(--gold);text-decoration:none;font-weight:600;letter-spacing:.05em;}
.jb-link:hover{text-decoration:underline;}
.jb-link-na{font-size:10px;color:var(--dim);font-style:italic;}

/* Pending badge */
.jb-pending-badge{display:inline-block;font-size:9px;padding:2px 7px;border:1px solid rgba(255,255,255,.15);color:var(--dim);border-radius:3px;font-style:italic;}

/* ── Mobile responsive (360–430px) ──────────────────────────────────────────── */
@media(max-width:767px){
  .jb-main{padding:10px;}
  .jb-hero{padding:12px 0 10px;}
  .jb-flag{font-size:26px;}
  .jb-hero-name{font-size:17px;}
  .jb-strip{grid-template-columns:1fr 1fr;padding:10px;}
  .jb-grid{grid-template-columns:1fr;}
  .jb-card{padding:10px;}
  .jb-bar-lbl{min-width:60px;font-size:8px;}
}
@media(max-width:390px){
  .jb-header{padding:8px 10px;}
  .jb-wordmark{font-size:10px;}
  .jb-main{padding:8px;}
  .jb-strip{grid-template-columns:1fr;}
  .jb-hero-name{font-size:15px;}
}
`
