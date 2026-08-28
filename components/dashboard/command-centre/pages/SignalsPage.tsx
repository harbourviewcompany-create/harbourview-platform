'use client'
import React, { useMemo, useState } from 'react'
import type { WatchlistData } from '@/lib/dashboard/dashboardLiveData'
import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { CommandPage } from '../types'
import { deriveSignalGroup, derivePolicyArea, deriveImpact, CustomSelect, type SignalGroup } from '../sharedHelpers'
import SignalSemanticSearch from '@/components/dashboard/SignalSemanticSearch'
import { DesktopDecisionIntelBridge } from '@/components/dashboard/DesktopDecisionIntelBridge'
import type { FeatureAccess } from '@/lib/billing/entitlements'
import { flagEmoji } from '@/lib/utils/flagEmoji'

const SIG_GROUP_ICONS: Record<SignalGroup, string> = {
  'REGULATORY': '◎',
  'MARKET ACCESS': '⊞',
  'SUPPLY CHAIN': '⬡',
  'TESTING & COMPLIANCE': '⬟',
  'EXPORT / BUYER MOVEMENT': '◈',
  'EVIDENCE UPDATES': '⊟',
}
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
  const [filterImpact, setFilterImpact] = useState('all')
  const [filterConf, setFilterConf] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [signalsTab, setSignalsTab] = useState<'feed' | 'search' | 'dossiers'>(initialShowSearch ? 'search' : 'feed')
  const [selectedSignal, setSelectedSignal] = useState<DashboardSignal | null>(null)

  const dossierSignals = useMemo(() => {
    const byId = new Map<string, DashboardSignal>()
    for (const signal of [...signals, ...(digestSignals ?? [])]) {
      const key = `${signal.id}:${(signal as any).decisionIntelEventId ?? ''}`
      if (!byId.has(key)) byId.set(key, signal)
    }
    return [...byId.values()].filter(s => Boolean((s as any).decisionIntelEventId))
  }, [signals, digestSignals])

  const filtered = useMemo(() => {
    let list = signals
    if (filterType !== 'all') list = list.filter(s => deriveSignalGroup(s.title) === filterType)
    if (filterImpact !== 'all') list = list.filter(s => deriveImpact(s.confidence) === filterImpact)
    if (filterConf === 'high') list = list.filter(s => s.confidence >= 75)
    else if (filterConf === 'mid') list = list.filter(s => s.confidence >= 50 && s.confidence < 75)
    else if (filterConf === 'low') list = list.filter(s => s.confidence < 50)
    return list
  }, [signals, filterType, filterImpact, filterConf])

  const grouped = useMemo(() => {
    const g: Partial<Record<SignalGroup, DashboardSignal[]>> = {}
    for (const s of filtered) {
      const grp = deriveSignalGroup(s.title)
      ;(g[grp] ??= []).push(s)
    }
    return g
  }, [filtered])

  const activeGroups = SIG_GROUP_ORDER.filter(g => (grouped[g]?.length ?? 0) > 0)

  return (
    <div className="cc-signals">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Signals</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}{region ? ` · ${region}` : ''}{role ? ` · ${role}` : ''}</p>
      </div>

      {decisionIntelAccess?.entitled && (
        <DesktopDecisionIntelBridge signals={signals} digestSignals={digestSignals} />
      )}

      <div className="cc-signals-tabs">
        <button type="button" className={signalsTab === 'feed' ? 'cc-tab-on' : 'cc-tab'} onClick={() => setSignalsTab('feed')}>Feed</button>
        <button type="button" className={signalsTab === 'search' ? 'cc-tab-on' : 'cc-tab'} onClick={() => setSignalsTab('search')}>Semantic search</button>
        <button type="button" className={signalsTab === 'dossiers' ? 'cc-tab-on' : 'cc-tab'} onClick={() => setSignalsTab('dossiers')}>
          Dossiers ({dossierSignals.length})
        </button>
      </div>

      {signalsTab === 'search' && <SignalSemanticSearch countryIso2={country.iso2} />}

      {signalsTab === 'feed' && (
        <>
          <div className="cc-signals-toolbar">
            <CustomSelect value={filterType} onChange={setFilterType} options={[{ value: 'all', label: 'All groups' }, ...SIG_GROUP_ORDER.map(g => ({ value: g, label: g }))]} />
            <CustomSelect value={filterImpact} onChange={setFilterImpact} options={[{ value: 'all', label: 'All impact' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} />
            <CustomSelect value={filterConf} onChange={setFilterConf} options={[{ value: 'all', label: 'All confidence' }, { value: 'high', label: '≥75' }, { value: 'mid', label: '50–74' }, { value: 'low', label: '<50' }]} />
          </div>
          <div className="cc-signal-feed">
            {activeGroups.map(grp => (
              <section key={grp} className="cc-signal-group">
                <div className="cc-group-head"><span>{SIG_GROUP_ICONS[grp]}</span> {grp}</div>
                {(grouped[grp] ?? []).slice(0, 8).map(s => (
                  <button key={s.id} type="button" className="cc-signal-card" onClick={() => setSelectedSignal(s)}>
                    <div className="cc-signal-title">{s.title}</div>
                    <div className="cc-signal-meta">{s.market} · {derivePolicyArea(s.title)} · {deriveImpact(s.confidence)} · {s.timeAgo}</div>
                  </button>
                ))}
              </section>
            ))}
            {filtered.length === 0 && <div className="cc-muted">No signals match filters.</div>}
          </div>
        </>
      )}

      {signalsTab === 'dossiers' && (
        <div className="cc-signal-feed">
          {dossierSignals.slice(0, 20).map(s => (
            <div key={s.id} className="cc-signal-card">
              <div className="cc-signal-title">{s.title}</div>
              <div className="cc-signal-meta">Decision intel · {s.market} · {s.timeAgo}</div>
            </div>
          ))}
          {dossierSignals.length === 0 && <div className="cc-muted">No dossier signals.</div>}
        </div>
      )}

      {selectedSignal && (
        <div className="cc-signal-detail" role="dialog">
          <div className="cc-card-head">{selectedSignal.title}</div>
          <p>{selectedSignal.summary ?? selectedSignal.title}</p>
          <div className="cc-signal-meta">{selectedSignal.market} · conf {selectedSignal.confidence} · {selectedSignal.timeAgo}</div>
          <button type="button" className="cc-btn-ghost" onClick={() => setSelectedSignal(null)}>Close</button>
        </div>
      )}
    </div>
  )
})
