'use client'
import React, { useMemo, useState } from 'react'
import type { OrgEvidenceDoc } from '@/lib/dashboard/dashboardLiveData'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'

export const DocumentsPage = React.memo(function DocumentsPage({
  country, region, role, evidenceData, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  evidenceData?: { orgDocs?: OrgEvidenceDoc[]; org_docs?: OrgEvidenceDoc[] }
  onPageChange?: (page: CommandPage) => void
}) {
  const [q, setQ] = useState('')
  const docs = useMemo(() => {
    const list = evidenceData?.orgDocs ?? evidenceData?.org_docs ?? []
    if (!q) return list
    const qq = q.toLowerCase()
    return list.filter((d: any) => String(d.title ?? d.name ?? d.filename ?? '').toLowerCase().includes(qq))
  }, [evidenceData, q])

  return (
    <div className="cc-documents">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Documents</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}</p>
      </div>
      <input className="cc-search" placeholder="Search documents…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cc-doc-list">
        {docs.slice(0, 50).map((d: any, i: number) => (
          <div key={d.id ?? i} className="cc-doc-row">
            <div className="cc-doc-title">{d.title ?? d.name ?? d.filename ?? 'Document'}</div>
            <div className="cc-doc-meta">{d.doc_type ?? d.type ?? ''} · {d.status ?? ''}</div>
          </div>
        ))}
        {docs.length === 0 && <div className="cc-muted">No organisation documents loaded.</div>}
      </div>
      <button type="button" className="cc-nba-btn" onClick={() => onPageChange?.('evidence')}>Open Evidence & Sources →</button>
    </div>
  )
})
