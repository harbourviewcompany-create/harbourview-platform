import type { Metadata } from 'next'
import Link from 'next/link'
import {
  TRADE_CORRIDORS,
  filterCorridors,
  PRODUCT_OPTIONS,
  COMPLIANCE_OPTIONS,
  type ProductClass,
  type ComplianceProfile,
} from '@/lib/intelligence/tradeCorridors'
import { corridorPlanHref } from '@/lib/intelligence/corridorSimulator'
import { landedCostHref } from '@/lib/intelligence/landedCostBridge'

export const metadata: Metadata = {
  title: 'Logistics Corridor Simulator | Harbourview',
  description:
    'Filter regulated cannabis trade corridors by product class, compliance path, and risk. Orientation-level only — open merged execution plans without operator identities or commercial terms.',
}

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

export default async function LogisticsSimulatorPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const product = (first(sp.product) ?? 'any') as ProductClass | 'any'
  const compliance = (first(sp.compliance) ?? 'any') as ComplianceProfile | 'any'
  const from = first(sp.from) ?? 'any'
  const to = first(sp.to) ?? 'any'
  const maxRiskRaw = first(sp.maxRisk)
  const maxRisk = maxRiskRaw ? Number(maxRiskRaw) : undefined

  const matched = filterCorridors(TRADE_CORRIDORS, {
    product,
    compliance,
    from: from === 'any' ? undefined : from,
    to: to === 'any' ? undefined : to,
    maxRisk: Number.isFinite(maxRisk) ? maxRisk : undefined,
  })

  const origins = Array.from(new Set(TRADE_CORRIDORS.map((c) => c.from))).sort()
  const destinations = Array.from(new Set(TRADE_CORRIDORS.map((c) => c.to))).sort()

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-zinc-100">
      <nav className="mb-8 text-xs text-zinc-500">
        <Link href="/intelligence" className="text-amber-500 hover:underline">
          Intelligence
        </Link>
        <span className="mx-2">›</span>
        <Link href="/intelligence/logistics-trade-routes" className="text-zinc-400 hover:underline">
          Logistics
        </Link>
        <span className="mx-2">›</span>
        <span>Simulator</span>
      </nav>

      <p className="text-xs uppercase tracking-widest text-amber-500/90">Logistics · Simulator</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Corridor simulator</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
        Filter tracked corridors by product, compliance path, endpoints, and risk. Open an execution
        plan or landed-cost estimate. Orientation-level only — no operator identities or commercial
        terms.
      </p>

      <form
        method="get"
        className="mt-8 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Product
          <select
            name="product"
            defaultValue={product}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            {PRODUCT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Compliance
          <select
            name="compliance"
            defaultValue={compliance}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            {COMPLIANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Max risk (1–5)
          <select
            name="maxRisk"
            defaultValue={maxRiskRaw ?? ''}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                ≤ {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          From
          <select
            name="from"
            defaultValue={from}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="any">Any origin</option>
            {origins.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          To
          <select
            name="to"
            defaultValue={to}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="any">Any destination</option>
            {destinations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500"
          >
            Apply filters
          </button>
        </div>
      </form>

      <p className="mt-6 text-sm text-zinc-500">
        {matched.length} corridor{matched.length === 1 ? '' : 's'} matched
      </p>

      <ul className="mt-4 space-y-3">
        {matched.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-medium text-zinc-100">{c.label}</h2>
              <span className="text-xs text-zinc-500">
                Risk {c.riskScore}/5 · {c.riskLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{c.notes}</p>
            <p className="mt-2 text-xs text-zinc-500">
              Products: {c.productClasses.join(', ')} · Compliance: {c.compliance.join(', ')}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link
                href={corridorPlanHref(c.from, c.to, product === 'any' ? undefined : product)}
                className="text-amber-400 hover:underline"
              >
                Execution plan →
              </Link>
              <Link
                href={landedCostHref({
                  origin: c.from,
                  destination: c.to,
                  product: product === 'any' ? 'flower' : product,
                })}
                className="text-amber-400/80 hover:underline"
              >
                Landed cost →
              </Link>
              <Link
                href={`/dashboard/corridor-plan?origin=${c.from}&destination=${c.to}`}
                className="text-zinc-400 hover:underline"
              >
                Open in dashboard →
              </Link>
            </div>
          </li>
        ))}
      </ul>

      {matched.length === 0 && (
        <p className="mt-8 text-sm text-zinc-500">No corridors match these filters. Broaden product or risk.</p>
      )}

      <p className="mt-12 text-center text-xs text-zinc-600">
        <Link href="/intelligence/logistics-trade-routes" className="underline">
          Full logistics & trade routes
        </Link>
        {' · '}
        <Link href="/intelligence/corridor-plan" className="underline">
          Corridor execution plans
        </Link>
        {' · '}
        <Link href="/intelligence/landed-cost" className="underline">
          Landed cost calculator
        </Link>
      </p>
    </main>
  )
}
