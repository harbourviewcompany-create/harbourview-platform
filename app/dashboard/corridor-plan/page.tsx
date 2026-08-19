import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import {
  deriveCorridorPlan,
  listTrackedCorridorPairs,
} from '@/lib/intelligence/workflowEngine'
import type { ProductClass } from '@/lib/intelligence/tradeCorridors'
import { PRODUCT_OPTIONS } from '@/lib/intelligence/tradeCorridors'

export const metadata: Metadata = {
  title: 'Corridor Plan · Command Centre | Harbourview',
  description: 'Authenticated corridor execution plan — merged playbooks, checklist, trust metadata.',
}

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

export default async function DashboardCorridorPlanPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login?next=/dashboard/corridor-plan')

  const sp = await searchParams
  const origin = (first(sp.origin) ?? 'CA').toUpperCase()
  const destination = (first(sp.destination) ?? 'DE').toUpperCase()
  const product = (first(sp.product) ?? 'any') as ProductClass | 'any'
  const pairs = listTrackedCorridorPairs()
  const plan =
    origin !== destination
      ? await deriveCorridorPlan(origin, destination, { productClass: product })
      : null

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-zinc-100">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-500/90">Command Centre</p>
          <h1 className="mt-1 text-2xl font-semibold">Corridor execution plan</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-amber-400">
          ← Dashboard
        </Link>
      </div>

      <form method="get" className="flex flex-wrap gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Origin
          <input
            name="origin"
            defaultValue={origin}
            maxLength={2}
            className="w-20 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm uppercase"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Destination
          <input
            name="destination"
            defaultValue={destination}
            maxLength={2}
            className="w-20 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm uppercase"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Product
          <select
            name="product"
            defaultValue={product}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm"
          >
            {PRODUCT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="self-end rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-zinc-950">
          Build
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {pairs.slice(0, 6).map((p) => (
          <Link
            key={`${p.from}-${p.to}`}
            href={`/dashboard/corridor-plan?origin=${p.from}&destination=${p.to}&product=${product}`}
            className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-300 hover:border-amber-600"
          >
            {p.label}
          </Link>
        ))}
      </div>

      {!plan ? (
        <p className="mt-8 text-sm text-zinc-500">
          No published playbooks for this pair. Try a tracked corridor above, or open the{' '}
          <Link href="/intelligence/logistics-simulator" className="text-amber-400 underline">
            logistics simulator
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          <section className="rounded-xl border border-zinc-800 p-5">
            <h2 className="text-lg font-medium">
              {plan.origin.name} → {plan.destination.name}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Trust: {plan.trust.confidenceLabel} · {Math.round(plan.trust.confidence * 100)}% · as of{' '}
              {plan.trust.asOf}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-zinc-500">Sequential</dt>
                <dd>{plan.totalSequentialWeeks} wk</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Critical path (est.)</dt>
                <dd>{plan.criticalPathWeeksEstimate} wk</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Origin</dt>
                <dd>{plan.origin.difficulty}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Destination</dt>
                <dd>{plan.destination.difficulty}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-zinc-500">{plan.trust.disclaimer}</p>
          </section>

          {plan.notes.length > 0 && (
            <section className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-5">
              <h3 className="text-sm font-semibold text-amber-400/90">Corridor notes</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                {plan.notes.map((n) => (
                  <li key={n.slice(0, 40)}>{n}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-zinc-800 p-5">
            <h3 className="font-medium">Documentation checklist</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {plan.documentationChecklist.map((item) => (
                <li key={item.id} className="flex gap-2 border-b border-zinc-800/60 pb-2">
                  <span className="text-xs uppercase text-zinc-500">{item.side}</span>
                  <span>
                    {item.label}
                    {item.required && <span className="ml-1 text-xs text-amber-500">required</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-800 p-5">
            <h3 className="font-medium">Steps ({plan.steps.length})</h3>
            <ol className="mt-3 space-y-3">
              {plan.steps.map((s) => (
                <li key={`${s.side}-${s.step}-${s.title}`} className="text-sm">
                  <span className="text-xs uppercase text-zinc-500">
                    {s.side} · {s.country_iso2}
                  </span>{' '}
                  <span className="font-medium text-zinc-200">
                    {s.step}. {s.title}
                  </span>{' '}
                  <span className="text-zinc-500">~{s.estimated_weeks} wk</span>
                  <p className="mt-0.5 text-zinc-400">{s.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <p className="text-center text-xs text-zinc-600">
            <Link href="/intelligence/corridor-plan" className="underline">
              Public corridor plan
            </Link>
            {' · '}
            <Link href="/intelligence/logistics-simulator" className="underline">
              Logistics simulator
            </Link>
            {' · '}
            <Link href="/intake" className="underline">
              Confidential intake
            </Link>
          </p>
        </div>
      )}
    </main>
  )
}
