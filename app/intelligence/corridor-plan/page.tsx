import type { Metadata } from 'next'
import Link from 'next/link'
import {
  deriveCorridorPlan,
  listTrackedCorridorPairs,
} from '@/lib/intelligence/workflowEngine'
import type { ProductClass } from '@/lib/intelligence/tradeCorridors'
import { PRODUCT_OPTIONS } from '@/lib/intelligence/tradeCorridors'
import { landedCostHref } from '@/lib/intelligence/landedCostBridge'

export const metadata: Metadata = {
  title: 'Corridor Execution Plan | Harbourview',
  description:
    'Orientation-level regulated cannabis corridor plans — merged export/import playbooks, documentation checklist, timeline heuristic, and trust metadata. No operator identities or commercial terms.',
}

export const dynamic = 'force-dynamic'

const DEFAULT_ORIGIN = 'CA'
const DEFAULT_DEST = 'DE'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

export default async function CorridorPlanPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const origin = (first(sp.origin) ?? DEFAULT_ORIGIN).toUpperCase()
  const destination = (first(sp.destination) ?? DEFAULT_DEST).toUpperCase()
  const product = (first(sp.product) ?? 'any') as ProductClass | 'any'

  const pairs = listTrackedCorridorPairs()
  const plan =
    origin !== destination
      ? await deriveCorridorPlan(origin, destination, { productClass: product })
      : null

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-zinc-100">
      <p className="text-xs uppercase tracking-widest text-amber-500/90">Intelligence · Corridor plan</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Corridor execution plan</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
        Merged export + import playbooks for a regulated corridor. Orientation-level only —
        verify every requirement with competent authorities before acting. Harbourview does not
        publish operator identities or commercial terms here.
      </p>

      <form method="get" className="mt-8 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Origin (ISO2)
          <input
            name="origin"
            defaultValue={origin}
            maxLength={2}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 uppercase"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Destination (ISO2)
          <input
            name="destination"
            defaultValue={destination}
            maxLength={2}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 uppercase"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Product class
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
        <button
          type="submit"
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500"
        >
          Build plan
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {pairs.slice(0, 8).map((p) => (
          <Link
            key={`${p.from}-${p.to}`}
            href={`/intelligence/corridor-plan?origin=${p.from}&destination=${p.to}&product=${product}`}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-amber-600/60 hover:text-amber-200"
          >
            {p.label}
          </Link>
        ))}
      </div>

      {!plan ? (
        <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-400">
          No published playbooks for <strong className="text-zinc-200">{origin} → {destination}</strong>
          {product !== 'any' ? ` with product class ${product}` : ''}. Try a tracked pair above, or
          open{' '}
          <Link href="/intelligence/logistics-simulator" className="text-amber-400 underline">
            logistics simulator
          </Link>{' '}
          /{' '}
          <Link href="/intelligence/logistics-trade-routes" className="text-amber-400 underline">
            trade routes
          </Link>
          .
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-xl font-medium">
                {plan.origin.name} → {plan.destination.name}
              </h2>
              <span className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-300">
                Trust: {plan.trust.confidenceLabel} · {Math.round(plan.trust.confidence * 100)}% · as
                of {plan.trust.asOf}
              </span>
            </div>
            {plan.corridorRef && (
              <p className="mt-2 text-sm text-zinc-400">
                Tracked corridor risk: {plan.corridorRef.riskLabel} (score {plan.corridorRef.riskScore}
                /5). {plan.corridorRef.notes}
              </p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">{plan.trust.disclaimer}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-zinc-500">Sequential weeks</dt>
                <dd className="font-medium text-zinc-100">{plan.totalSequentialWeeks}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Critical-path estimate</dt>
                <dd className="font-medium text-zinc-100">{plan.criticalPathWeeksEstimate}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Origin difficulty</dt>
                <dd className="font-medium text-zinc-100">{plan.origin.difficulty}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Destination difficulty</dt>
                <dd className="font-medium text-zinc-100">{plan.destination.difficulty}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link
                href={landedCostHref({ origin, destination, product })}
                className="text-amber-400 hover:underline"
              >
                Estimate landed cost →
              </Link>
              <Link
                href={`/intelligence/logistics-simulator?from=${origin}&to=${destination}`}
                className="text-zinc-400 hover:underline"
              >
                Logistics simulator →
              </Link>
              <Link
                href={`/dashboard/corridor-plan?origin=${origin}&destination=${destination}&product=${product}`}
                className="text-zinc-400 hover:underline"
              >
                Open in dashboard →
              </Link>
            </div>
          </section>

          {plan.notes.length > 0 && (
            <section className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-400/90">
                Corridor-specific notes
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                {plan.notes.map((n) => (
                  <li key={n.slice(0, 48)}>{n}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-zinc-800 p-6">
            <h3 className="text-lg font-medium">Documentation checklist</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Generic stubs — not a substitute for counsel or authority forms.
            </p>
            <ul className="mt-4 space-y-2">
              {plan.documentationChecklist.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 text-sm"
                >
                  <span className="mt-0.5 text-xs uppercase text-zinc-500">{item.side}</span>
                  <div>
                    <p className="text-zinc-200">
                      {item.label}
                      {item.required ? (
                        <span className="ml-2 text-xs text-amber-500">required</span>
                      ) : (
                        <span className="ml-2 text-xs text-zinc-500">optional</span>
                      )}
                    </p>
                    {item.notes && <p className="text-xs text-zinc-500">{item.notes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-800 p-6">
            <h3 className="text-lg font-medium">Process steps</h3>
            <ol className="mt-4 space-y-3">
              {plan.steps.map((s) => (
                <li
                  key={`${s.side}-${s.step}-${s.title}`}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-100">
                      <span className="mr-2 text-xs uppercase text-zinc-500">
                        {s.side} · {s.country_iso2}
                      </span>
                      {s.step}. {s.title}
                    </p>
                    <span className="text-xs text-zinc-500">~{s.estimated_weeks} wk</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl border border-zinc-800 p-6">
            <h3 className="text-lg font-medium">Regulators & risks</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {plan.regulators.map((block) => (
                <div key={block.country_iso2} className="rounded-lg border border-zinc-800/80 p-3">
                  <p className="text-xs uppercase text-zinc-500">{block.country_iso2} regulators</p>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                    {block.regulators.map((r) => (
                      <li key={`${r.name}-${r.role}`}>
                        {r.name}
                        <span className="text-zinc-500"> — {r.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {plan.risks.map((block) => (
                <div key={`risk-${block.country_iso2}`} className="rounded-lg border border-zinc-800/80 p-3">
                  <p className="text-xs uppercase text-zinc-500">{block.country_iso2} pitfalls</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-300">
                    {block.pitfalls.map((p) => (
                      <li key={p.slice(0, 40)}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-6 text-center">
            <h3 className="text-lg font-medium">Private corridor analysis</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Counterparty introduction, documentation review, and confidential corridor viability
              are handled through reviewed intake — not this public surface.
            </p>
            <Link
              href="/intake"
              className="mt-4 inline-block rounded-md bg-amber-600 px-5 py-2.5 text-sm font-medium text-zinc-950 hover:bg-amber-500"
            >
              Start confidential intake
            </Link>
          </section>
        </div>
      )}

      <p className="mt-12 text-center text-xs text-zinc-600">
        Related:{' '}
        <Link href="/intelligence/landed-cost" className="underline">
          Landed cost
        </Link>{' '}
        ·{' '}
        <Link href="/intelligence/logistics-simulator" className="underline">
          Logistics simulator
        </Link>{' '}
        ·{' '}
        <Link href="/intelligence/logistics-trade-routes" className="underline">
          Trade routes
        </Link>{' '}
        ·{' '}
        <Link href="/dashboard" className="underline">
          Command Centre
        </Link>
      </p>
    </main>
  )
}
