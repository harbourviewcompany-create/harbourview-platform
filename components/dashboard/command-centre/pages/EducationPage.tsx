'use client'
import React, { useMemo, useState } from 'react'
import type { LiveEduTile, RecentEduModule, PathwayData, EducationTrack } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { CommandPage } from '../types'
import { getModuleContent } from '@/lib/dashboard/educationModuleContent'
import { flagEmoji } from '@/lib/utils/flagEmoji'

const PATHWAY_STEPS = [
  { num:1, label:'Foundations', unlocked:true },
  { num:2, label:'Compliance', unlocked:true },
  { num:3, label:'Application', unlocked:false },
  { num:4, label:'Approval', unlocked:false },
  { num:5, label:'Market Access', unlocked:false },
]

export const EducationPage = React.memo(function EducationPage({
  country, region, role, eduCategories, liveTiles, recentEduModules, signals, pathwayData, educationTracks = [], onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  eduCategories: { icon: string; title: string; desc: string }[]
  liveTiles?: LiveEduTile[]
  recentEduModules?: RecentEduModule[]
  signals: DashboardSignal[]
  pathwayData?: PathwayData
  educationTracks?: EducationTrack[]
  onPageChange?: (page: CommandPage) => void
}) {
  const modules = useMemo(() => eduCategories.slice(0, 6).map((c, i) => ({
    ...c, num: i + 1, level: i < 3 ? 'REQUIRED' : 'RECOMMENDED',
  })), [eduCategories])

  return (
    <div className="cc-education">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Education</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''} · {role}</p>
      </div>
      <div className="cc-edu-pathway">
        {PATHWAY_STEPS.map((s, i) => (
          <span key={s.num} className={s.unlocked ? 'cc-step-on' : 'cc-step-off'}>
            {s.num}. {s.label}{i < PATHWAY_STEPS.length - 1 ? ' → ' : ''}
          </span>
        ))}
      </div>
      <div className="cc-edu-grid">
        {modules.map(m => (
          <div key={m.num} className="cc-edu-card">
            <div className="cc-edu-icon">{m.icon}</div>
            <div className="cc-edu-title">{m.title}</div>
            <div className="cc-edu-desc">{m.desc}</div>
            <div className="cc-edu-level">{m.level}</div>
          </div>
        ))}
      </div>
      {recentEduModules && recentEduModules.length > 0 && (
        <section className="cc-edu-recent">
          <h3>Recent modules</h3>
          <ul>{recentEduModules.slice(0, 5).map((m, i) => <li key={i}>{m.title ?? m.slug}</li>)}</ul>
        </section>
      )}
      {liveTiles && liveTiles.length > 0 && (
        <section className="cc-edu-tiles">
          <h3>Live tiles</h3>
          <div className="cc-tile-row">
            {liveTiles.slice(0, 4).map((t, i) => (
              <div key={i} className="cc-tile">{t.title ?? t.label}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
})
