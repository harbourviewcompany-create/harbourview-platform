import type { ReactNode } from 'react'
import type { CommandCentreDataState, CommandCentreSourceMeta } from '@/lib/dashboard/commandCentreDataTypes'
import { COMMAND_CENTRE_COPY } from '@/lib/platform/commandCentreCopy'

const STATE_PRIORITY: CommandCentreDataState[] = ['error', 'fallback', 'stale', 'partial', 'empty', 'live']

export default function CommandCentreDataBoundary({
  state,
  sources,
  loadedAt,
  children,
}: {
  state: CommandCentreDataState
  sources: Record<string, CommandCentreSourceMeta>
  loadedAt: string
  children: ReactNode
}) {
  const requestedSources = Object.values(sources).filter(source => source.requested)
  const counts = requestedSources.reduce<Record<CommandCentreDataState, number>>((summary, source) => {
    summary[source.state] += 1
    return summary
  }, { live: 0, partial: 0, fallback: 0, empty: 0, error: 0, stale: 0 })

  // Empty-only gaps (no fallback/error/stale) are normal for a jurisdiction/role —
  // do not surface the degraded banner for honest zeros.
  const degradedSources = requestedSources.filter(source =>
    source.state === 'fallback' || source.state === 'error' || source.state === 'stale',
  )
  const showNotice = state !== 'live' && state !== 'empty' && degradedSources.length > 0

  const degradedDetail = degradedSources
    .slice()
    .sort((a, b) => STATE_PRIORITY.indexOf(a.state) - STATE_PRIORITY.indexOf(b.state))
    .map(source => {
      const label = source.sourceLabel || source.key
      if (source.state === 'fallback') return `${label} (controlled fallback)`
      if (source.state === 'error') return `${label} (unavailable)`
      if (source.state === 'stale') return `${label} (stale)`
      return label
    })
    .join(' · ')

  return (
    <div
      data-command-centre-state={state}
      data-command-centre-loaded-at={loadedAt}
      data-command-centre-source-count={requestedSources.length}
      data-command-centre-degraded-count={degradedSources.length}
    >
      {showNotice && (
        <aside
          role={state === 'error' ? 'alert' : 'status'}
          aria-live={state === 'error' ? 'assertive' : 'polite'}
          className="border-b border-[#c6a55a]/20 bg-[#07111f] px-4 py-3 text-[#f5f1e8]"
        >
          <div className="mx-auto flex max-w-[1600px] flex-col gap-1 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="m-0">{COMMAND_CENTRE_COPY.dataBoundary[state]}</p>
              <p className="m-0 text-xs text-[#f5f1e8]/60">
                {counts.live} live · {counts.partial} partial · {counts.stale} stale · {counts.fallback} fallback · {counts.empty} empty · {counts.error} unavailable
              </p>
            </div>
            {degradedDetail ? (
              <p className="m-0 text-xs text-[#f5f1e8]/55">{degradedDetail}</p>
            ) : null}
          </div>
        </aside>
      )}
      {children}
    </div>
  )
}
