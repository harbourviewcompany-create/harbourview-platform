import type { Metadata } from 'next'
import Link from 'next/link'
import { getCorridorCoverageReport } from '@/lib/intelligence/corridorCoverage'
import { corridorPlanHref } from '@/lib/intelligence/corridorSimulator'
import { landedCostHref } from '@/lib/intelligence/landedCostBridge'
import { OrientationFeedback } from '@/components/intelligence/OrientationFeedback'

export const metadata: Metadata = {
  title: 'Corridor coverage | Harbourview',
  description:
    'Which tracked trade corridors have published playbooks on both ends and can build an execution plan. Orientation transparency only.',
}

export const dynamic = 'force-dynamic'

export default async function CorridorCoveragePage() {
  const report = await getCorridorCoverageReport()

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-zinc-100">
      <nav className="mb-8 text-xs text-zinc-500">
        <Link href="/intelligence" className="text-amber-500 hover:underline">
          Intelligence
        </Link>
        <span className="mx-2">›</span>
        <span>Corridor coverage</span>
      </nav>

      <p className="text-xs uppercase tracking-widest text-amber-500/90">Intelligence · Transparency</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Corridor coverage</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
        Tracked corridors vs published jurisdiction playbooks. An execution plan is only derived when
        both origin and destination have a published playbook. This is coverage transparency — not a
        market claim.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 p-4">
          <dt className="text-xs text-zinc-500">Tracked</dt>
          <dd className="text-2xl font-semibold">{report.trackedCorridorCount}</dd>
        </div>
        <div className="rounded-xl border border-zinc-800 p-4">
          <dt className="text-xs text-zinc-500">Plan-ready</dt>
          <dd className="text-2xl font-semibold text-amber-400/90">{report.planReadyCount}</dd>
        </div>
        <div className="rounded-xl border border-zinc-800 p-4">
          <dt className="text-xs text-zinc-500">Published playbooks</dt>
          <dd className="text-2xl font-semibold">{report.publishedPlaybookCount}</dd>
        </div>
        <div className="rounded-xl border border-zinc-800 p-4">
          <dt className="text-xs text-zinc-500">As of</dt>
          <dd className="text-lg font-medium">{report.asOf}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-zinc-500">
        Published ISO2: {report.publishedIso2.length ? report.publishedIso2.join(', ') : 'none yet'}
      </p>

      <ul className="mt-8 space-y-3">
        {report.corridors.map((c) => (
          <li
            key={c.id}
            className={`rounded-xl border p-4 ${
              c.planReady ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-800/60 bg-zinc-950/20 opacity-90'
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-medium">{c.label}</h2>
              <span
                className={`text-xs uppercase tracking-wide ${
                  c.planReady ? 'text-emerald-500/80' : 'text-zinc-500'
                }`}
              >
                {c.planReady ? 'Plan-ready' : 'Incomplete playbooks'}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Risk {c.riskScore}/5 · {c.riskLabel} · Origin playbook:{' '}
              {c.originPlaybook ? 'yes' : 'no'} · Destination playbook:{' '}
              {c.destinationPlaybook ? 'yes' : 'no'}
            </p>
            {c.planReady && (
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link href={corridorPlanHref(c.from, c.to)} className="text-amber-400 hover:underline">
                  Execution plan →
                </Link>
                <Link
                  href={landedCostHref({ origin: c.from, destination: c.to, product: 'flower' })}
                  className="text-zinc-400 hover:underline"
                >
                  Landed cost →
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs leading-relaxed text-zinc-600">{report.disclaimer}</p>

      <div className="mt-10">
        <OrientationFeedback surface="corridor_coverage" />
      </div>
    </main>
  )
}
