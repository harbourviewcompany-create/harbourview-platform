'use client'

import { useEffect, useState } from 'react'

type Submission = {
  id: string
  title_public_draft: string | null
  marketplace_category: string | null
  listing_type: string | null
  status: string | null
  created_at: string
  country: string | null
}

const STATUS_CONFIG: Record<string, { label: string; ok: boolean }> = {
  needs_review: { label: 'Under review', ok: false },
  approved:     { label: 'Approved',     ok: true  },
  published:    { label: 'Live',         ok: true  },
  rejected:     { label: 'Rejected',     ok: false },
  promoted:     { label: 'Promoted',     ok: true  },
  archived:     { label: 'Archived',     ok: false },
}

function statusCfg(status: string | null) {
  return STATUS_CONFIG[status ?? ''] ?? { label: status ?? 'Pending', ok: false }
}

export function MySubmissionsPanel() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetch('/api/marketplace/my-submissions')
      .then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then(d => {
        if (!cancelled) {
          setSubmissions(d.submissions ?? [])
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
        <div className="cc-right-head">MY SUBMISSIONS</div>
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
        <div className="cc-right-head">MY SUBMISSIONS</div>
        <p className="cc-right-prose" style={{ color: 'rgba(248,113,113,0.75)' }}>Could not load submissions.</p>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="cc-right-section">
        <div className="cc-right-head">MY SUBMISSIONS</div>
        <p className="cc-right-prose">No submissions yet. Use &ldquo;Submit a listing&rdquo; to get started.</p>
      </div>
    )
  }

  return (
    <div className="cc-right-section">
      <div className="cc-right-head">MY SUBMISSIONS</div>
      {submissions.slice(0, 5).map(s => {
        const cfg = statusCfg(s.status)
        const title = s.title_public_draft ?? s.listing_type ?? 'Untitled submission'
        const sub   = [s.marketplace_category, s.country].filter(Boolean).join(' · ')
        return (
          <div key={s.id} className="cc-req-row">
            <span className={`cc-req-icon ${cfg.ok ? 'ok' : 'pending'}`}>{cfg.ok ? '✓' : '○'}</span>
            <div>
              <strong>{title.length > 40 ? title.slice(0, 40) + '…' : title}</strong>
              <small>{cfg.label}{sub ? ' · ' + sub : ''}</small>
            </div>
          </div>
        )
      })}
      {submissions.length > 5 && (
        <p className="cc-right-prose" style={{ marginTop: 6, fontSize: 10 }}>
          +{submissions.length - 5} more submission{submissions.length - 5 > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
