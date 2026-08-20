'use client'

import { useState } from 'react'

type CheckResult = {
  destinationCountryIso2: string
  matchKind: 'same-brand' | 'equivalent-profile' | 'no-match' | 'no-input'
  portabilityVerdict:
    | 'likely-portable'
    | 'profile-equivalent-available'
    | 'not-currently-available'
    | 'insufficient-input'
  matchedProductName: string | null
  matchedAuthorizationStatus: string | null
  supplyRiskLevel: string | null
  supplySignalHeadline: string | null
  supplySignalSourceUrl: string | null
}

type CheckResponse = { state: 'loaded' | 'error'; result: CheckResult | null; error?: string }

const VERDICT_COPY: Record<CheckResult['portabilityVerdict'], { label: string; tone: string }> = {
  'likely-portable': { label: 'Same product likely available', tone: 'text-emerald-300/90' },
  'profile-equivalent-available': { label: 'Equivalent profile available, different product', tone: 'text-[#d4a853]' },
  'not-currently-available': { label: 'No equivalent formulary entry found', tone: 'text-amber-300/90' },
  'insufficient-input': { label: 'Not enough product detail to check', tone: 'text-white/45' },
}

/**
 * Per-product cross-border portability check. Self-contained: manages its own
 * destination-country input and fetch, renders inline below the product it
 * belongs to. Uses the product's own cannabinoidProfile/brandName as the
 * source identity, so no prop-drilling or lifted state is needed — keeps the
 * diff on the actively-developed formulary grid to a single insertion line.
 */
export default function CrossBorderCheck({
  brandName,
  cannabinoidProfile,
}: {
  brandName?: string | null
  cannabinoidProfile: string
}) {
  const [destination, setDestination] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const runCheck = async () => {
    const country = destination.trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(country)) return
    setStatus('loading')
    setResult(null)
    try {
      const params = new URLSearchParams({ destination: country, profile: cannabinoidProfile })
      if (brandName) params.set('brand', brandName)
      const res = await fetch(`/api/clinical/cross-border-check?${params.toString()}`, { cache: 'no-store' })
      const body: CheckResponse = await res.json()
      if (body.state === 'loaded' && body.result) {
        setResult(body.result)
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="mt-2 border-t border-white/8 pt-2">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value.slice(0, 2))}
          onKeyDown={(e) => e.key === 'Enter' && runCheck()}
          placeholder="Country e.g. DE"
          maxLength={2}
          aria-label="Destination country code"
          className="w-24 rounded border border-white/12 bg-white/[0.03] px-2 py-1 text-[11px] uppercase text-white/75 placeholder:text-white/30 placeholder:normal-case"
        />
        <button
          type="button"
          onClick={runCheck}
          disabled={status === 'loading' || destination.trim().length !== 2}
          className="rounded border border-white/12 bg-white/[0.03] px-2 py-1 text-[11px] text-white/65 disabled:opacity-40"
        >
          {status === 'loading' ? 'Checking…' : 'Check destination'}
        </button>
      </div>

      {status === 'error' && <p className="mt-1.5 text-[11px] text-white/35">Couldn't complete the check.</p>}

      {result && status === 'done' && (
        <div className="mt-1.5 text-[11px] leading-relaxed">
          <p className={VERDICT_COPY[result.portabilityVerdict].tone}>
            {VERDICT_COPY[result.portabilityVerdict].label}
            {result.matchedProductName && ` — ${result.matchedProductName}`}
          </p>
          {result.supplyRiskLevel && result.supplyRiskLevel !== 'insufficient-data' && (
            <p className="mt-0.5 text-white/40">
              {result.destinationCountryIso2} supply signal: {result.supplyRiskLevel}
              {result.supplySignalHeadline && ` — ${result.supplySignalHeadline}`}
              {result.supplySignalSourceUrl && (
                <a href={result.supplySignalSourceUrl} target="_blank" rel="noreferrer" className="ml-1 text-[#d4a853]">
                  ↗
                </a>
              )}
            </p>
          )}
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/25">
            Informational only, not a legal or clinical determination.
          </p>
        </div>
      )}
    </div>
  )
}
