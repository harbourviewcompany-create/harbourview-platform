import { MARKET_ECONOMICS, formatMarketPrice, isMarketPriceStale } from '@/data/harbourview/market-economics'

function confidenceLabel(value: 'high' | 'medium' | 'low') {
  return value === 'high' ? 'High confidence' : value === 'medium' ? 'Medium confidence' : 'Low confidence'
}

export function MarketEconomicsSnapshot() {
  return (
    <section aria-labelledby="market-economics-heading" style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(212,168,75,.72)', marginBottom: 7 }}>
            Commercial economics
          </div>
          <h2 id="market-economics-heading" style={{ margin: 0, fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 24 }}>
            Current price signals
          </h2>
          <p style={{ margin: '8px 0 0', maxWidth: 760, fontSize: 12, lineHeight: 1.65, color: 'rgba(245,240,232,.5)' }}>
            Reviewed upstream trade-value signals and downstream price comparators. Declared export values are directional benchmarks because shipment-level Incoterms and private distributor contracts are not public.
          </p>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(245,240,232,.32)', fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}>
          verified through 08 Oct 2026
        </span>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, background: 'rgba(255,255,255,.018)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,.025)' }}>
              {['Market', 'Upstream / wholesale signal', 'Downstream comparator', 'Import context', 'Freshness / confidence', 'Source'].map((label) => (
                <th key={label} scope="col" style={{ padding: '11px 13px', textAlign: 'left', fontSize: 9, letterSpacing: '.11em', textTransform: 'uppercase', color: 'rgba(245,240,232,.38)', fontWeight: 600 }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MARKET_ECONOMICS.map((market) => {
              const primary = market.upstreamPrice ?? market.downstreamPrice
              const stale = primary ? isMarketPriceStale(primary) : true
              const source = market.upstreamPrice ?? market.downstreamPrice
              return (
                <tr key={market.iso2} style={{ borderTop: '1px solid rgba(255,255,255,.055)' }}>
                  <td style={{ padding: '13px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{market.country}</div>
                    <div style={{ marginTop: 3, fontSize: 9, color: 'rgba(245,240,232,.3)', letterSpacing: '.12em' }}>{market.iso2}</div>
                  </td>
                  <td style={{ padding: '13px', verticalAlign: 'top', fontSize: 12 }}>
                    <strong style={{ color: market.upstreamPrice ? '#f5f0e8' : 'rgba(245,240,232,.28)' }}>{formatMarketPrice(market.upstreamPrice)}</strong>
                    {market.upstreamPrice ? <div style={{ marginTop: 5, maxWidth: 260, fontSize: 10, lineHeight: 1.45, color: 'rgba(245,240,232,.4)' }}>{market.upstreamPrice.basis}</div> : null}
                  </td>
                  <td style={{ padding: '13px', verticalAlign: 'top', fontSize: 12 }}>
                    <strong style={{ color: market.downstreamPrice ? '#f5f0e8' : 'rgba(245,240,232,.28)' }}>{formatMarketPrice(market.downstreamPrice)}</strong>
                    {market.downstreamPrice ? <div style={{ marginTop: 5, maxWidth: 250, fontSize: 10, lineHeight: 1.45, color: 'rgba(245,240,232,.4)' }}>{market.downstreamPrice.basis}</div> : null}
                  </td>
                  <td style={{ padding: '13px', verticalAlign: 'top', fontSize: 11, color: 'rgba(245,240,232,.58)' }}>
                    {market.importContext ? (
                      <>
                        <div>{market.importContext.totalKg.toLocaleString()} kg imported ({market.importContext.period})</div>
                        {market.importContext.canadianKg != null ? <div style={{ marginTop: 4, color: 'rgba(245,240,232,.38)' }}>{market.importContext.canadianKg.toLocaleString()} kg from Canada</div> : null}
                      </>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '13px', verticalAlign: 'top', fontSize: 10 }}>
                    {primary ? (
                      <>
                        <div style={{ color: stale ? '#d4a84b' : '#4caf82' }}>{stale ? 'Refresh due' : `As of ${primary.asOf}`}</div>
                        <div style={{ marginTop: 5, color: 'rgba(245,240,232,.35)' }}>{confidenceLabel(primary.confidence)}</div>
                      </>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '13px', verticalAlign: 'top', fontSize: 10 }}>
                    {source ? <span style={{ color: 'rgba(245,240,232,.62)' }}>{source.sourceLabel}</span> : '—'}
                    {market.note ? <div style={{ marginTop: 6, maxWidth: 280, lineHeight: 1.45, color: 'rgba(245,240,232,.34)' }}>{market.note}</div> : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
