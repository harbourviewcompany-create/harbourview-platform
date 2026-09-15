/* eslint-disable */
// @ts-nocheck — Regulatory tier review queue (operator)
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Spinner } from '@/components/admin/panels/shared'

function asArray(x) {
  if (Array.isArray(x)) return x
  if (x && Array.isArray(x.data)) return x.data
  return []
}

const TIER_COLORS = {
  legal_commercial_access: '#2fd46f',
  medical_limited_trade: '#f2c53d',
  domestic_only: '#f07d2e',
  cbd_hemp_only: '#2bc2c2',
  prohibited: '#c44a4a',
}

function TierChip({ tier }) {
  if (!tier) return <span className="text-white/40">—</span>
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: `${TIER_COLORS[tier] || '#666'}22`, color: TIER_COLORS[tier] || '#ccc' }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: TIER_COLORS[tier] || '#666' }} />
      {tier}
    </span>
  )
}

export function RegulatoryReviewQueue({ api, toast }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data
      try {
        data = asArray(
          await api.get(
            'regulatory_tier_review_queue',
            'select=iso_alpha2,country_name,region,current_tier,origin,classifier_suggests,differs_from_classifier,program_status,rationale,reviewed_at,last_derived_at&order=country_name.asc&limit=500',
            { schema: 'api' },
          ),
        )
      } catch {
        data = asArray(
          await api.get(
            'countries',
            'select=iso_alpha2,country_name,region,regulatory_tier,regulatory_tier_origin,regulatory_tier_rationale,regulatory_tier_reviewed_at,regulatory_tier_needs_review&regulatory_tier_needs_review=eq.true&order=country_name.asc&limit=500',
          ),
        ).map((r) => ({
          iso_alpha2: r.iso_alpha2,
          country_name: r.country_name,
          region: r.region,
          current_tier: r.regulatory_tier,
          origin: r.regulatory_tier_origin,
          classifier_suggests: null,
          differs_from_classifier: null,
          program_status: null,
          rationale: r.regulatory_tier_rationale,
          reviewed_at: r.regulatory_tier_reviewed_at,
        }))
      }
      setRows(data)
    } catch (e) {
      setError(e.message || String(e))
      toast?.({ type: 'error', text: e.message })
    }
    setLoading(false)
  }, [api, toast])

  useEffect(() => {
    load()
  }, [load])

  const displayed = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return rows
    return rows.filter(
      (r) =>
        (r.country_name || '').toLowerCase().includes(qq) ||
        (r.iso_alpha2 || '').toLowerCase().includes(qq) ||
        (r.region || '').toLowerCase().includes(qq),
    )
  }, [rows, q])

  const acceptClassifier = async (iso) => {
    setBusy(iso)
    try {
      await api.rpc('accept_classifier_tier', { p_iso: iso, p_actor: 'admin-ui' }, { schema: 'api' })
      toast?.({ type: 'ok', text: `Accepted classifier for ${iso}` })
      await load()
    } catch (e) {
      toast?.({ type: 'error', text: e.message || String(e) })
    }
    setBusy(null)
  }

  const setTier = async (iso, tier) => {
    setBusy(iso)
    try {
      await api.rpc(
        'set_regulatory_tier',
        { p_iso: iso, p_tier: tier, p_actor: 'admin-ui', p_note: 'Reviewed via review-queue UI' },
        { schema: 'api' },
      )
      toast?.({ type: 'ok', text: `Set ${iso} → ${tier}` })
      await load()
    } catch (e) {
      toast?.({ type: 'error', text: e.message || String(e) })
    }
    setBusy(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#f5f1e8]">Regulatory tier review queue</h1>
          <p className="mt-1 text-xs text-white/45">
            Rows flagged needs_review. Accept classifier or set override. {rows.length} open.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter ISO / name / region"
            className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white/80"
          />
          <button type="button" onClick={load} className="rounded-md border border-white/12 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5">
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Spinner /> Loading queue…
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && displayed.length === 0 && (
        <p className="text-sm text-white/40">Queue empty — no needs_review rows.</p>
      )}

      {!loading && displayed.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-3 py-2">Jurisdiction</th>
                <th className="px-3 py-2">Current</th>
                <th className="px-3 py-2">Classifier</th>
                <th className="px-3 py-2">Origin</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((r) => (
                <tr key={r.iso_alpha2} className="border-t border-white/8 align-top">
                  <td className="px-3 py-2">
                    <div className="font-medium text-white/85">{r.country_name}</div>
                    <div className="text-white/40">
                      {r.iso_alpha2} · {r.region || '—'}
                    </div>
                    {r.differs_from_classifier && (
                      <div className="mt-1 text-[10px] text-amber-400/90">Differs from classifier</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <TierChip tier={r.current_tier} />
                  </td>
                  <td className="px-3 py-2">
                    <TierChip tier={r.classifier_suggests} />
                  </td>
                  <td className="px-3 py-2 text-white/50">{r.origin || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {r.classifier_suggests && (
                        <button
                          type="button"
                          disabled={busy === r.iso_alpha2}
                          onClick={() => acceptClassifier(r.iso_alpha2)}
                          className="rounded border border-emerald-500/30 px-2 py-1 text-[10px] text-emerald-300/90 hover:bg-emerald-500/10"
                        >
                          Accept classifier
                        </button>
                      )}
                      {['legal_commercial_access', 'medical_limited_trade', 'domestic_only', 'cbd_hemp_only', 'prohibited'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          disabled={busy === r.iso_alpha2}
                          onClick={() => setTier(r.iso_alpha2, t)}
                          className="rounded border border-white/10 px-1.5 py-1 text-[10px] text-white/55 hover:bg-white/5"
                          title={t}
                        >
                          {t.split('_')[0]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
