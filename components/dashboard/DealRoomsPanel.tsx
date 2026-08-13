'use client'

import { useEffect, useState } from 'react'

type DealRoom = {
  id: string
  title: string
  listing_ref: string | null
  status: string
  updated_at: string
}

const STATUS_CONFIG: Record<string, { label: string; ok: boolean }> = {
  active:      { label: 'Active',         ok: true  },
  negotiating: { label: 'In negotiation', ok: true  },
  agreed:      { label: 'Terms agreed',   ok: true  },
  closed:      { label: 'Closed',         ok: false },
  cancelled:   { label: 'Cancelled',      ok: false },
}

function statusCfg(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, ok: false }
}

export function DealRoomsPanel({ onOpenRoom }: { onOpenRoom?: (roomId?: string) => void } = {}) {
  const [rooms, setRooms] = useState<DealRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetch('/api/marketplace/my-deal-rooms')
      .then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then(d => {
        if (!cancelled) {
          setRooms(d.rooms ?? [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="cc-right-section">
        <div className="cc-right-head">DEAL ROOMS</div>
        {[1, 2].map(i => (
          <div key={i} className="cc-req-row" style={{ opacity: 0.4 }}>
            <span className="cc-req-icon pending">○</span>
            <div>
              <strong style={{ display: 'block', background: 'rgba(255,255,255,0.06)', borderRadius: 3, width: 120, height: 10 }} />
              <small style={{ display: 'block', background: 'rgba(255,255,255,0.04)', borderRadius: 3, width: 70, height: 8, marginTop: 4 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="cc-right-section">
        <div className="cc-right-head">DEAL ROOMS</div>
        <p className="cc-right-prose" style={{ color: 'rgba(248,113,113,0.75)' }}>Could not load deal rooms.</p>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="cc-right-section">
        <div className="cc-right-head">DEAL ROOMS</div>
        <p className="cc-right-prose">No active deal rooms. Open a deal room from any marketplace listing to start a private negotiation.</p>
        <button type="button" className="cc-right-link" onClick={() => onOpenRoom?.()}>Browse deal rooms →</button>
      </div>
    )
  }

  return (
    <div className="cc-right-section">
      <div className="cc-right-head">DEAL ROOMS</div>
      {rooms.slice(0, 4).map(room => {
        const cfg = statusCfg(room.status)
        const title = room.title.length > 40 ? room.title.slice(0, 40) + '…' : room.title
        const updated = new Date(room.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        return (
          <button key={room.id} type="button" onClick={() => onOpenRoom?.(room.id)} className="cc-req-row" style={{ textDecoration: 'none', color: 'inherit', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <span className={`cc-req-icon ${cfg.ok ? 'ok' : 'pending'}`}>{cfg.ok ? '◎' : '○'}</span>
            <div>
              <strong>{title}</strong>
              <small>{cfg.label} · {updated}</small>
            </div>
          </button>
        )
      })}
      {rooms.length > 4 && (
        <p className="cc-right-prose" style={{ marginTop: 6, fontSize: 10 }}>
          +{rooms.length - 4} more room{rooms.length - 4 > 1 ? 's' : ''}
        </p>
      )}
      <button type="button" className="cc-right-link" onClick={() => onOpenRoom?.()}>View all deal rooms →</button>
    </div>
  )
}
