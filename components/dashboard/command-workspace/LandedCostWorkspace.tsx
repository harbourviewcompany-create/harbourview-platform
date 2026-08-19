'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type Scenario = {
  id: string
  label: string
  description: string
  totalLandedPerKg: { low: number; high: number }
  deltaVsBaseMidPct: number | null
}

type ApiBody = {
  result: {
    totalLandedPerKg: { low: number; high: number }
    wholesaleTarget: { low: number; high: number } | null
    impliedMarginPct: { low: number; high: number } | null
    breakEvenVolumeKg: number | null
    available: boolean
  }
  scenarios?: Scenario[]
  assumptions?: {
    dutyBasis: string
    freightSource: string
    transitDays: number | null
    fixedCostsCalledOut: string[]
    modelLimits: string[]
  }
  labels?: { product: string; origin: string; destination: string }
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtRange(r: { low: number; high: number }) {
  return `${fmt(r.low)} – ${fmt(r.high)}`
}

export function LandedCostWorkspace({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const origin = (searchParams.get('origin') ?? 'CA').toUpperCase()
  const destination = (searchParams.get('destination') ?? 'DE').toUpperCase()
  const product = searchParams.get('product') ?? 'flower-premium'
  const volume = searchParams.get('volume') ?? '10'

  const [data, setData] = useState<ApiBody | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const setParams = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', 'trade-calc')
      params.set('section', 'financing')
      params.set('tool', 'landed-cost')
      for (const [k, v] of Object.entries(patch)) params.set(k, v)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const q = new URLSearchParams({ origin, destination, product, volume })
    fetch(`/api/landed-cost?${q.toString()}`)
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error ?? 'Estimate unavailable')
        return body as ApiBody
      })
      .then((body) => {
        if (!cancelled) setData(body)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setData(null)
          setError(e instanceof Error ? e.message : 'Unable to load estimate')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [origin, destination, product, volume])

  return (
    <section
      className="hvm2-workspace hvm2-corridor-workspace"
      data-mobile-command-tool="landed-cost"
      aria-label="Landed cost calculator"
      tabIndex={-1}
    >
      <header className="hvm2-workspace-header">
        <div>
          <span>Command Centre / Trade calculator</span>
          <h3>Landed cost + sensitivity</h3>
          <p>Orientation USD ranges — not a commercial quote.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close landed cost">
          Close
        </button>
      </header>

      <form
        className="cc-corridor-form"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          setParams({
            origin: String(fd.get('origin') ?? 'CA').toUpperCase(),
            destination: String(fd.get('destination') ?? 'DE').toUpperCase(),
            product: String(fd.get('product') ?? 'flower-premium'),
            volume: String(fd.get('volume') ?? '10'),
          })
        }}
      >
        <label>
          Origin
          <input name="origin" defaultValue={origin} maxLength={2} className="cc-corridor-input" />
        </label>
        <label>
          Destination
          <input
            name="destination"
            defaultValue={destination}
            maxLength={2}
            className="cc-corridor-input"
          />
        </label>
        <label>
          Product
          <select name="product" defaultValue={product} className="cc-corridor-input">
            <option value="flower-premium">Flower — Premium</option>
            <option value="flower-standard">Flower — Standard</option>
            <option value="oil">Oil / extract</option>
            <option value="biomass">Biomass</option>
            <option value="distillate">Distillate</option>
          </select>
        </label>
        <label>
          Volume (kg)
          <input
            name="volume"
            type="number"
            min={1}
            max={5000}
            defaultValue={volume}
            className="cc-corridor-input"
          />
        </label>
        <button type="submit" className="cc-corridor-submit">
          Recalculate
        </button>
      </form>

      <div className="cc-corridor-body">
        {loading && <p className="cc-corridor-muted">Calculating…</p>}
        {error && !loading && <p className="cc-corridor-error">{error}</p>}
        {data?.result?.available && !loading && (
          <>
            <div className="cc-corridor-summary">
              <h4>
                {data.labels?.origin ?? origin} → {data.labels?.destination ?? destination}
              </h4>
              <p className="cc-corridor-muted">{data.labels?.product}</p>
              <p className="cc-corridor-price">{fmtRange(data.result.totalLandedPerKg)} / kg</p>
              {data.result.wholesaleTarget && (
                <p className="cc-corridor-muted">
                  Wholesale target {fmtRange(data.result.wholesaleTarget)}
                  {data.result.impliedMarginPct &&
                    ` · margin ${data.result.impliedMarginPct.low.toFixed(0)}–${data.result.impliedMarginPct.high.toFixed(0)}%`}
                </p>
              )}
            </div>

            {data.scenarios && data.scenarios.length > 0 && (
              <section className="cc-corridor-block">
                <h4>Sensitivity</h4>
                <ul>
                  {data.scenarios.map((s) => (
                    <li key={s.id}>
                      <strong>{s.label}</strong> {fmtRange(s.totalLandedPerKg)}
                      {s.deltaVsBaseMidPct != null && s.id !== 'base'
                        ? ` (${s.deltaVsBaseMidPct > 0 ? '+' : ''}${s.deltaVsBaseMidPct.toFixed(1)}% mid)`
                        : ''}
                      <span className="cc-corridor-muted"> — {s.description}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.assumptions && (
              <section className="cc-corridor-block">
                <h4>Assumptions</h4>
                <ul>
                  <li>{data.assumptions.dutyBasis}</li>
                  <li>
                    Freight: {data.assumptions.freightSource}
                    {data.assumptions.transitDays != null
                      ? ` · ~${data.assumptions.transitDays}d`
                      : ''}
                  </li>
                  {data.assumptions.modelLimits.map((m) => (
                    <li key={m.slice(0, 32)}>{m}</li>
                  ))}
                </ul>
              </section>
            )}

            <div className="cc-corridor-links">
              <button
                type="button"
                className="cc-corridor-link"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', 'logistics')
                  params.set('section', 'supply')
                  params.set('tool', 'corridor-plan')
                  params.set('origin', origin)
                  params.set('destination', destination)
                  router.replace(`${pathname}?${params.toString()}`, { scroll: false })
                }}
              >
                Corridor execution plan →
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
