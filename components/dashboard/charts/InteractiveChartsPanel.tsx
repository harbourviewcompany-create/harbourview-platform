'use client'

import ChartContainer from './ChartContainer'
import InteractiveTimeline from './InteractiveTimeline'
import DrillDownBarChart from './DrillDownBarChart'

/**
 * Self-contained panel that can be mounted inside Command Centre
 * without editing the large CommandCentre.tsx file.
 *
 * Mount points (choose one):
 * 1. DesktopCommandWorkspace when tool=charts
 * 2. A new module in COMMAND_CENTRE_MODULE_REGISTRY
 * 3. Temporary side-by-side in DesktopCommandWorkspace for testing
 */
export default function InteractiveChartsPanel() {
  // Placeholder data — replace with live dashboardLiveData feeds
  const timelineData = [
    { date: '2026-08-01', signals: 12, score: 68, country: 'DE' },
    { date: '2026-08-08', signals: 18, score: 72, country: 'DE' },
    { date: '2026-08-15', signals: 15, score: 70, country: 'AU' },
    { date: '2026-08-22', signals: 22, score: 78, country: 'CA' },
    { date: '2026-08-29', signals: 19, score: 75, country: 'GB' },
    { date: '2026-09-05', signals: 25, score: 81, country: 'DE' },
  ]

  const opportunityData = [
    { country: 'Germany', score: 82, signals: 18, riskLevel: 'medium' as const, trend: 'up' as const },
    { country: 'Australia', score: 76, signals: 14, riskLevel: 'low' as const, trend: 'stable' as const },
    { country: 'Canada', score: 71, signals: 11, riskLevel: 'low' as const, trend: 'up' as const },
    { country: 'UK', score: 68, signals: 16, riskLevel: 'medium' as const, trend: 'down' as const },
    { country: 'Portugal', score: 64, signals: 9, riskLevel: 'medium' as const, trend: 'up' as const },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6" data-interactive-charts-panel>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartContainer title="Market Signals Timeline" chartId="timeline-chart">
          <InteractiveTimeline data={timelineData} />
        </ChartContainer>

        <ChartContainer title="Opportunity Scores by Country" chartId="opportunity-chart">
          <DrillDownBarChart data={opportunityData} />
        </ChartContainer>
      </div>
    </div>
  )
}
