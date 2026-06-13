'use client'

import React from 'react'
import type { CountryIntelProfile, PipelineCounts, PathwayData } from '@/lib/dashboard/dashboardLiveData'

export interface AccessPathwayPageProps {
  country:      { iso2: string; label: string }
  region:       string
  role:         string
  countryIntel?: CountryIntelProfile | null
  pipeline?:    PipelineCounts
  pathwayData?: PathwayData | null
}

type Stage = { id: string; label: string; desc: string; status: 'complete' | 'active' | 'pending' }

function buildPathway(role: string, countryIntel?: CountryIntelProfile | null, pathwayData?: PathwayData | null): Stage[] {
  const marketAccess = countryIntel?.market_access_status?.toLowerCase() ?? ''
  const isOpen = marketAccess.includes('open') || marketAccess.includes('active') || marketAccess.includes('regulated')

  // Derive stage statuses from live pathway progress if available
  // current_step is 1-indexed: steps < current_step are complete, current_step is active, rest pending
  const currentStep = pathwayData?.progress?.current_step ?? 3 // default: market intel active
  function stageStatus(stageNum: number): 'complete' | 'active' | 'pending' {
    if (stageNum < currentStep)  return 'complete'
    if (stageNum === currentStep) return 'active'
    return 'pending'
  }

  const base: Stage[] = [
    { id: 'profile',    label: 'Role Verification',       desc: 'Confirm professional credentials and operating region.',    status: stageStatus(1) },
    { id: 'nda',        label: 'Compliance NDA',           desc: 'Execute Harbourview platform access and NDA agreement.',    status: stageStatus(2) },
    { id: 'market',     label: 'Market Intelligence',      desc: 'Access jurisdiction brief, regulatory status, and signals.',status: stageStatus(3) },
    { id: 'intro',      label: 'Counterparty Introduction',desc: 'Matched introduction to verified counterparties.',          status: stageStatus(4) },
    { id: 'diligence',  label: 'Due Diligence Package',    desc: 'Request documentation, COA, permits, GMP certification.',   status: stageStatus(5) },
    { id: 'dealroom',   label: 'Deal Room',                desc: 'Secure channel for term sheets, LOIs, and transaction.',    status: stageStatus(6) },
  ]

  // Role-specific stage overrides
  if (role.toLowerCase().includes('import') || role.toLowerCase().includes('export')) {
    base[3].desc = 'Matched to verified export-ready suppliers or licensed importers.'
    base[4].desc = 'Import/export permits, phytosanitary certs, COAs, and compliance docs.'
  }
  if (role.toLowerCase().includes('invest')) {
    base[3].desc = 'Introduced to operators, licence holders, and market entry partners.'
    base[4].desc = 'Financial disclosures, cap tables, regulatory filings, and market data.'
  }
  if (!isOpen) {
    base[3].status = 'pending'
    base[3].desc += ' (Market access restrictions apply — review regulatory status first.)'
  }

  return base
}

function StageRow({ stage, idx }: { stage: Stage; idx: number }) {
  const iconMap = { complete: '✓', active: '◎', pending: '○' }
  const classMap = { complete: 'ap-stage--complete', active: 'ap-stage--active', pending: 'ap-stage--pending' }
  return (
    <div className={`ap-stage ${classMap[stage.status]}`} style={{ animationDelay: `${idx * 55}ms` }}>
      <div className="ap-stage-left">
        <div className={`ap-stage-icon ap-icon--${stage.status}`}>{iconMap[stage.status]}</div>
        {idx < 5 && <div className="ap-stage-line" />}
      </div>
      <div className="ap-stage-body">
        <div className="ap-stage-label">{stage.label}</div>
        <div className="ap-stage-desc">{stage.desc}</div>
      </div>
      {stage.status === 'active' && (
        <a href="/intake" className="ap-stage-cta">Continue →</a>
      )}
    </div>
  )
}

