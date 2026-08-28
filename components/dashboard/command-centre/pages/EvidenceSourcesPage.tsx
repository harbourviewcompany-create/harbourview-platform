'use client'
import React, { useMemo, useState } from 'react'
import type { EvidenceData, EvidenceSource, OrgEvidenceDoc, SourceCoverageRow, RegistryCoverageSummary } from '@/lib/dashboard/dashboardLiveData'
import type { CommandPage } from '../types'
import { CustomSelect, fmtStatus } from '../sharedHelpers'
import { flagEmoji } from '@/lib/utils/flagEmoji'

export const EvidenceSourcesPage = React.memo(function EvidenceSourcesPage({
  country, region, role, evidenceData, sourceCoverage, registryCoverageSummary, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  evidenceData?: EvidenceData
  sourceCoverage?: SourceCoverageRow[]
  registryCoverageSummary?: RegistryCoverageSummary
  onPageChange?: (page: CommandPage) => void
}) {
  const [tab, setTab] = useState<'sources' | 'org' | 'coverage'>('sources')
  const [q, setQ] = useState('')

  const sources = useMemo(() => {
    const list: any[] = (evidenceData as any)?.sources ?? (evidenceData as any)?.items ?? []
    if (!q) return list
    const qq = q.toLowerCase()
    return list.filter((s: any) => String(s.name ?? s.title ?? s.source).toLowerCase().includes(qq))
  }, [evidenceData, q])

  const orgDocs = (evidenceData as any)?.orgDocs ?? (evidenceData as any)?.org_docs ?? []

  return (
    <div className="cc-evidence">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Evidence & Sources</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}</p>
      </div>

      <div className="cc-ev-tabs">
        <button type="button" className={tab === 'sources' ? 'cc-tab-on' : 'cc-tab'} onClick={() => setTab('sources')}>Sources</button>
        <button type="button" className={tab === 'org' ? 'cc-tab-on' : 'cc-tab'} onClick={() => setTab('org')}>Org docs</button>
        <button type="button" className={tab === 'coverage' ? 'cc-tab-on' : 'cc-tab'} onClick={() => setTab('coverage')}>Coverage</button>
      </div>

      {tab === 'sources' && (
        <>
          <input className="cc-search" placeholder="Search sources…" value={q} onChange={e => setQ(e.target.value)} />
          <div className="cc-ev-list">
            {sources.slice(0, 40).map((s: any, i: number) => (
              <div key={s.id ?? i} className="cc-ev-row">
                <div className="cc-ev-title">{s.name ?? s.title ?? s.source}</div>
                <div className="cc-ev-meta">{s.type ?? s.category ?? ''} · {s.status ?? s.coverage ?? ''}</div>
              </div>
            ))}
            {sources.length === 0 && <div className="cc-muted">No sources loaded.</div>}
          </div>
        </>
      )}

      {tab === 'org' && (
        <div className="cc-ev-list">
          {orgDocs.slice(0, 30).map((d: any, i: number) => (
            <div key={d.id ?? i} className="cc-ev-row">
              <div className="cc-ev-title">{d.title ?? d.name ?? d.filename}</div>
              <div className="cc-ev-meta">{d.doc_type ?? d.type ?? ''}</div>
            </div>
          ))}
          {orgDocs.length === 0 && <div className="cc-muted">No organisation evidence docs.</div>}
        </div>
      )}

      {tab === 'coverage' && (
        <div className="cc-ev-coverage">
          {registryCoverageSummary && (
            <div className="cc-card">
              <div className="cc-card-head">REGISTRY</div>
              <pre className="cc-muted">{JSON.stringify(registryCoverageSummary, null, 2).slice(0, 800)}</pre>
            </div>
          )}
          <ul>
            {(sourceCoverage ?? []).slice(0, 20).map((r, i) => (
              <li key={i}>{(r as any).source_name ?? (r as any).name ?? (r as any).source} — {(r as any).coverage ?? (r as any).status ?? 'active'}</li>
            ))}
          </ul>
          {(sourceCoverage ?? []).length === 0 && !registryCoverageSummary && <div className="cc-muted">No coverage data.</div>}
        </div>
      )}
    </div>
  )
})
