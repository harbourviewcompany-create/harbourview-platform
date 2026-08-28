import type { ReactNode } from 'react'
import type { CommandCentreDataState, CommandCentreSourceMeta } from '@/lib/dashboard/commandCentreDataTypes'
import { COMMAND_CENTRE_COPY } from '@/lib/platform/commandCentreCopy'

const STATE_PRIORITY: CommandCentreDataState[] = ['error', 'stale', 'partial', 'fallback', 'empty', 'live']

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

  // Approved fallbacks still provide usable customer-facing data and should not
  // be framed as degradation unless another requested source is actually stale,
  // partial, or unavailable. Honest empty results are also normal context gaps.
  const degradedSources = requestedSources.filter(source =>
    source.state === 'error' || source.state === 'stale' || source.state === 'partial',
  )
  const fallbackOnlyNotice = counts.fallback > 0 && degradedSources.length === 0
  const showNotice = fallbackOnlyNotice || degradedSources.length > 0

  const statusSummary = [
    counts.live > 0 ? `${counts.live} live` : null,
    counts.partial > 0 ? `${counts.partial} partial` : null,
    counts.stale > 0 ? `${counts.stale} stale` : null,
    counts.fallback > 0
      ? `${counts.fallback} approved fallback${counts.fallback === 1 ? '' : 's'}`
      : null,
    counts.empty > 0 ? `${counts.empty} with no results` : null,
    counts.error > 0 ? `${counts.error} unavailable` : null,
  ].filter((value): value is string => Boolean(value)).join(' · ')

  const degradedDetail = degradedSources
    .slice()
    .sort((a, b) => STATE_PRIORITY.indexOf(a.state) - STATE_PRIORITY.indexOf(b.state))
    .map(source => {
      const label = source.sourceLabel || source.key
      if (source.state === 'error') return `${label} (unavailable)`
      if (source.state === 'stale') return `${label} (stale)`
      if (source.state === 'partial') return `${label} (partial)`
      return label
    })
    .join(' · ')

  const noticeTitle = fallbackOnlyNotice
    ? COMMAND_CENTRE_COPY.dataBoundary.available
    : COMMAND_CENTRE_COPY.dataBoundary[state]
  const noticeDetail = fallbackOnlyNotice
    ? COMMAND_CENTRE_COPY.dataBoundary.availableDetail
    : degradedDetail

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
              <p className="m-0">{noticeTitle}</p>
              {statusSummary ? (
                <p className="m-0 text-xs text-[#f5f1e8]/60">{statusSummary}</p>
              ) : null}
            </div>
            {noticeDetail ? (
              <p className="m-0 text-xs text-[#f5f1e8]/55">{noticeDetail}</p>
            ) : null}
          </div>
        </aside>
      )}
      {children}
    </div>
  )
}
