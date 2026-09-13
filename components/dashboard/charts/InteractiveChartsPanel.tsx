'use client'

import { useMemo } from 'react'
import type { CommandCentreSignal } from '@/lib/dashboard/commandCentreLiveData'
import { chartDataFromSignals } from '@/lib/dashboard/chartDataFromSignals'
import ChartContainer from './ChartContainer'
import InteractiveTimeline from './InteractiveTimeline'
import DrillDownBarChart from './DrillDownBarChart'

interface InteractiveChartsPanelProps {
  /** Live Command Centre signals when available. */
  signals?: CommandCentreSignal[]
}

/**
 * Self-contained panel mounted via DesktopCommandWorkspace when tool=charts.
 * Accepts live signals; falls back to empty state (no demo numbers in prod path).
 */
export default function InteractiveChartsPanel({ signals = [] }: InteractiveChartsPanelProps) {
  const { timeline, opportunities } = useMemo(
    () => chartDataFromSignals(signals),
    [signals],
  )

  const hasData = timeline.length > 0 || opportunities.length > 0

  return (
    <div className="space-y-6 p-4 md:p-6" data-interactive-charts-panel>
      {!hasData && (
        <p className="text-sm text-[#f5f1e8]/60 px-1">
          No live signal series available for this session yet. Charts will populate when Command Centre signals load.
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
