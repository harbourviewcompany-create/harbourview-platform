'use client'

/**
 * Live talent list for mobile Command Talent section.
 * Fetches published opportunities from /api/talent.
 * Keeps the existing horizontal-deck visual language when possible.
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
        <p className="text-sm text-white/45">
          {jurisdiction
            ? `No published roles in ${jurisdiction} yet. Broaden jurisdiction or check back soon.`
            : 'Published roles will appear here after review. Check back soon.'}
        </p>
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
