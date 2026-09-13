'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  useDashboardSignalsRealtime,
  type SignalsRealtimeStatus,
} from '@/components/dashboard/useDashboardSignalsRealtime'
import { chartDataFromDashboardSignals } from '@/lib/dashboard/chartDataFromSignals'
import ChartContainer from './ChartContainer'
import InteractiveTimeline from './InteractiveTimeline'
import DrillDownBarChart from './DrillDownBarChart'

function statusLabel(status: SignalsRealtimeStatus): string {
  if (status === 'live') return 'Live'
  if (status === 'connecting') return 'Connecting…'
  return 'Degraded'
}

/**
 * Mounted via DesktopCommandWorkspace when tool=charts.
 * Live path: same authenticated feed as Command Centre Intel
 * (`useDashboardSignalsRealtime` → GET /api/dashboard/signals).
 */
export default function InteractiveChartsPanel() {
  const searchParams = useSearchParams()
  const countryLabel = searchParams.get('country')?.trim() || 'all'

  const { signals, status } = useDashboardSignalsRealtime([], countryLabel)

  const { timeline, opportunities } = useMemo(
    () => chartDataFromDashboardSignals(signals),
    [signals],
  )

  const hasData = timeline.length > 0 || opportunities.length > 0

  return (
    <div className="space-y-6 p-4 md:p-6" data-interactive-charts-panel data-signals-status={status}>
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs uppercase tracking-[0.16em] text-[#c6a55a]/80">
          Source: /api/dashboard/signals · scope {countryLabel}
        </p>
        <span
          className="text-xs rounded-full border px-2 py-0.5"
          style={{
            borderColor: status === 'live' ? 'rgba(34,197,94,0.45)' : 'rgba(198,165,90,0.35)',
            color: status === 'live' ? '#86efac' : '#c6a55a',
          }}
        >
          {statusLabel(status)}
        </span>
      </div>

      {!hasData && (
        <p className="text-sm text-[#f5f1e8]/60 px-1">
          {status === 'connecting'
            ? 'Loading live signal series…'
            : 'No live signal series available for this scope yet.'}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartContainer title="Market Signals Timeline" chartId="timeline-chart">
          <InteractiveTimeline data={timeline} />
        </ChartContainer>

        <ChartContainer title="Opportunity Scores by Country" chartId="opportunity-chart">
          <DrillDownBarChart data={opportunities} />
        </ChartContainer>
      </div>
    </div>
  )
}
