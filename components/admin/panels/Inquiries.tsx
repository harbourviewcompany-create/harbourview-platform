/* eslint-disable */
// @ts-nocheck — Inquiry triage (operator)
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Pill,
  Spinner,
  truncate,
  fmtDt,
} from '@/components/admin/panels/shared'

function asArray(x) {
  if (Array.isArray(x)) return x
  if (x && Array.isArray(x.data)) return x.data
  return []
}

const TYPE_LABEL = {
  listing_submission: 'Listing',
  wanted_request_submission: 'Wanted',
  quote_routing: 'Quote',
  quote_request: 'Quote',
}

const PRI_PILL = { urgent: 'red', high: 'warn', medium: 'gray', low: 'gray' }

export function Inquiries({ api, toast }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('open') // open | pending | closed | all
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await api.get(
        'marketplace_inquiries',
        'select=id,created_at,inquiry_type,contact_company,contact_name,contact_email,contact_phone,status,message,review_status,priority,last_contacted_at,next_follow_up_at&order=created_at.desc&limit=300',
      )
      setRows(asArray(d))
      setSelected(new Set())
    } catch (e) {
      setError(e.message || String(e))
      setRows([])
      toast?.({ type: 'error', text: e.message || 'Inquiries load failed' })
    }
    setLoading(false)
  }, [api, toast])

  useEffect(() => { load() }, [load])

  const displayed = useMemo(() => {
    return rows.filter((r) => {
      const s = (r.review_status || 'open').toLowerCase()
      if (filter === 'open') return s === 'open' || s === 'new' || !r.review_status
      if (filter === 'pending') return s === 'pending_response' || s === 'pending'
      if (filter === 'closed') return s === 'closed' || s === 'resolved'
      return true
    })
  }, [rows, filter])

  const toggle = (id) => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const setReview = async (id, review_status) => {
    try {
      await api.patch('marketplace_inquiries', `id=eq.${id}`, { review_status })
      setRows((r) => r.map((x) => (x.id === id ? { ...x, review_status } : x)))
      toast?.({ type: 'success', text: `→ ${review_status}` })
    } catch (e) {
      toast?.({ type: 'error', text: e.message })
    }
  }

  const bulk = async (review_status) => {
    const ids = [...selected]
    if (!ids.length) return
    setBusy(true)
    for (const id of ids) {
      try {
        await api.patch('marketplace_inquiries', `id=eq.${id}`, { review_status })
      } catch { /* continue */ }
    }
    setBusy(false)
    toast?.({ type: 'success', text: `${ids.length} → ${review_status}` })
    await load()
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card-section">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div className="card-section-title" style={{ margin: 0, flex: 1 }}>Inquiry triage</div>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>Refresh</button>
          <a className="btn btn-ghost btn-sm" href="/admin/candidates">Candidates →</a>
        </div>
        <p style={{ fontSize: 12, color: '#6A7E9B', marginBottom: 10, lineHeight: 1.5 }}>
          Marketplace inbound: listings, wanted requests, quotes. Set review status and priority follow-up.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {[
            ['open', 'Open'],
            ['pending', 'Pending response'],
            ['closed', 'Closed'],
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
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, fontSize: 12, color: '#8A9BB5' }}>
          <span>{displayed.length} shown</span>
          <span>·</span>
          <span>{selected.size} selected</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set(displayed.map((r) => r.id)))}>
            Select visible
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
          <button className="btn btn-gold btn-sm" disabled={busy || !selected.size} onClick={() => bulk('pending_response')}>
            Mark pending
          </button>
          <button className="btn btn-ghost btn-sm" disabled={busy || !selected.size} onClick={() => bulk('closed')}>
            Close selected
          </button>
          <button className="btn btn-ghost btn-sm" disabled={busy || !selected.size} onClick={() => bulk('open')}>
            Reopen
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 10, fontSize: 12 }}>{error}</div>
        )}

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}><Spinner size={28} /></div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: '#6A7E9B', fontSize: 13 }}>
            No inquiries for this filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Company / contact</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{r.contact_company || '—'}</div>
                      <div style={{ fontSize: 11, color: '#6A7E9B' }}>
                        {r.contact_name} {r.contact_email ? `· ${r.contact_email}` : ''}
                      </div>
                      {r.message && (
                        <div style={{ fontSize: 11, color: '#8A9BB5', marginTop: 2 }}>{truncate(r.message, 80)}</div>
                      )}
                    </td>
                    <td style={{ fontSize: 11 }}>{TYPE_LABEL[r.inquiry_type] || r.inquiry_type || '—'}</td>
                    <td>
                      <Pill type={PRI_PILL[r.priority] || 'gray'}>{r.priority || '—'}</Pill>
                    </td>
                    <td>
                      <Pill type={r.review_status === 'closed' ? 'green' : r.review_status === 'pending_response' ? 'warn' : 'blue'}>
                        {r.review_status || 'open'}
                      </Pill>
                    </td>
                    <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDt(r.created_at)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDetail(r)}>Open</button>
                    </td>
                  </tr>
                ))}
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
            style={{ maxWidth: 520, width: '100%', maxHeight: '85vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-section-title">{detail.contact_company || 'Inquiry'}</div>
            <div style={{ fontSize: 12, color: '#8A9BB5', marginBottom: 8 }}>
              {detail.contact_name} · {detail.contact_email} · {detail.contact_phone || 'no phone'}
            </div>
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              <Pill type="blue">{TYPE_LABEL[detail.inquiry_type] || detail.inquiry_type}</Pill>{' '}
              <Pill type={PRI_PILL[detail.priority] || 'gray'}>{detail.priority || '—'}</Pill>{' '}
              <Pill>{detail.review_status || 'open'}</Pill>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: '#D4C9B8', whiteSpace: 'pre-wrap' }}>
              {detail.message || '—'}
            </p>
            <div style={{ fontSize: 11, color: '#4A5E80', marginTop: 8 }}>
              Created {fmtDt(detail.created_at)}
              {detail.next_follow_up_at ? ` · Follow-up ${fmtDt(detail.next_follow_up_at)}` : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              <button className="btn btn-gold btn-sm" onClick={() => setReview(detail.id, 'pending_response')}>
                Pending response
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setReview(detail.id, 'closed')}>
                Close
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setReview(detail.id, 'open')}>
                Reopen
              </button>
              <a className="btn btn-ghost btn-sm" href={`/admin/inquiries/${detail.id}`}>
                Full record →
              </a>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>Close panel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
