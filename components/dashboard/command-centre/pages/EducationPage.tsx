'use client'
import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import type { LiveEduTile, RecentEduModule, PathwayData, EducationTrack, CountryEducationOverlay } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { CommandPage } from '../types'
import { getModuleContent } from '@/lib/dashboard/educationModuleContent'
import { flagEmoji } from '@/lib/utils/flagEmoji'

// ── Education helpers ──────────────────────────────────────────────────────────

type LearningModule = {
  num: number; icon: string; title: string; desc: string
  level: 'REQUIRED'|'RECOMMENDED'|'OPTIONAL'; progress: number; minutes: number
}

function buildLearningPath(eduCats: { icon: string; title: string; desc: string }[]): LearningModule[] {
  const defaults: LearningModule[] = [
    { num:1, icon:'◎', title:'Licence & Regulatory Foundations', desc:'Understand the regulatory framework, licensing requirements, and your ongoing obligations.',                         level:'REQUIRED',    progress:0, minutes:35 },
    { num:2, icon:'⬡', title:'Production Readiness',              desc:'Build compliant operational practices, facility standards, and operational controls.',                               level:'REQUIRED',    progress:0, minutes:45 },
    { num:3, icon:'⬟', title:'Testing, COA & Compliance',         desc:'Navigate testing requirements, COAs, batch release, and quality assurance.',                                        level:'REQUIRED',    progress:0, minutes:40 },
    { num:4, icon:'◈', title:'Buyer & Export Readiness',           desc:'Meet buyer expectations, understand export fundamentals, and documentation for international markets.',            level:'RECOMMENDED', progress:0, minutes:50 },
    { num:5, icon:'⊟', title:'Evidence & Documentation',           desc:'Master recordkeeping, evidence management, and audit readiness for regulators and buyers.',                        level:'OPTIONAL',    progress:0, minutes:30 },
  ]
  return defaults.map((m, i) => {
    const cat = eduCats[i]
    if (!cat) return m
    return { ...m, icon: cat.icon || m.icon, title: cat.title || m.title, desc: cat.desc || m.desc }
  })
}

const PATHWAY_STEPS = [
  { num:1, label:'Foundations',  unlocked:true  },
  { num:2, label:'Compliance',   unlocked:true  },
  { num:3, label:'Application',  unlocked:false },
  { num:4, label:'Approval',     unlocked:false },
  { num:5, label:'Market Access',unlocked:false },
]

// ── EducationPage ──────────────────────────────────────────────────────────────

export const EducationPage = React.memo(function EducationPage({
  country, region, role, eduCategories, liveTiles, recentEduModules, signals, pathwayData, educationTracks = [], countryEducationOverlays, onPageChange,
}: {
  country:           { iso2: string; label: string }
  region:            string
  role:              string
  eduCategories:     { icon: string; title: string; desc: string }[]
  liveTiles?:        LiveEduTile[]
  recentEduModules?: RecentEduModule[]
  signals:           DashboardSignal[]
  pathwayData?:      PathwayData
  educationTracks?:  EducationTrack[]
  countryEducationOverlays?: CountryEducationOverlay[]
  onPageChange?:     (page: CommandPage) => void
}) {
  const [activeModule, setActiveModule] = useState<number | null>(null)
  const modules = useMemo(() => buildLearningPath(eduCategories), [eduCategories])
  const moduleContent = useMemo(
    () => new Map(modules.map(m => [m.num, getModuleContent(m.title, countryEducationOverlays)])),
    [modules, countryEducationOverlays],
  )

  return (
    <div className="cc-education">
      <div className="cc-edu-main">
        <div className="cc-page-header">
          <h1 className="cc-page-title">Education</h1>
          <p className="cc-page-sub">
            {flagEmoji(country.iso2)} {country.label}
            {region ? ` · ${region}` : ''}
            {role ? ` · ${role}` : ''}
          </p>
        </div>

        <div className="cc-edu-pathway">
          {(pathwayData?.steps?.length ? pathwayData.steps.map((s, i) => ({
            num: i + 1,
            label: s.label ?? s.title ?? `Step ${i + 1}`,
            unlocked: s.unlocked ?? i < 2,
          })) : PATHWAY_STEPS).map((s, i, arr) => (
            <React.Fragment key={s.num}>
              <span className={s.unlocked ? 'cc-step-on' : 'cc-step-off'}>
                {s.num}. {s.label}
              </span>
              {i < arr.length - 1 && <span className="cc-step-arrow">→</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="cc-edu-grid">
          {modules.map(m => (
            <button
              key={m.num}
              type="button"
              className={`cc-edu-card${activeModule === m.num ? ' active' : ''}`}
              onClick={() => setActiveModule(activeModule === m.num ? null : m.num)}
            >
              <div className="cc-edu-icon">{m.icon}</div>
              <div className="cc-edu-title">{m.title}</div>
              <div className="cc-edu-desc">{m.desc}</div>
              <div className="cc-edu-meta">
                <span className="cc-edu-level">{m.level}</span>
                <span className="cc-edu-mins">{m.minutes} min</span>
              </div>
            </button>
          ))}
        </div>

        {activeModule != null && moduleContent.get(activeModule) && (
          <section className="cc-edu-detail">
            <div className="cc-card-head">MODULE DETAIL</div>
            <div className="cc-edu-body">{moduleContent.get(activeModule)}</div>
          </section>
        )}

        {educationTracks && educationTracks.length > 0 && (
          <section className="cc-edu-tracks">
            <div className="cc-card-head">TRACKS</div>
            <ul>
              {educationTracks.slice(0, 6).map((t, i) => (
                <li key={i}>{t.title ?? t.name ?? t.slug}</li>
              ))}
            </ul>
          </section>
        )}

        {recentEduModules && recentEduModules.length > 0 && (
          <section className="cc-edu-recent">
            <div className="cc-card-head">RECENT MODULES</div>
            <ul>
              {recentEduModules.slice(0, 5).map((m, i) => (
                <li key={i}>{m.title ?? m.slug}</li>
              ))}
            </ul>
          </section>
        )}

        {liveTiles && liveTiles.length > 0 && (
          <section className="cc-edu-tiles">
            <div className="cc-card-head">LIVE TILES</div>
            <div className="cc-tile-row">
              {liveTiles.slice(0, 6).map((t, i) => (
                <div key={i} className="cc-tile">{t.title ?? t.label}</div>
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="cc-edu-side">
        <div className="cc-right-section">
          <div className="cc-right-head">RELATED SIGNALS</div>
          <div className="cc-signal-list">
            {signals.slice(0, 5).map(s => (
              <button
                key={s.id}
                type="button"
                className="cc-signal-item"
                onClick={() => onPageChange?.('signals')}
              >
                <span className="cc-signal-title">{s.title}</span>
                <span className="cc-signal-meta">{s.market} · {s.timeAgo}</span>
              </button>
            ))}
            {signals.length === 0 && <div className="cc-muted">No related signals</div>}
          </div>
        </div>
        <div className="cc-right-section">
          <div className="cc-right-head">NEED HELP?</div>
          <div className="cc-need-help">
            <span>⬟</span>
            <div>
              <p>Book a session with a Harbourview Advisor.</p>
              <button className="cc-nba-btn" style={{marginTop:'8px'}}>Book now</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
})
