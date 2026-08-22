/* eslint-disable */
// @ts-nocheck — Signals review panel (operator)
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Pill,
  priPill,
  lanePill,
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

export function Signals({ api, toast }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('unreviewed') // unreviewed | reviewed | urgent | all
  const [lane, setLane] = useState('all')
  const [scopeMode, setScopeMode] = useState('in_scope') // all | in_scope | oos
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const parts = [
        'select=id,date,headline,source,country,pri,score,top_lane,reviewed,action,created_at',
        'order=created_at.desc',
        'limit=300',
        filter === 'unreviewed' ? 'reviewed=is.false' : null,
        filter === 'reviewed' ? 'reviewed=is.true' : null,
        filter === 'urgent' ? 'pri=eq.URGENT' : null,
        lane !== 'all' ? `top_lane=eq.${lane}` : null,
      ].filter(Boolean).join('&')
      const data = asArray(await api.get('signals', parts))
      setRows(data)
      setSelected(new Set())
    } catch (e) {
      setError(e.message || String(e))
      setRows([])
      toast?.({ type: 'error', text: e.message || 'Failed to load signals' })
    }
    setLoading(false)
  }, [api, filter, lane, toast])

  useEffect(() => { load() }, [load])

  const scoped = useMemo(() => {
    return rows.filter((r) => {
      const text = `${r.headline || ''} ${r.source || ''} ${r.country || ''}`
      const inScope = inCannabisScope(text)
      if (scopeMode === 'in_scope') return inScope
      if (scopeMode === 'oos') return !inScope
      return true
    })
  }, [rows, scopeMode])

  const oosCount = useMemo(
    () => rows.filter((r) => !inCannabisScope(`${r.headline || ''} ${r.source || ''}`)).length,
    [rows],
  )

  const toggle = (id) => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const selectVisible = () => setSelected(new Set(scoped.map((r) => r.id)))
  const selectOos = () =>
    setSelected(
      new Set(
        scoped
          .filter((r) => !inCannabisScope(`${r.headline || ''} ${r.source || ''}`))
          .map((r) => r.id),
      ),
    )
  const clearSel = () => setSelected(new Set())

  const patchMany = async (ids, body) => {
    if (!ids.length) return
    const idSet = new Set(ids)
    const snapshot = rows
    // Optimistic: apply body to matching rows immediately
    setRows((prev) =>
      prev.map((r) => (idSet.has(r.id) ? { ...r, ...body } : r)),
    )
    setSelected(new Set())
    setBusy(true)
    try {
      const chunk = 200
      let total = 0
      for (let i = 0; i < ids.length; i += chunk) {
        const slice = ids.slice(i, i + chunk)
        await api.patchBulk('signals', slice, body)
        total += slice.length
      }
      toast?.({ type: 'success', text: `Updated ${total} signal(s)` })
      // Soft refresh in background to stay consistent with server
      load()
    } catch (e) {
      setRows(snapshot)
      toast?.({ type: 'error', text: e.message || 'Bulk update failed — reverted' })
    }
    setBusy(false)
  }

  const approveSelected = () =>
    patchMany([...selected], { reviewed: true, action: 'approved' })
  const rejectOosSelected = () =>
    patchMany([...selected], { reviewed: true, action: 'rejected_oos' })
  const rejectAllOosVisible = () => {
    const ids = scoped
      .filter((r) => !inCannabisScope(`${r.headline || ''} ${r.source || ''}`))
      .map((r) => r.id)
    return patchMany(ids, { reviewed: true, action: 'rejected_oos' })
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card-section">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div className="card-section-title" style={{ margin: 0, flex: 1 }}>Signal review</div>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>Refresh</button>
        </div>
        <p style={{ fontSize: 12, color: '#6A7E9B', marginBottom: 10, lineHeight: 1.5 }}>
          Commercial corridor intel only. Consumer SEO / “is weed legal” guides are out of scope.
          Default filter: <strong>in scope</strong> + unreviewed.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {[
            ['unreviewed', 'Unreviewed'],
            ['urgent', 'Urgent'],
            ['reviewed', 'Reviewed'],
            ['all', 'All'],
          ].map(([k, label]) => (
            <button
              key={k}
              className={`btn btn-sm ${filter === k ? 'btn-gold' : 'btn-ghost'}`}
              onClick={() => setFilter(k)}
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, fontSize: 12, color: '#8A9BB5' }}>
          <span>{rows.length} loaded</span>
          <span>·</span>
          <span>{scoped.length} visible</span>
          <span>·</span>
          <span style={{ color: '#E8A0A0' }}>{oosCount} OOS in load</span>
          <span>·</span>
          <span>{selected.size} selected</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={selectVisible} disabled={!scoped.length}>
            Select visible
          </button>
          <button className="btn btn-ghost btn-sm" onClick={selectOos} disabled={!oosCount}>
            Select OOS
          </button>
          <button className="btn btn-ghost btn-sm" onClick={clearSel} disabled={!selected.size}>
            Clear
          </button>
          <button
            className="btn btn-gold btn-sm"
            onClick={approveSelected}
            disabled={busy || !selected.size}
          >
            Approve ({selected.size})
          </button>
          <button
            className="btn btn-sm"
            style={{ background: '#5A2020', color: '#FFB3B3', border: 'none' }}
            onClick={rejectOosSelected}
            disabled={busy || !selected.size}
          >
            Reject selected
          </button>
          <button
            className="btn btn-sm"
            style={{ background: '#3A1515', color: '#FFB3B3', border: '1px solid #5A2020' }}
            onClick={rejectAllOosVisible}
            disabled={busy || scopeMode === 'in_scope'}
            title="Switch to OOS or All scopes to bulk-reject"
          >
            Reject all OOS in view
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 10, fontSize: 12 }}>
            {error} — check hub-proxy / Supabase service role.
          </div>
        )}

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <Spinner size={28} />
          </div>
        ) : scoped.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: '#6A7E9B', fontSize: 13 }}>
            No signals for this filter.
            {filter === 'unreviewed' && scopeMode === 'in_scope' ? (
              <div style={{ marginTop: 8 }}>
                Try <button className="btn btn-ghost btn-sm" onClick={() => setScopeMode('all')}>All scopes</button>
                {' '}or{' '}
                <button className="btn btn-ghost btn-sm" onClick={() => setFilter('all')}>All status</button>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Headline</th>
                  <th>Lane</th>
                  <th>Pri</th>
                  <th>Country</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {scoped.map((r) => {
                  const oos = !inCannabisScope(`${r.headline || ''} ${r.source || ''}`)
                  return (
                    <tr key={r.id} style={{ opacity: oos ? 0.55 : 1 }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggle(r.id)}
                        />
                      </td>
                      <td>
                        <div style={{ fontSize: 12, maxWidth: 360 }}>{truncate(r.headline, 90)}</div>
                        <div style={{ fontSize: 10, color: '#4A5E80' }}>{r.source}</div>
                        {oos && <Pill type="red">OOS</Pill>}
                      </td>
                      <td>{lanePill(r.top_lane)}</td>
                      <td>{priPill(r.pri)}</td>
                      <td style={{ fontSize: 11 }}>{r.country || '—'}</td>
                      <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDate(r.date || r.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
