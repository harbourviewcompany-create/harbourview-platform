'use client'
import React, { useMemo, useState } from 'react'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import type { CannabisOperator } from '@/lib/dashboard/dashboardLiveData'

export const LicenceTrackerPage = React.memo(function LicenceTrackerPage({
  country, region, role, cannabisOperators = [], operatorLicenceMatrix, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  cannabisOperators?: CannabisOperator[]
  operatorLicenceMatrix?: { entitled?: boolean; byOperatorId?: Record<string, any[]> }
  onPageChange?: (page: CommandPage) => void
}) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    if (!q) return cannabisOperators
    const qq = q.toLowerCase()
    return cannabisOperators.filter(op =>
      String((op as any).name ?? (op as any).operator_name ?? '').toLowerCase().includes(qq)
    )
  }, [cannabisOperators, q])

  return (
    <div className="cc-licence">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Licence Tracker</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}</p>
      </div>
      <input className="cc-search" placeholder="Search operators…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cc-lic-list">
        {list.slice(0, 40).map((op, i) => {
          const id = String((op as any).id ?? i)
          const licences = operatorLicenceMatrix?.byOperatorId?.[id] ?? []
          return (
            <div key={id} className="cc-lic-row">
              <div className="cc-lic-name">{(op as any).name ?? (op as any).operator_name ?? 'Operator'}</div>
              <div className="cc-lic-meta">
                {(op as any).country ?? country.iso2}
                {operatorLicenceMatrix && !operatorLicenceMatrix.entitled
                  ? ' · upgrade for licence detail'
                  : licences.length
                    ? ` · ${licences.length} licence(s)`
                    : ''}
              </div>
            </div>
          )
        })}
        {list.length === 0 && <div className="cc-muted">No operators loaded.</div>}
      </div>
    </div>
  )
})
