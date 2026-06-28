import type { ReactNode } from 'react'

import {
  conversionByDrop,
  conversionByMarket,
  operatorPerformance,
  recentActivity,
  stageSummary,
  stalledHeatmap,
  topOpportunities,
  type DealIntelligenceEvent,
  type DealIntelligenceRecord,
} from '@/lib/introduction-routing/dealIntelligence'

type DealIntelligencePanelProps = {
  records: DealIntelligenceRecord[]
  events: DealIntelligenceEvent[]
}

export function DealIntelligencePanel({ records, events }: DealIntelligencePanelProps) {
  const marketMetrics = conversionByMarket(records)
  const dropMetrics = conversionByDrop(records)
  const stages = stageSummary(records)
  const operators = operatorPerformance(records)
  const stalled = stalledHeatmap(records)
  const opportunities = topOpportunities(records)
  const activity = recentActivity(events)

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <Panel title="Conversion by Market">
          {marketMetrics.map((row) => (
            <MetricRow key={row.market} label={row.market} value={`${row.closedWon}/${row.total} · ${row.conversionRate}%`} />
          ))}
        </Panel>

        <Panel title="Conversion by Drop">
          {dropMetrics.map((row) => (
            <MetricRow key={row.drop} label={row.drop} value={`${row.closedWon}/${row.total} · ${row.conversionRate}%`} />
          ))}
        </Panel>

        <Panel title="Deal Stages">
          {stages.map((row) => (
            <MetricRow key={row.stage} label={row.stage} value={String(row.total)} />
          ))}
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Operator Performance">
          {operators.map((row) => (
            <div key={row.operator} className="border-b border-white/10 py-2 text-sm">
              <div className="font-medium">{row.operator}</div>
              <div className="text-xs text-gray-400">
                Deals: {row.total} · Won: {row.won} · Stalled: {row.stalled} · Avg score: {row.avgScore}
              </div>
            </div>
          ))}
        </Panel>

        <Panel title="Stalled Deal Heatmap">
          {stalled.map((row) => (
            <div key={row.id} className="border-b border-red-500/20 py-2 text-sm">
              <div className="font-medium text-red-200">{row.company}</div>
              <div className="text-xs text-red-300/80">
                {row.market} · {row.drop} · {row.stage} · Score {row.score}
              </div>
            </div>
          ))}
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top Opportunities">
          {opportunities.map((row) => (
            <div key={row.id} className="border-b border-[#C6A55A]/20 py-2 text-sm">
              <div className="font-medium text-[#C6A55A]">{row.company}</div>
              <div className="text-xs text-gray-400">
                {row.market} · {row.drop} · {row.stage} · Score {row.score}
              </div>
            </div>
          ))}
        </Panel>

        <Panel title="Recent Activity Feed">
          {activity.map((event) => (
            <div key={event.id} className="border-b border-white/10 py-2 text-sm">
              <div className="font-medium">{event.event_type}</div>
              <div className="text-xs text-gray-400">{event.event_summary}</div>
            </div>
          ))}
        </Panel>
      </section>
    </div>
  )
}

function Panel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#C6A55A]">{title}</h3>
      <div>{children}</div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2 text-sm last:border-b-0">
      <span>{label}</span>
      <span className="text-gray-400">{value}</span>
    </div>
  )
}
