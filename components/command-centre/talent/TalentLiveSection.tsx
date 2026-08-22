'use client'

/**
 * Live talent list for mobile Command Talent section.
 * Fetches published opportunities from /api/talent.
 */

import { useEffect, useState } from 'react'
import type { TalentOpportunity } from '@/types/talent'
import { formatSalaryBand, ROLE_FAMILIES } from '@/lib/talent/taxonomy'
import { TalentJobDetail } from './TalentJobDetail'

interface TalentLiveSectionProps {
  jurisdiction?: string | null
}

export function TalentLiveSection({ jurisdiction = null }: TalentLiveSectionProps) {
  const [items, setItems] = useState<TalentOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<TalentOpportunity | null>(null)
  const [alertState, setAlertState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams()
        if (jurisdiction) qs.set('jurisdiction', jurisdiction)
        qs.set('limit', '20')
        const res = await fetch(`/api/talent?${qs.toString()}`)
        if (!res.ok) throw new Error('Failed to load opportunities')
        const data = await res.json()
        if (!cancelled) setItems(data.items ?? [])
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Unable to load talent opportunities')
          setItems([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [jurisdiction])

  async function handleSetAlert() {
    setAlertState('loading')
    setAlertMsg(null)
    try {
      const res = await fetch('/api/talent/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: jurisdiction ? `Roles in ${jurisdiction}` : 'All open roles',
          jurisdictions: jurisdiction ? [jurisdiction] : [],
          frequency: 'daily',
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.status === 401) {
        setAlertState('error')
        setAlertMsg('Sign in to set a talent alert.')
        return
      }
      if (!res.ok) throw new Error(body.error ?? 'Could not create alert')
      setAlertState('done')
      setAlertMsg('Alert saved.')
    } catch (e: any) {
      setAlertState('error')
      setAlertMsg(e?.message ?? 'Could not create alert')
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-white/40 py-6 text-center">Loading opportunities…</p>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-red-300/90 py-4 text-center">{error}</p>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 text-center">
        <p className="text-white/80 font-medium mb-1">No talent opportunities loaded</p>
        <p className="text-sm text-white/45 mb-4">
          {jurisdiction
            ? `No published roles in ${jurisdiction} yet. Broaden jurisdiction or set an alert.`
            : 'Published roles will appear here after review. Set an alert to be notified.'}
        </p>
        <button
          type="button"
          disabled={alertState === 'loading' || alertState === 'done'}
          onClick={handleSetAlert}
          className="rounded-xl bg-amber-600/90 hover:bg-amber-500 disabled:opacity-50 text-black font-medium px-4 py-2 text-sm"
        >
          {alertState === 'done'
            ? 'Alert set'
            : alertState === 'loading'
              ? 'Saving…'
              : 'Set alert'}
        </button>
        {alertMsg && (
          <p
            className={`text-xs mt-2 ${
              alertState === 'error' ? 'text-red-300' : 'text-white/50'
            }`}
          >
            {alertMsg}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="hvm2-horizontal-deck">
        {items.map((job) => {
          const family =
            ROLE_FAMILIES[job.role_family]?.label ?? job.role_family
          const salary = formatSalaryBand({
            min: job.salary_min,
            max: job.salary_max,
            currency: job.salary_currency,
            period: job.salary_period,
          })
          const employment =
            job.employment_type === 'full_time'
              ? 'Full-Time'
              : job.employment_type === 'part_time'
                ? 'Part-Time'
                : job.employment_type === 'contract'
                  ? 'Contract'
                  : job.employment_type

          return (
            <article
              key={job.id}
              className="hvm2-directory-card"
              role="button"
              tabIndex={0}
              onClick={() => setSelected(job)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelected(job)
              }}
            >
              <span>
                {family}
                {job.primary_jurisdiction
                  ? ` · ${job.primary_jurisdiction}`
                  : ''}
              </span>
              <h3>{job.title}</h3>
              <p>
                {job.organization_name || 'Organization'}
                {job.organization_location
                  ? ` · ${job.organization_location}`
                  : ''}
                {job.location_type === 'remote' ? ' · Remote' : ''}
              </p>
              <div className="hvm2-card-meta">
                <span>{employment}</span>
                {salary && <span>{salary}</span>}
              </div>
            </article>
          )
        })}
      </div>

      {selected && (
        <TalentJobDetail job={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
