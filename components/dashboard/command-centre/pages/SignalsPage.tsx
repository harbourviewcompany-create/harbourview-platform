'use client'
import React, { useMemo, useState } from 'react'
import type { WatchlistData } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { CommandPage } from '../types'
import { deriveSignalGroup, deriveImpact, CustomSelect, type SignalGroup } from '../sharedHelpers'
import SignalSemanticSearch from '@/components/dashboard/SignalSemanticSearch'
import { DesktopDecisionIntelBridge } from '@/components/dashboard/DesktopDecisionIntelBridge'
import type { FeatureAccess } from '@/lib/billing/entitlements'
import { flagEmoji } from '@/lib/utils/flagEmoji'

const SIG_GROUP_ORDER: SignalGroup[] = [
  'REGULATORY', 'MARKET ACCESS', 'SUPPLY CHAIN',
  'TESTING & COMPLIANCE', 'EXPORT / BUYER MOVEMENT', 'EVIDENCE UPDATES',
]

export const SignalsPage = React.memo(function SignalsPage({
  country, region, role, signals, digestSignals, watchlistData, onPageChange, initialShowSearch = false, decisionIntelAccess,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  signals: DashboardSignal[]
  digestSignals?: DashboardSignal[]
  watchlistData?: WatchlistData
  onPageChange?: (page: CommandPage) => void
  initialShowSearch?: boolean
  decisionIntelAccess?: FeatureAccess
}) {
  const [filterType, setFilterType] = useState('all')
  const [showSearch, setShowSearch] = useState(initialShowSearch)
  const filtered = useMemo(() => {
    let list = signals
    if (filterType !== 'all') list = list.filter(s => deriveSignalGroup(s.title) === filterType)
    return list
  }, [signals, filterType])

  return (
    <div className="cc-signals">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Signals</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}</p>
      </div>
      {decisionIntelAccess?.entitled && (
        <DesktopDecisionIntelBridge signals={signals} digestSignals={digestSignals} />
      )}
      <div className="cc-signals-toolbar">
        <CustomSelect
          value={filterType}
          onChange={setFilterType}
          options={[{ value: 'all', label: 'All groups' }, ...SIG_GROUP_ORDER.map(g => ({ value: g, label: g }))]}
        />
        <button type="button" className="cc-btn-ghost" onClick={() => setShowSearch(v => !v)}>
          {showSearch ? 'Hide search' : 'Semantic search'}
        </button>
      </div>
      {showSearch && <SignalSemanticSearch countryIso2={country.iso2} />}
      <div className="cc-signal-feed">
        {filtered.slice(0, 20).map(s => (
          <div key={s.id} className="cc-signal-card">
            <div className="cc-signal-title">{s.title}</div>
            <div className="cc-signal-meta">{s.market} · {s.timeAgo} · {deriveImpact(s.confidence)}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="cc-muted">No signals match filters.</div>}
      </div>
    </div>
  )
})
