import type { ReactNode } from 'react'
import type { CommandCentreDataState, CommandCentreSourceMeta } from '@/lib/dashboard/commandCentreDataTypes'
import { COMMAND_CENTRE_COPY } from '@/lib/platform/commandCentreCopy'

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

  const showNotice = state !== 'live'

  return (
    <div
      data-command-centre-state={state}
      data-command-centre-loaded-at={loadedAt}
      data-command-centre-source-count={requestedSources.length}
    >
      {showNotice && (
        <aside
          role={state === 'error' ? 'alert' : 'status'}
          aria-live={state === 'error' ? 'assertive' : 'polite'}
          className="border-b border-[#c6a55a]/20 bg-[#07111f] px-4 py-3 text-[#f5f1e8]"
        >
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 text-sm">
            <p className="m-0">{COMMAND_CENTRE_COPY.dataBoundary[state]}</p>
            <p className="m-0 text-xs text-[#f5f1e8]/60">
              {counts.live} live · {counts.partial} partial · {counts.stale} stale · {counts.fallback} fallback · {counts.empty} empty · {counts.error} unavailable
            </p>
          </div>
        </aside>
      )}
      {children}
    </div>
  )
}
