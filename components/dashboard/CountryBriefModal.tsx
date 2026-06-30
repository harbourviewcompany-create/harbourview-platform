'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useCountryBrief } from '@/hooks/useCountryBrief'
import { StatusBadge } from './StatusBadge'

interface Props {
  iso2: string | null
  name: string | null
  onClose: () => void
}

export function CountryBriefModal({ iso2, name, onClose }: Props) {
  const brief = useCountryBrief(iso2)

  useEffect(() => {
    if (!iso2) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [iso2, onClose])

  if (!iso2) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(3,7,13,0.9)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[540px] max-h-[580px] overflow-y-auto rounded-2xl mx-4"
        style={{ background: 'var(--hv-bg-900, #06101B)', border: '1px solid rgba(198,165,90,0.22)' }}
      >
        {/* Head */}
        <div
          className="sticky top-0 px-5 py-5"
          style={{ background: 'var(--hv-bg-900)', borderBottom: '1px solid rgba(198,165,90,0.18)' }}
        >
          <button
            onClick={onClose}
            className="float-right text-lg transition-opacity hover:opacity-60"
            style={{ color: 'rgba(243,240,234,0.4)' }}
            aria-label="Close"
          >✕</button>
          <p className="mb-1 text-[9px] uppercase tracking-[0.18em]" style={{ color: 'var(--hv-champagne-400)' }}>
            Market brief · Harbourview
          </p>
          <h2 className="font-serif text-[26px] leading-tight" style={{ color: 'var(--hv-text-primary)' }}>
            {name}
          </h2>
          {brief.status === 'ok' && brief.data.market_access_status && (
            <p className="mt-1 text-[11px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-300)' }}>
              {brief.data.market_access_status}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3.5 p-5">
          {brief.status === 'loading' && (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-10 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          )}

          {brief.status === 'ok' && (
            <>
              {/* Status grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Medical access',  value: brief.data.medical_status },
                  { label: 'Adult-use',       value: brief.data.adult_use_status },
                  { label: 'Import pathway',  value: brief.data.import_status },
                  { label: 'Export pathway',  value: brief.data.export_status },
                ].map(({ label, value }) => value && (
                  <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="mb-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>{label}</p>
                    <StatusBadge label={value} />
                  </div>
                ))}
              </div>

              {/* Regulator + summary */}
              {(brief.data.regulator_label || brief.data.public_summary) && (
                <div
                  className="rounded-xl border-l-2 p-3.5 text-[12px] leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.025)', borderLeftColor: 'rgba(198,165,90,0.3)', color: 'rgba(243,240,234,0.6)' }}
                >
                  {brief.data.regulator_label && (
                    <span style={{ color: 'rgba(198,165,90,0.7)' }}>{brief.data.regulator_label} · </span>
                  )}
                  {brief.data.public_summary}
                </div>
              )}

              {/* Actions */}
              <div className="mt-1 flex gap-2">
                <Link
                  href="/dashboard?page=marketplace"
                  className="flex-1 rounded-xl py-2.5 text-center text-[12px] transition-all"
                  style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}
                >
                  Post listing →
                </Link>
                <Link
                  href="/dashboard?page=countries"
                  className="flex-1 rounded-xl py-2.5 text-center text-[12px] transition-all"
                  style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}
                >
                  Country briefs →
                </Link>
                <button
                  onClick={onClose}
                  className="rounded-xl px-4 py-2.5 text-[12px] transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.45)' }}
                >
                  Close
                </button>
              </div>
            </>
          )}

          {brief.status === 'error' && (
            <p className="text-[12px]" style={{ color: 'rgba(243,240,234,0.4)' }}>
              No public alpha brief is available for this market yet. {' '}
              <Link href="/dashboard?page=countries" className="underline" style={{ color: 'var(--hv-champagne-400)' }}>
                Browse tracked country briefs →
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
