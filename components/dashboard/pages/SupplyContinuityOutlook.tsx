'use client'

import { useEffect, useState } from 'react'

type SupplyOutlook = {
  countryIso2: string
  riskLevel: 'elevated' | 'watch' | 'normal' | 'insufficient-data'
  signalCount90d: number
  topCategory: string | null
  mostRecentHeadline: string | null
  mostRecentSourceUrl: string | null
  mostRecentSignalAt: string | null
}

type OutlookResponse = { state: 'loaded' | 'empty' | 'error'; outlook: SupplyOutlook | null }

const RISK_STYLE: Record<SupplyOutlook['riskLevel'], { label: string; dot: string; text: string }> = {
  elevated: { label: 'Elevated supply signal activity', dot: 'bg-amber-400', text: 'text-amber-300' },
  watch: { label: 'Some recent supply signal activity', dot: 'bg-[#d4a853]', text: 'text-[#d4a853]' },
  normal: { label: 'No notable supply signal activity', dot: 'bg-emerald-400/80', text: 'text-emerald-300/80' },
  'insufficient-data': { label: 'No supply signal coverage yet', dot: 'bg-white/25', text: 'text-white/45' },
}

/**
 * Jurisdiction supply-continuity outlook — surfaces Harbourview's proprietary
 * market-intelligence signal pipeline (regulatory/supply/commercial activity)
 * scoped to one country, via /api/clinical/supply-outlook. Self-contained and
 * fails silently (renders nothing) rather than disrupting the surrounding
 * formulary view on any error, since this is supplementary context, not a
 * clinical determination.
 */
export default function SupplyContinuityOutlook({ jurisdiction }: { jurisdiction: string }) {
  const country = jurisdiction.trim().toUpperCase().split('-')[0]
  const [outlook, setOutlook] = useState<SupplyOutlook | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    setOutlook(null)
    if (!/^[A-Z]{2}$/.test(country)) return
    fetch(`/api/clinical/supply-outlook?country=${country}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((body: OutlookResponse) => {
        if (cancelled) return
        setOutlook(body.state === 'loaded' ? body.outlook : null)
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [country])

  if (!loaded || !outlook) return null

  const style = RISK_STYLE[outlook.riskLevel]

  return (
    <div className="mb-4 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-xs" role="status">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
        <span className={`font-medium ${style.text}`}>{style.label}</span>
        <span className="text-white/35">· {country} formulary · last 90 days</span>
      </div>
      {outlook.mostRecentHeadline && (
        <p className="mt-1.5 leading-relaxed text-white/55">
          {outlook.mostRecentHeadline}
          {outlook.mostRecentSourceUrl && (
            <a
              href={outlook.mostRecentSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-1.5 text-[#d4a853]"
            >
              Source ↗
            </a>
          )}
        </p>
      )}
      <p className="mt-1 text-[10px] uppercase tracking-wide text-white/25">
        Market-intelligence context, not a clinical or regulatory determination.
      </p>
    </div>
  )
}
