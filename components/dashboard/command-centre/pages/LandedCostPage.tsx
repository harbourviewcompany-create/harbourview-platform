'use client'
import React, { useMemo, useState } from 'react'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { EXPORTER_ORIGINS, DESTINATION_MARKETS, FREIGHT_CORRIDORS, LANDED_PRODUCT_LABELS, calcLandedCost } from '../../data/landedCostData'

export const LandedCostPage = React.memo(function LandedCostPage({
  country, region, role, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  onPageChange?: (page: CommandPage) => void
}) {
  const origins = EXPORTER_ORIGINS ?? []
  const dests = DESTINATION_MARKETS ?? []
  const [origin, setOrigin] = useState(String(origins[0]?.iso2 ?? country.iso2))
  const [dest, setDest] = useState(String(dests[0]?.iso2 ?? 'DE'))
  const [product, setProduct] = useState('flower')
  const [qty, setQty] = useState(10)

  const result = useMemo(() => {
    try {
      return calcLandedCost?.({ origin, destination: dest, productType: product as any, quantityKg: qty })
    } catch {
      return null
    }
  }, [origin, dest, product, qty])

  return (
    <div className="cc-landed">
      <div className="cc-page-header">
        <h1 className="cc-page-title">Landed Cost</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label}</p>
      </div>
      <div className="cc-landed-form">
        <label>Origin
          <select value={origin} onChange={e => setOrigin(e.target.value)}>
            {origins.map((o: any) => <option key={o.iso2} value={o.iso2}>{o.label ?? o.iso2}</option>)}
          </select>
        </label>
        <label>Destination
          <select value={dest} onChange={e => setDest(e.target.value)}>
            {dests.map((d: any) => <option key={d.iso2} value={d.iso2}>{d.label ?? d.iso2}</option>)}
          </select>
        </label>
        <label>Product
          <select value={product} onChange={e => setProduct(e.target.value)}>
            {Object.entries(LANDED_PRODUCT_LABELS ?? { flower: 'Flower', oil: 'Oil' }).map(([k, v]) => (
              <option key={k} value={k}>{v as string}</option>
            ))}
          </select>
        </label>
        <label>Qty (kg)
          <input type="number" value={qty} min={1} onChange={e => setQty(Number(e.target.value) || 1)} />
        </label>
      </div>
      {result && (
        <section className="cc-landed-result">
          <div className="cc-card-head">ESTIMATE</div>
          <pre className="cc-muted">{JSON.stringify(result, null, 2).slice(0, 1200)}</pre>
        </section>
      )}
      {!result && <div className="cc-muted">Select corridor inputs to estimate landed cost.</div>}
      <p className="cc-muted">{(FREIGHT_CORRIDORS ?? []).length} freight corridors in reference data.</p>
    </div>
  )
})
