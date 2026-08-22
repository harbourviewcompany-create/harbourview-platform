/* eslint-disable */
// @ts-nocheck — Countries coverage registry (operator)
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Pill, Spinner } from '@/components/admin/panels/shared'

function asArray(x) {
  if (Array.isArray(x)) return x
  if (x && Array.isArray(x.data)) return x.data
  return []
}

const COMPLETENESS = ['stub', 'seed', 'partial', 'full']
const STATUS_OPTS = [
  'unknown',
  'open',
  'active',
  'regulated',
  'emerging',
  'limited',
  'restricted',
  'review-required',
]

/** Priority ISO2 markets — suggested baseline when applying "priority pack" */
const PRIORITY_BASELINE = {
  DE: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 85 },
  CA: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 82 },
  AU: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 78 },
  GB: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 75 },
  UK: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 75 },
  US: { data_completeness: 'partial', market_access_status: 'limited', medical_status: 'limited', opportunity_score: 70 },
  NL: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 72 },
  PT: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 68 },
  ES: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 65 },
  IT: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 64 },
  FR: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 66 },
  PL: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 60 },
  CZ: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 58 },
  IL: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 74 },
  TH: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 62 },
  NZ: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 70 },
  CH: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 71 },
  DK: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 69 },
  SE: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 67 },
  NO: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 66 },
  ZA: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 55 },
  BR: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 58 },
  CO: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 63 },
  MX: { data_completeness: 'seed', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 52 },
  JP: { data_completeness: 'seed', market_access_status: 'limited', medical_status: 'limited', opportunity_score: 48 },
  KR: { data_completeness: 'seed', market_access_status: 'limited', medical_status: 'limited', opportunity_score: 45 },
}

function compPill(v) {
  const x = (v || '').toLowerCase()
  if (x === 'full') return <Pill type="green">Full</Pill>
  if (x === 'partial') return <Pill type="warn">Partial</Pill>
  if (x === 'seed') return <Pill type="blue">seed</Pill>
  if (x === 'stub') return <Pill type="gray">Stub</Pill>
  return <Pill>{v || '—'}</Pill>
}

