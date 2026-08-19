import type { Metadata } from 'next'
import Link from 'next/link'
import {
  calcLandedCost,
  EXPORTER_ORIGINS,
  DESTINATION_MARKETS,
  FREIGHT_CORRIDORS,
  LANDED_PRODUCT_LABELS,
  type LandedProductType,
} from '@/components/dashboard/data/landedCostData'
import { corridorPlanHref } from '@/lib/intelligence/corridorSimulator'
import { LANDED_PRODUCT_OPTIONS } from '@/lib/intelligence/landedCostBridge'
import {
  buildLandedAssumptions,
  buildSensitivityScenarios,
} from '@/lib/intelligence/landedCostSensitivity'
import { OrientationFeedback } from '@/components/intelligence/OrientationFeedback'

export const metadata: Metadata = {
  title: 'Landed Cost Calculator | Harbourview',
  description:
    'Orientation landed-cost ranges with sensitivity (freight, volume, production) and explicit model assumptions. Not a commercial quote.',
}

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtRange(r: { low: number; high: number }): string {
  return `${fmt(r.low)} – ${fmt(r.high)}`
}

export default async function LandedCostPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const origin = (first(sp.origin) ?? 'CA').toUpperCase()
  const destination = (first(sp.destination) ?? 'DE').toUpperCase()
  const productRaw = (first(sp.product) ?? 'flower-premium') as LandedProductType
  const product = productRaw in LANDED_PRODUCT_LABELS ? productRaw : 'flower-premium'
  const volumeRaw = Number(first(sp.volume) ?? '10')
  const volumeKg = Number.isFinite(volumeRaw) && volumeRaw > 0 ? Math.min(5000, volumeRaw) : 10

  const result = calcLandedCost(origin, destination, product, volumeKg)
  const originMeta = EXPORTER_ORIGINS.find((o) => o.iso2 === origin)
  const destMeta = DESTINATION_MARKETS.find((d) => d.iso2 === destination)
  const freight = FREIGHT_CORRIDORS.find(
    (c) => c.originIso2 === origin && c.destIso2 === destination,
  )
  const assumptions = result.available
    ? buildLandedAssumptions(origin, destination, product, result)
    : null
  const scenarios = result.available
    ? buildSensitivityScenarios(origin, destination, product, volumeKg, result)
    : []

  const lineItems: { label: string; range: { low: number; high: number } }[] = [
    { label: 'Production (ex-works ref.)', range: result.productionCostPerKg },
    { label: 'Export permit (amortised)', range: result.exportPermitPerKg },
    { label: 'Export documentation', range: result.exportDocPerKg },
    { label: 'Air freight', range: result.freightPerKg },
    { label: 'Narcotics / security surcharge', range: result.narcoticsSurchargePerKg },
    { label: 'Import permit (amortised)', range: result.importPermitPerKg },
    { label: 'Customs clearance', range: result.customsClearancePerKg },
    { label: 'Duty', range: result.dutyPerKg },
    { label: 'In-market GDP distribution', range: result.gdpDistributionPerKg },
    { label: 'Batch testing (amortised)', range: result.testingPerKg },
  ]

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-zinc-100">
      <p className="text-xs uppercase tracking-widest text-amber-500/90">Trade economics</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Landed cost calculator</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
        Orientation USD ranges plus sensitivity scenarios and explicit model assumptions — not a
        quote.
      </p>

      <form
        method="get"
        className="mt-8 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Origin
          <select
            name="origin"
            defaultValue={origin}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            {EXPORTER_ORIGINS.map((o) => (
              <option key={o.iso2} value={o.iso2}>
                {o.label} ({o.iso2})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Destination
          <select
            name="destination"
            defaultValue={destination}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            {DESTINATION_MARKETS.map((d) => (
              <option key={d.iso2} value={d.iso2}>
                {d.label} ({d.iso2})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Product
          <select
            name="product"
            defaultValue={product}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            {LANDED_PRODUCT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Volume (kg)
          <input
            name="volume"
            type="number"
            min={1}
            max={5000}
            step={1}
            defaultValue={volumeKg}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <div className="sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500"
          >
            Recalculate
          </button>
        </div>
      </form>

      {!result.available ? (
        <p className="mt-8 text-sm text-zinc-500">
          Product not in the reference export set for this origin, or pair outside published tables.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
            <h2 className="text-lg font-medium">
              {originMeta?.label ?? origin} → {destMeta?.label ?? destination}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {LANDED_PRODUCT_LABELS[product]} · {volumeKg} kg
            </p>
            <p className="mt-4 text-2xl font-semibold text-amber-400/90">
              {fmtRange(result.totalLandedPerKg)}
              <span className="ml-2 text-sm font-normal text-zinc-500">per kg landed</span>
            </p>
            {result.wholesaleTarget && (
              <p className="mt-2 text-sm text-zinc-400">
                Wholesale target: {fmtRange(result.wholesaleTarget)}
                {result.impliedMarginPct && (
                  <>
                    {' · '}Margin band: {result.impliedMarginPct.low.toFixed(0)}% –{' '}
                    {result.impliedMarginPct.high.toFixed(0)}%
                  </>
                )}
              </p>
            )}
            {result.breakEvenVolumeKg != null && (
              <p className="mt-1 text-xs text-zinc-500">
                Rough break-even volume: ~{result.breakEvenVolumeKg} kg / shipment
              </p>
            )}
            {freight?.notes && (
              <p className="mt-2 text-xs text-zinc-500">
                {freight.notes} · ~{freight.transitDays} days transit
              </p>
            )}
          </section>

          <section className="rounded-xl border border-zinc-800 p-5">
            <h3 className="font-medium">Sensitivity</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Same model under stress — still orientation, not a forecast.
            </p>
            <ul className="mt-3 divide-y divide-zinc-800/80 text-sm">
              {scenarios.map((s) => (
                <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <div>
                    <span className="text-zinc-200">{s.label}</span>
                    <span className="ml-2 text-xs text-zinc-500">{s.description}</span>
                  </div>
                  <div className="tabular-nums text-zinc-300">
                    {fmtRange(s.totalLandedPerKg)}
                    {s.deltaVsBaseMidPct != null && s.id !== 'base' && (
                      <span className="ml-2 text-xs text-zinc-500">
                        {s.deltaVsBaseMidPct > 0 ? '+' : ''}
                        {s.deltaVsBaseMidPct.toFixed(1)}% mid
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-800 p-5">
            <h3 className="font-medium">Cost stack (per kg)</h3>
            <ul className="mt-3 divide-y divide-zinc-800/80 text-sm">
              {lineItems.map((row) => (
                <li key={row.label} className="flex justify-between gap-4 py-2">
                  <span className="text-zinc-400">{row.label}</span>
                  <span className="tabular-nums text-zinc-200">{fmtRange(row.range)}</span>
                </li>
              ))}
            </ul>
          </section>

          {assumptions && (
            <section className="rounded-xl border border-zinc-800 p-5">
              <h3 className="font-medium">Model assumptions</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-400">
                <li>{assumptions.dutyBasis}</li>
                <li>
                  Freight source: {assumptions.freightSource}
                  {assumptions.transitDays != null
                    ? ` · ~${assumptions.transitDays} days reference transit`
                    : ''}
                </li>
                {assumptions.fixedCostsCalledOut.map((f) => (
                  <li key={f}>Fixed cost in model: {f}</li>
                ))}
                {assumptions.modelLimits.map((m) => (
                  <li key={m.slice(0, 40)}>{m}</li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap gap-4 text-sm">
            <Link href={corridorPlanHref(origin, destination)} className="text-amber-400 hover:underline">
              Corridor execution plan →
            </Link>
            <Link href="/intake" className="text-zinc-400 hover:underline">
              Confidential intake →
            </Link>
          </div>

          <OrientationFeedback
            surface="landed_cost"
            context={`${origin}-${destination}-${product}-${volumeKg}`}
          />
        </div>
      )}
    </main>
  )
}
