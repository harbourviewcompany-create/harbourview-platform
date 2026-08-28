'use client'
import React, { useMemo, useState } from 'react'
import type { CommandPage } from '../types'
import type { PublicCultivarPassportDTO } from '@/lib/genetics/dto'
import { CultivarPassportModal } from '@/components/dashboard/CultivarPassportModal'
import { GeneticsRequestModal } from '../../GeneticsRequestModal'
import { GeneticsProgramModal } from '../../GeneticsProgramModal'
import { flagEmoji } from '@/lib/utils/flagEmoji'

export const GeneticsPage = React.memo(function GeneticsPage({
  country, region, role, cultivarPassports = [], onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  cultivarPassports?: PublicCultivarPassportDTO[]
  onPageChange?: (page: CommandPage) => void
}) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<PublicCultivarPassportDTO | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)
  const [programOpen, setProgramOpen] = useState(false)

  const list = useMemo(() => {
    if (!q) return cultivarPassports
    const qq = q.toLowerCase()
    return cultivarPassports.filter(p =>
      String((p as any).name ?? (p as any).cultivar_name ?? '').toLowerCase().includes(qq) ||
      String((p as any).breeder ?? '').toLowerCase().includes(qq)
    )
  }, [cultivarPassports, q])

  return (
    <div className="cc-genetics">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Genetics</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}{role ? ` · ${role}` : ''}</p>
      </div>
      <div className="cc-gen-actions">
        <button type="button" className="cc-tab" onClick={() => setRequestOpen(true)}>Request genetics</button>
        <button type="button" className="cc-tab" onClick={() => setProgramOpen(true)}>Program enquiry</button>
      </div>
      <input className="cc-search" placeholder="Search cultivars…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cc-gen-list">
        {list.slice(0, 40).map((p, i) => (
          <button key={(p as any).id ?? i} type="button" className="cc-gen-row" onClick={() => setSelected(p)}>
            <div className="cc-gen-title">{(p as any).name ?? (p as any).cultivar_name ?? 'Cultivar'}</div>
            <div className="cc-gen-meta">{(p as any).breeder ?? ''} · {(p as any).origin ?? country.iso2}</div>
          </button>
        ))}
        {list.length === 0 && <div className="cc-muted">No cultivar passports loaded.</div>}
      </div>
      {selected && (
        <CultivarPassportModal passport={selected} onClose={() => setSelected(null)} />
      )}
      <GeneticsRequestModal open={requestOpen} onClose={() => setRequestOpen(false)} />
      <GeneticsProgramModal open={programOpen} onClose={() => setProgramOpen(false)} />
    </div>
  )
})