export function Countries({ api, toast }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState({})
  const [busy, setBusy] = useState(false)
  const [lastRun, setLastRun] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = asArray(
        await api.get(
          'countries',
          'select=id,country_name,iso_alpha2,region,data_completeness,market_access_status,medical_status,opportunity_score&order=region.asc,country_name.asc&limit=400',
        ),
      )
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
    return rows.filter((r) => {
      if (filter !== 'all' && (r.data_completeness || '').toLowerCase() !== filter) return false
      if (!qq) return true
      return (
        (r.country_name || '').toLowerCase().includes(qq) ||
        (r.iso_alpha2 || '').toLowerCase().includes(qq) ||
        (r.region || '').toLowerCase().includes(qq)
      )
    })
  }, [rows, filter, q])

  const counts = useMemo(() => {
    const c = { all: rows.length, stub: 0, seed: 0, partial: 0, full: 0 }
    for (const r of rows) {
      const k = (r.data_completeness || '').toLowerCase()
      if (k in c) c[k]++
    }
    return c
  }, [rows])

  const startEdit = (c) => {
    setEditing(c.id)
    setEditVal({
      data_completeness: c.data_completeness || 'stub',
      market_access_status: c.market_access_status || 'unknown',
      medical_status: c.medical_status || 'unknown',
      opportunity_score: c.opportunity_score ?? 0,
      region: c.region || '',
    })
  }

  const saveEdit = async (id) => {
    const snapshot = rows
    const body = {
      data_completeness: editVal.data_completeness,
      market_access_status: editVal.market_access_status,
      medical_status: editVal.medical_status,
      opportunity_score: Number(editVal.opportunity_score) || 0,
      region: editVal.region || null,
    }
    setRows((r) => r.map((c) => (c.id === id ? { ...c, ...body } : c)))
    setEditing(null)
    try {
      await api.patch('countries', `id=eq.${id}`, body)
      toast?.({ type: 'success', text: 'Country updated' })
    } catch (e) {
      setRows(snapshot)
      toast?.({ type: 'error', text: e.message || 'Save failed — reverted' })
    }
  }

  /** Apply priority-market baseline pack for rows that match PRIORITY_BASELINE */
  const applyPriorityPack = async () => {
    const targets = rows.filter((r) => PRIORITY_BASELINE[(r.iso_alpha2 || '').toUpperCase()])
    if (!targets.length) {
      toast?.({ type: 'error', text: 'No priority ISO matches in loaded rows' })
      return
    }
    if (!confirm(`Apply priority baseline to ${targets.length} markets (DE, CA, AU, …)?`)) return
    setBusy(true)
    const snapshot = rows
    // Optimistic
    setRows((prev) =>
      prev.map((r) => {
        const pack = PRIORITY_BASELINE[(r.iso_alpha2 || '').toUpperCase()]
        return pack ? { ...r, ...pack } : r
      }),
    )
    let ok = 0
    let fail = 0
    for (const r of targets) {
      const pack = PRIORITY_BASELINE[(r.iso_alpha2 || '').toUpperCase()]
      try {
        await api.patch('countries', `id=eq.${r.id}`, pack)
        ok++
      } catch {
        fail++
      }
    }
    setBusy(false)
    if (fail) {
      toast?.({ type: 'error', text: `Updated ${ok}, failed ${fail} — reloading` })
      await load()
    } else {
      toast?.({ type: 'success', text: `Priority pack applied to ${ok} countries` })
    }
  }


  const runContinuous = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/country-coverage/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyPriority: true, enqueueEnrichment: true }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Coverage run failed')
      setLastRun(data)
      toast?.({
        type: 'success',
        text: `Coverage tick: ${data.result?.priority_updated ?? 0} priority updated; enrichment ${data.result?.enrichment_enqueued ? 'queued' : 'skip'}`,
      })
      await load()
    } catch (e) {
      toast?.({ type: 'error', text: e.message || 'Continuous refresh failed' })
    }
    setBusy(false)
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card-section">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div className="card-section-title" style={{ margin: 0, flex: 1 }}>Country coverage</div>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>Refresh</button>
          <button className="btn btn-gold btn-sm" onClick={runContinuous} disabled={busy || loading}>
            Run continuous refresh
          </button>
          <button className="btn btn-ghost btn-sm" onClick={applyPriorityPack} disabled={busy || loading}>
            Priority pack only
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#6A7E9B', marginBottom: 10, lineHeight: 1.5 }}>
          Registry of market maturity — not full legal text. <strong>Run continuous refresh</strong> applies
          priority floors, seeds fixture depth, and enqueues regulatory enrichment jobs for agents
          (same loop as the daily cron). Agents process the queue; this keeps data moving.
        </p>
        {lastRun?.result && (
          <div style={{ fontSize: 11, color: '#8A9BB5', marginBottom: 10, fontFamily: 'ui-monospace, monospace' }}>
            Last run {lastRun.result.at}: updated {lastRun.result.priority_updated},
            skipped {lastRun.result.priority_skipped},
            enrichment {lastRun.result.enrichment_enqueued ? 'queued' : (lastRun.result.enrichment_error || 'n/a')},
            coverage stub={lastRun.result.coverage?.stub} seed={lastRun.result.coverage?.seed} partial={lastRun.result.coverage?.partial} full={lastRun.result.coverage?.full}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {[
            ['all', `All (${counts.all})`],
            ['stub', `Stub (${counts.stub})`],
            ['seed', `Seed (${counts.seed})`],
            ['partial', `Partial (${counts.partial})`],
            ['full', `Full (${counts.full})`],
          ].map(([k, label]) => (
            <button
              key={k}
              className={`btn btn-sm ${filter === k ? 'btn-gold' : 'btn-ghost'}`}
              onClick={() => setFilter(k)}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, ISO, region…"
          style={{
            width: '100%',
            maxWidth: 360,
            marginBottom: 12,
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid #1A2640',
            background: '#0D1527',
            color: '#D4C9B8',
            fontSize: 13,
          }}
        />

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 10, fontSize: 12 }}>{error}</div>
        )}

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}><Spinner size={28} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Country</th>
                  <th>ISO</th>
                  <th>Region</th>
                  <th>Data</th>
                  <th>Market access</th>
                  <th>Medical</th>
                  <th>Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{c.country_name}</td>
                    <td className="cell-mono" style={{ fontSize: 11 }}>{c.iso_alpha2}</td>
                    <td style={{ fontSize: 11, color: '#6A7E9B' }}>
                      {editing === c.id ? (
                        <input
                          value={editVal.region || ''}
                          onChange={(e) => setEditVal((v) => ({ ...v, region: e.target.value }))}
                          style={{ width: 90, fontSize: 11 }}
                        />
                      ) : (
                        c.region || '—'
                      )}
                    </td>
                    <td>
                      {editing === c.id ? (
                        <select
                          value={editVal.data_completeness}
                          onChange={(e) => setEditVal((v) => ({ ...v, data_completeness: e.target.value }))}
                        >
                          {COMPLETENESS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        compPill(c.data_completeness)
                      )}
                    </td>
                    <td>
                      {editing === c.id ? (
                        <select
                          value={editVal.market_access_status}
                          onChange={(e) => setEditVal((v) => ({ ...v, market_access_status: e.target.value }))}
                        >
                          {STATUS_OPTS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: 11, color: '#A0B0C8' }}>{c.market_access_status || '—'}</span>
                      )}
                    </td>
                    <td>
                      {editing === c.id ? (
                        <select
                          value={editVal.medical_status}
                          onChange={(e) => setEditVal((v) => ({ ...v, medical_status: e.target.value }))}
                        >
                          {STATUS_OPTS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: 11, color: '#A0B0C8' }}>{c.medical_status || '—'}</span>
                      )}
                    </td>
                    <td>
                      {editing === c.id ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={editVal.opportunity_score}
                          onChange={(e) => setEditVal((v) => ({ ...v, opportunity_score: e.target.value }))}
                          style={{ width: 56, fontSize: 11 }}
                        />
                      ) : (
                        <span className="cell-mono">{c.opportunity_score ?? '—'}</span>
                      )}
                    </td>
                    <td>
                      {editing === c.id ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-gold btn-sm" onClick={() => saveEdit(c.id)}>Save</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>✕</button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(c)}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!displayed.length && (
              <div style={{ padding: 24, textAlign: 'center', color: '#6A7E9B', fontSize: 13 }}>No countries match.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
