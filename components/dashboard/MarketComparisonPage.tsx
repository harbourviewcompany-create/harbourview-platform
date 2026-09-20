'use client'

import { useEffect, useMemo, useState } from 'react'

type Market = {
  iso2: string
  name: string
  opportunityScore: number | null
  marketAccessStatus: string | null
  regulatoryTier: string | null
  signalsStatus: string | null
}

type Props = {
  initialCountryIso2: string
  countryOptions: { value: string; label: string }[]
}

function score(v: number | null) {
  return v == null ? '—' : String(Math.round(v))
}

export function MarketComparisonPage({ initialCountryIso2, countryOptions }: Props) {
  const [markets, setMarkets] = useState<Market[]>([])
  const [left, setLeft] = useState(initialCountryIso2)
  const [right, setRight] = useState(initialCountryIso2 === 'US' ? 'CA' : 'US')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/globe', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setMarkets((data.countries ?? []).map((c: any) => ({
          iso2: c.iso2,
          name: c.name,
          opportunityScore: c.opportunityScore ?? null,
          marketAccessStatus: c.marketAccessStatus ?? null,
          regulatoryTier: c.regulatoryTier ?? null,
          signalsStatus: c.signalsStatus ?? null,
        })))
      })
      .catch(() => { if (!cancelled) setMarkets([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const rows = useMemo(() => {
    const a = markets.find(m => m.iso2 === left)
    const b = markets.find(m => m.iso2 === right)
    return [
      ['Market access', a?.marketAccessStatus ?? '—', b?.marketAccessStatus ?? '—'],
      ['Opportunity', score(a?.opportunityScore ?? null), score(b?.opportunityScore ?? null)],
      ['Activity', a?.signalsStatus ?? '—', b?.signalsStatus ?? '—'],
      ['Regulatory tier', a?.regulatoryTier ?? '—', b?.regulatoryTier ?? '—'],
    ]
  }, [markets, left, right])

  const label = (iso: string) => countryOptions.find(c => c.value === iso)?.label ?? iso

  return (
    <div className="cc-page">
      <div className="cc-page-header">
        <div>
          <div className="cc-eyebrow">MARKET INTELLIGENCE</div>
          <h1 className="cc-page-title-large">Compare markets</h1>
          <p className="cc-page-subtitle">Compare the current Harbourview market context without changing the live globe.</p>
        </div>
      </div>

      <div className="cc-panel" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['A', left, setLeft], ['B', right, setRight]].map(([slot, value, setter]) => (
            <label key={String(slot)} style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 9, letterSpacing: '.16em', color: 'rgba(245,240,232,.42)', textTransform: 'uppercase' }}>Market {slot}</span>
              <select value={String(value)} onChange={e => (setter as (v: string) => void)(e.target.value)} style={{ minHeight: 42, borderRadius: 10, border: '1px solid rgba(212,168,75,.2)', background: '#06101A', color: '#F5F0E8', padding: '0 12px' }}>
                {countryOptions.filter(c => c.value !== 'GLOBAL').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
          ))}
        </div>

        <div style={{ marginTop: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', background: 'rgba(255,255,255,.025)', padding: '12px 14px', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(245,240,232,.45)' }}>
            <span>Dimension</span><span>{label(left)}</span><span>{label(right)}</span>
          </div>
          {loading ? <div style={{ padding: 18, color: 'rgba(245,240,232,.45)', fontSize: 12 }}>Loading current market data…</div> :
            rows.map(([name, a, b]) => (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '15px 14px', borderTop: '1px solid rgba(255,255,255,.06)', fontSize: 12 }}>
                <span style={{ color: 'rgba(245,240,232,.48)' }}>{name}</span><span>{a}</span><span>{b}</span>
              </div>
            ))}
        </div>

        {!loading && markets.length === 0 ? <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(245,240,232,.45)' }}>Live comparison data is temporarily unavailable. No values are inferred.</p> : null}
      </div>
    </div>
  )
}
