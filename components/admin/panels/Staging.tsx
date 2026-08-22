/* eslint-disable */
// @ts-nocheck — Staging queue (operator)
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Pill,
  Spinner,
  truncate,
  fmtDate,
  inCannabisScope,
} from '@/components/admin/panels/shared'

function asArray(x) {
  if (Array.isArray(x)) return x
  if (x && Array.isArray(x.data)) return x.data
  return []
}

export function Staging({ api, toast }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('pending') // pending | approved | rejected | all
  const [scopeMode, setScopeMode] = useState('in_scope')
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const parts = [
        'select=id,proposed_title,proposed_country_iso,source_system,status,created_at,payload,notes',
        'order=created_at.desc',
        'limit=300',
        statusFilter !== 'all' ? `status=eq.${statusFilter}` : null,
      ].filter(Boolean).join('&')
      setRows(asArray(await api.get('hv_import_staging', parts)))
      setSelected(new Set())
    } catch (e) {
      setError(e.message || String(e))
      setRows([])
      toast?.({ type: 'error', text: e.message || 'Staging load failed' })
    }
    setLoading(false)
  }, [api, statusFilter, toast])

  useEffect(() => { load() }, [load])

  const scoped = useMemo(() => {
    return rows.filter((r) => {
      const text = `${r.proposed_title || ''} ${r.source_system || ''} ${r.proposed_country_iso || ''}`
      const inScope = inCannabisScope(text)
      if (scopeMode === 'in_scope') return inScope
      if (scopeMode === 'oos') return !inScope
      return true
    })
  }, [rows, scopeMode])

  const counts = useMemo(() => {
    const pending = rows.filter((r) => r.status === 'pending').length
    const oosPending = rows.filter(
      (r) => r.status === 'pending' && !inCannabisScope(`${r.proposed_title || ''}`),
    ).length
    return { pending, oosPending, visible: scoped.length }
  }, [rows, scoped])

  const toggle = (id) => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const patchMany = async (ids, status) => {
    if (!ids.length) return
    const idSet = new Set(ids)
    const snapshot = rows
    setRows((prev) =>
      prev.map((r) => (idSet.has(r.id) ? { ...r, status } : r)),
    )
    setSelected(new Set())
    if (detail && idSet.has(detail.id)) {
      setDetail({ ...detail, status })
    }
    setBusy(true)
    try {
      const chunk = 200
      let total = 0
      for (let i = 0; i < ids.length; i += chunk) {
        const slice = ids.slice(i, i + chunk)
        await api.patchBulk('hv_import_staging', slice, { status })
        total += slice.length
      }
      toast?.({ type: 'success', text: `Set ${total} → ${status}` })
      load()
    } catch (e) {
      setRows(snapshot)
      toast?.({ type: 'error', text: e.message || 'Bulk update failed — reverted' })
    }
    setBusy(false)
  }

  const approveSelected = () => patchMany([...selected], 'approved')
  const rejectSelected = () => patchMany([...selected], 'rejected')
  const approveInScopePending = () => {
    const ids = scoped
      .filter((r) => r.status === 'pending' && inCannabisScope(r.proposed_title || ''))
      .map((r) => r.id)
    return patchMany(ids, 'approved')
  }
  const rejectOosPending = () => {
    const ids = rows
      .filter((r) => r.status === 'pending' && !inCannabisScope(r.proposed_title || ''))
      .map((r) => r.id)
    return patchMany(ids, 'rejected')
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card-section">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div className="card-section-title" style={{ margin: 0, flex: 1 }}>Staging queue</div>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>Refresh</button>
          <a className="btn btn-ghost btn-sm" href="/admin/actions">Run ingest RPCs →</a>
        </div>
        <p style={{ fontSize: 12, color: '#6A7E9B', marginBottom: 10, lineHeight: 1.5 }}>
          Review imported snapshot rows before they feed signals / intel. Approve in-scope commercial items;
          reject consumer SEO and out-of-scope noise.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {[
            ['pending', 'Pending'],
            ['approved', 'Approved'],
            ['rejected', 'Rejected'],
            ['all', 'All'],
          ].map(([k, label]) => (
            <button
              key={k}
              className={`btn btn-sm ${statusFilter === k ? 'btn-gold' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(k)}
            >
              {label}
            </button>
          ))}
          <span style={{ width: 8 }} />
          {[
            ['in_scope', 'In scope'],
            ['oos', 'OOS'],
            ['all', 'All scopes'],
          ].map(([k, label]) => (
            <button
              key={k}
              className={`btn btn-sm ${scopeMode === k ? 'btn-gold' : 'btn-ghost'}`}
              onClick={() => setScopeMode(k)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10, fontSize: 12, color: '#8A9BB5' }}>
          <span>{counts.visible} visible</span>
          <span>·</span>
          <span>{counts.pending} pending in load</span>
          <span>·</span>
          <span style={{ color: '#E8A0A0' }}>{counts.oosPending} OOS pending</span>
          <span>·</span>
          <span>{selected.size} selected</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set(scoped.map((r) => r.id)))}>
            Select visible
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
          <button className="btn btn-gold btn-sm" disabled={busy || !selected.size} onClick={approveSelected}>
            Approve selected
          </button>
          <button
            className="btn btn-sm"
            style={{ background: '#5A2020', color: '#FFB3B3', border: 'none' }}
            disabled={busy || !selected.size}
            onClick={rejectSelected}
          >
            Reject selected
          </button>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={approveInScopePending}>
            Approve all in-scope pending
          </button>
          <button
            className="btn btn-sm"
            style={{ background: '#3A1515', color: '#FFB3B3', border: '1px solid #5A2020' }}
            disabled={busy}
            onClick={rejectOosPending}
          >
            Reject all OOS pending
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 10, fontSize: 12 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}><Spinner size={28} /></div>
        ) : scoped.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: '#6A7E9B', fontSize: 13 }}>
            No staging rows for this filter.
            <div style={{ marginTop: 8 }}>
              <a className="btn btn-ghost btn-sm" href="/admin/actions">Ingest via Actions →</a>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Title</th>
                  <th>Country</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {scoped.map((r) => {
                  const oos = !inCannabisScope(r.proposed_title || '')
                  return (
                    <tr key={r.id} style={{ opacity: oos ? 0.55 : 1 }}>
                      <td>
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                      </td>
                      <td>
                        <div style={{ fontSize: 12, maxWidth: 320 }}>{truncate(r.proposed_title, 100)}</div>
                        {oos && <Pill type="red">OOS</Pill>}
                      </td>
                      <td style={{ fontSize: 11 }}>{r.proposed_country_iso || '—'}</td>
                      <td style={{ fontSize: 11 }}>{truncate(r.source_system, 24)}</td>
                      <td>
                        <Pill type={r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'warn'}>
                          {r.status || '—'}
                        </Pill>
                      </td>
                      <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDetail(r)}>View</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 80,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={() => setDetail(null)}
        >
          <div
            className="card-section"
            style={{ maxWidth: 520, width: '100%', maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-section-title">{truncate(detail.proposed_title, 80)}</div>
            <div style={{ fontSize: 12, color: '#8A9BB5', marginBottom: 10 }}>
              {detail.proposed_country_iso} · {detail.source_system} · {detail.status}
            </div>
            <pre style={{
              fontSize: 10, background: '#0D1527', padding: 10, borderRadius: 6,
              border: '1px solid #1A2640', overflow: 'auto', maxHeight: 280,
            }}>
              {JSON.stringify(detail.payload || detail, null, 2)}
            </pre>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-gold btn-sm" onClick={() => { patchMany([detail.id], 'approved'); setDetail(null) }}>
                Approve
              </button>
              <button className="btn btn-sm" style={{ background: '#5A2020', color: '#FFB3B3', border: 'none' }}
                onClick={() => { patchMany([detail.id], 'rejected'); setDetail(null) }}>
                Reject
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
