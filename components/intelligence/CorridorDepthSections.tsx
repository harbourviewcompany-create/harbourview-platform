import type { CorridorDepthBundle } from '@/lib/intelligence/corridorDepth'

const severityColor: Record<string, string> = {
  high: 'text-red-400/90',
  medium: 'text-amber-400/90',
  low: 'text-zinc-400',
}

export function CorridorDepthSections({ depth }: { depth: CorridorDepthBundle }) {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-800 p-6">
        <h3 className="text-lg font-medium">Critical path (planning heuristic)</h3>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{depth.criticalPathNarrative}</p>
      </section>

      <section className="rounded-xl border border-zinc-800 p-6">
        <h3 className="text-lg font-medium">Parallel workstreams</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Orientation structure — not a formal dependency graph from any authority.
        </p>
        <ul className="mt-4 space-y-3">
          {depth.workstreams.map((ws) => (
            <li key={ws.id} className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-zinc-100">{ws.name}</p>
                <span className="text-xs uppercase text-zinc-500">{ws.side}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{ws.description}</p>
              <p className="mt-1 text-xs text-zinc-600">
                Often parallel with: {ws.canRunInParallelWith.join(', ')}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 p-6">
        <h3 className="text-lg font-medium">Failure modes (what breaks in practice)</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Pattern library for diligence — not an exhaustive legal catalogue.
        </p>
        <ul className="mt-4 space-y-4">
          {depth.failureModes.map((fm) => (
            <li key={fm.id} className="rounded-lg border border-zinc-800/80 px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-sm font-medium text-zinc-100">{fm.title}</p>
                <span className={`text-xs uppercase ${severityColor[fm.severity] ?? 'text-zinc-500'}`}>
                  {fm.severity}
                </span>
                <span className="text-xs text-zinc-600">{fm.where}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                <span className="text-zinc-500">Pattern: </span>
                {fm.pattern}
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                <span className="text-zinc-500">Mitigation: </span>
                {fm.mitigation}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-amber-900/30 bg-amber-950/10 p-6">
        <h3 className="text-lg font-medium text-amber-200/90">Open questions before you commit</h3>
        <ul className="mt-4 space-y-3">
          {depth.openQuestions.map((q) => (
            <li key={q.id}>
              <p className="text-sm font-medium text-zinc-100">{q.question}</p>
              <p className="text-xs text-zinc-500">{q.whyItMatters}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
