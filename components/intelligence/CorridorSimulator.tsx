'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  TRADE_CORRIDORS,
  filterCorridors,
  PRODUCT_OPTIONS,
  COMPLIANCE_OPTIONS,
  type ProductClass,
  type ComplianceProfile,
} from '@/lib/intelligence/tradeCorridors'

const RISK_COLOR: Record<number, string> = {
  1: '#4caf82',
  2: '#5b9bd5',
  3: '#d4a84b',
  4: '#e07c3a',
  5: '#e05555',
}

export function CorridorSimulator() {
  const [product, setProduct] = useState<ProductClass | 'any'>('any')
  const [compliance, setCompliance] = useState<ComplianceProfile | 'any'>('any')
  const [from, setFrom] = useState<string>('any')
  const [to, setTo] = useState<string>('any')
  const [maxRisk, setMaxRisk] = useState<number>(5)

  const origins = useMemo(
    () => Array.from(new Set(TRADE_CORRIDORS.map((c) => c.from))).sort(),
    [],
  )
  const destinations = useMemo(
    () => Array.from(new Set(TRADE_CORRIDORS.map((c) => c.to))).sort(),
    [],
  )

  const matched = useMemo(
    () =>
      filterCorridors(TRADE_CORRIDORS, {
        product,
        compliance,
        from,
        to,
        maxRisk,
      }),
    [product, compliance, from, to, maxRisk],
  )

  return (
    <section className="cs-root">
      <div className="cs-hd">
        <h2 className="cs-title">Corridor simulator</h2>
        <p className="cs-sub">
          Filter tracked export–import corridors by product class, compliance path, endpoints, and
          friction score. Orientation-level only — not a guarantee of permit timing or route
          availability.
        </p>
      </div>

      <div className="cs-filters">
        <label className="cs-field">
          <span>Product</span>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value as ProductClass | 'any')}
          >
            {PRODUCT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="cs-field">
          <span>Compliance</span>
          <select
            value={compliance}
            onChange={(e) => setCompliance(e.target.value as ComplianceProfile | 'any')}
          >
            {COMPLIANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="cs-field">
          <span>Origin</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="any">Any origin</option>
            {origins.map((iso) => (
              <option key={iso} value={iso}>
                {iso}
              </option>
            ))}
          </select>
        </label>
        <label className="cs-field">
          <span>Destination</span>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="any">Any destination</option>
            {destinations.map((iso) => (
              <option key={iso} value={iso}>
                {iso}
              </option>
            ))}
          </select>
        </label>
        <label className="cs-field">
          <span>Max friction ({maxRisk})</span>
          <input
            type="range"
            min={1}
            max={5}
            value={maxRisk}
            onChange={(e) => setMaxRisk(Number(e.target.value))}
          />
        </label>
      </div>

      <p className="cs-count">
        {matched.length} of {TRADE_CORRIDORS.length} corridors match
      </p>

      {matched.length === 0 ? (
        <p className="cs-empty">No corridors match these filters. Broaden product or friction.</p>
      ) : (
        <div className="cs-grid">
          {matched.map((c) => (
            <article key={c.id} className="cs-card">
              <div className="cs-card-top">
                <h3>{c.label}</h3>
                <span
                  className="cs-risk"
                  style={{ color: RISK_COLOR[c.riskScore], borderColor: RISK_COLOR[c.riskScore] }}
                >
                  Friction {c.riskScore}/5
                </span>
              </div>
              <p className="cs-risk-label">{c.riskLabel}</p>
              <p className="cs-notes">{c.notes}</p>
              <div className="cs-tags">
                {c.productClasses.map((p) => (
                  <span key={p} className="cs-tag">
                    {p.replace(/_/g, ' ')}
                  </span>
                ))}
                {c.compliance.map((p) => (
                  <span key={p} className="cs-tag cs-tag--gold">
                    {p.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
              <Link href={`/intelligence/country/${c.to.toLowerCase()}`} className="cs-link">
                Destination market →
              </Link>
            </article>
          ))}
        </div>
      )}

      <style jsx>{`
        .cs-root {
          margin-bottom: 40px;
          padding: 22px;
          border-radius: 14px;
          border: 1px solid rgba(212, 168, 75, 0.18);
          background: linear-gradient(160deg, rgba(212, 168, 75, 0.06), rgba(255, 255, 255, 0.02));
        }
        .cs-title {
          font-family: Georgia, serif;
          font-size: 20px;
          font-weight: 400;
          color: #f5f0e8;
          margin: 0 0 8px;
        }
        .cs-sub {
          font-size: 13px;
          line-height: 1.65;
          color: rgba(245, 240, 232, 0.5);
          margin: 0 0 18px;
          max-width: 720px;
        }
        .cs-filters {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }
        .cs-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.4);
        }
        .cs-field select,
        .cs-field input[type='range'] {
          width: 100%;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f5f0e8;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 13px;
        }
        .cs-count {
          font-size: 12px;
          color: rgba(212, 168, 75, 0.8);
          margin: 0 0 14px;
        }
        .cs-empty {
          font-size: 13px;
          color: rgba(245, 240, 232, 0.45);
        }
        .cs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
        }
        .cs-card {
          padding: 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(0, 0, 0, 0.2);
        }
        .cs-card-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: flex-start;
          margin-bottom: 6px;
        }
        .cs-card-top h3 {
          margin: 0;
          font-size: 14px;
          color: #f5f0e8;
        }
        .cs-risk {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1px solid;
          border-radius: 4px;
          padding: 2px 6px;
          white-space: nowrap;
        }
        .cs-risk-label {
          font-size: 11px;
          color: rgba(212, 168, 75, 0.75);
          margin: 0 0 8px;
        }
        .cs-notes {
          font-size: 12px;
          line-height: 1.55;
          color: rgba(245, 240, 232, 0.5);
          margin: 0 0 10px;
        }
        .cs-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 10px;
        }
        .cs-tag {
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(91, 155, 213, 0.1);
          color: #5b9bd5;
          text-transform: capitalize;
        }
        .cs-tag--gold {
          background: rgba(212, 168, 75, 0.08);
          color: rgba(212, 168, 75, 0.85);
        }
        .cs-link {
          font-size: 11px;
          color: #d4a84b;
          text-decoration: none;
        }
      `}</style>
    </section>
  )
}