export const AccessPathwayPage = React.memo(function AccessPathwayPage({
  country, role, countryIntel, pipeline, pathwayData,
}: AccessPathwayPageProps) {
  const stages = buildPathway(role, countryIntel, pathwayData)
  const activeStage = stages.find(s => s.status === 'active')
  const completedCount = stages.filter(s => s.status === 'complete').length

  return (
    <div className="ap-root">
      <style>{CSS}</style>

      <div className="ap-header">
        <div>
          <h1 className="ap-heading">Access Pathway</h1>
          <p className="ap-sub">
            {country.label}
            {role ? ` · ${role}` : ''}
            {' · '}{completedCount} of {stages.length} stages complete
          </p>
        </div>
        <a href="/intake" className="ap-cta-gold">Request Introduction →</a>
      </div>

      <div className="ap-body">
        <div className="ap-left">
          <div className="ap-section-head">PATHWAY STAGES</div>
          <div className="ap-stages">
            {stages.map((s, i) => <StageRow key={s.id} stage={s} idx={i} />)}
          </div>
        </div>

        <div className="ap-right">
          {/* Progress */}
          <div className="ap-card">
            <div className="ap-section-head">PATHWAY PROGRESS</div>
            <div className="ap-progress-ring-wrap">
              <svg viewBox="0 0 80 80" className="ap-ring">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="32" fill="none" stroke="#d4a84b" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 32 * completedCount / stages.length} ${2 * Math.PI * 32}`}
                  strokeLinecap="round" transform="rotate(-90 40 40)"
                />
              </svg>
              <div className="ap-ring-centre">
                <strong>{Math.round(completedCount / stages.length * 100)}%</strong>
                <small>Complete</small>
              </div>
            </div>
            {activeStage && (
              <div className="ap-active-stage">
                <div className="ap-active-label">CURRENT STAGE</div>
                <div className="ap-active-name">{activeStage.label}</div>
              </div>
            )}
          </div>

          {/* Pipeline */}
          {pipeline && (
            <div className="ap-card">
              <div className="ap-section-head">YOUR PIPELINE</div>
              <div className="ap-pipe-list">
                {[
                  { label: 'Wanted Requests',   val: pipeline.wanted,       color: '#d4a84b' },
                  { label: 'Matched',           val: pipeline.matched,      color: '#5b9bd5' },
                  { label: 'In Proof Review',   val: pipeline.proof_review, color: '#9b72d0' },
                  { label: 'Active Inquiry',    val: pipeline.inquiry,      color: '#4caf82' },
                  { label: 'Deal Room',         val: pipeline.deal_room,    color: '#e6a533' },
                ].map(row => (
                  <div key={row.label} className="ap-pipe-row">
                    <span className="ap-pipe-label">{row.label}</span>
                    <span className="ap-pipe-val" style={{ color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="ap-card ap-card--gold">
            <div className="ap-cta-head">Ready to proceed?</div>
            <div className="ap-cta-body">
              Submit your access request and a Harbourview relationship manager will match you to
              verified counterparties in {country.label}.
            </div>
            <a href="/intake" className="ap-cta-gold">Start Introduction →</a>
          </div>
        </div>
      </div>
    </div>
  )
})

const CSS = `
.ap-root {
  display:flex;flex-direction:column;height:100%;overflow:hidden;
  animation:apIn .28s ease;
}
@keyframes apIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.ap-header {
  display:flex;align-items:flex-start;justify-content:space-between;
  padding:20px 24px 0;flex-shrink:0;gap:16px;
}
.ap-heading { font-family:'Georgia',serif;font-size:22px;font-weight:400;color:#f5f0e8; }
.ap-sub { font-size:11px;color:rgba(245,240,232,.42);margin-top:3px; }
.ap-cta-gold {
  display:inline-flex;align-items:center;
  padding:9px 18px;border-radius:8px;font-size:12px;font-weight:600;
  background:linear-gradient(135deg,#d4a84b,#b88c35);
  color:#0d1117;text-decoration:none;flex-shrink:0;
  transition:opacity .12s;
}
.ap-cta-gold:hover { opacity:.88; }

.ap-body {
  flex:1;overflow:hidden;display:grid;
  grid-template-columns:1fr 280px;gap:0;padding:20px 24px 0;
}

.ap-left { overflow-y:auto;padding-right:20px;border-right:1px solid rgba(255,255,255,.06); }
.ap-right { overflow-y:auto;padding-left:20px;display:flex;flex-direction:column;gap:14px; }

.ap-section-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(245,240,232,.3);margin-bottom:12px;
}

.ap-stages { display:flex;flex-direction:column;gap:0; }
.ap-stage {
  display:flex;align-items:flex-start;gap:0;
  animation:stageIn .35s ease both;
}
@keyframes stageIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }

.ap-stage-left { display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:36px; }
.ap-stage-icon {
  width:26px;height:26px;border-radius:50%;
  display:grid;place-items:center;font-size:11px;font-weight:700;flex-shrink:0;
  border:1.5px solid;
}
.ap-icon--complete { background:rgba(76,175,130,.15);border-color:#4caf82;color:#4caf82; }
.ap-icon--active   { background:rgba(212,168,75,.15);border-color:#d4a84b;color:#d4a84b; }
.ap-icon--pending  { background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.12);color:rgba(245,240,232,.25); }
.ap-stage-line {
  width:1.5px;height:28px;
  background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.04));
  margin:3px 0;
}

.ap-stage-body { flex:1;padding:0 12px 24px 10px;min-width:0; }
.ap-stage-label {
  font-size:13px;font-weight:600;color:#f5f0e8;line-height:1.3;
}
.ap-stage--pending .ap-stage-label { color:rgba(245,240,232,.4); }
.ap-stage-desc { font-size:11px;color:rgba(245,240,232,.4);line-height:1.5;margin-top:3px; }
.ap-stage-cta {
  font-size:10px;padding:5px 12px;border-radius:6px;
  background:rgba(212,168,75,.1);border:1px solid rgba(212,168,75,.3);
  color:#d4a84b;text-decoration:none;flex-shrink:0;margin-top:2px;
  display:inline-flex;transition:background .12s;
}
.ap-stage-cta:hover { background:rgba(212,168,75,.18); }

.ap-card {
  padding:16px;border-radius:10px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);
  display:flex;flex-direction:column;gap:12px;
}
.ap-card--gold { background:rgba(212,168,75,.04);border-color:rgba(212,168,75,.18); }

.ap-progress-ring-wrap { position:relative;width:80px;height:80px;margin:0 auto; }
.ap-ring { width:100%;height:100%; }
.ap-ring circle { transition:stroke-dasharray .7s ease; }
.ap-ring-centre {
  position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
}
.ap-ring-centre strong { font-size:17px;font-weight:700;color:#d4a84b;line-height:1; }
.ap-ring-centre small  { font-size:8px;color:rgba(245,240,232,.4); }

.ap-active-stage { text-align:center; }
.ap-active-label { font-family:'JetBrains Mono','Fira Mono',monospace;font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:rgba(245,240,232,.3);margin-bottom:3px; }
.ap-active-name  { font-size:12px;font-weight:600;color:#d4a84b; }

.ap-pipe-list { display:flex;flex-direction:column;gap:6px; }
.ap-pipe-row  { display:flex;align-items:center;justify-content:space-between; }
.ap-pipe-label{ font-size:11px;color:rgba(245,240,232,.45); }
.ap-pipe-val  { font-size:16px;font-weight:700;line-height:1; }

.ap-cta-head { font-size:12px;font-weight:600;color:#f5f0e8; }
.ap-cta-body { font-size:11px;color:rgba(245,240,232,.45);line-height:1.55; }
`
