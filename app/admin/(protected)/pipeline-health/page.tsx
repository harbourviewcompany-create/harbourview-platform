// app/admin/(protected)/pipeline-health/page.tsx
'use client'

import { useEffect, useState } from 'react'

interface SourceHealth {
  id: string
  name: string
  status: 'healthy' | 'degraded' | 'failing'
  consecutiveFailures: number
  lastSuccessAt: string | null
  lastError: string | null
  cadenceHours: number
  tier: number
}

interface RunMetrics {
  runId: string
  startedAt: string
  completedAt: string
  totalCandidates: number
  totalInserted: number
  totalSkipped: number
  totalFailed: number
  budgetExceeded: boolean
  avgFetchLatencyMs: number
  avgNormaliseLatencyMs: number
  aiApiCalls: number
  passthroughRate: number
  topErrors: Array<{ error: string; count: number }>
}

export default function PipelineHealthPage() {
  const [sources, setSources] = useState<SourceHealth[]>([])
  const [metrics, setMetrics] = useState<RunMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'healthy' | 'degraded' | 'failing'>('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/pipeline/sources').then((r) => r.json()).catch(() => ({ sources: [] })),
      fetch('/api/admin/pipeline/metrics').then((r) => r.json()).catch(() => ({ runs: [] })),
    ]).then(([sourcesData, metricsData]) => {
      setSources(sourcesData.sources ?? [])
      setMetrics(metricsData.runs ?? [])
      setLoading(false)
    })
  }, [])

  const filteredSources = sources.filter((s) => filter === 'all' || s.status === filter)
  const failingCount = sources.filter((s) => s.status === 'failing').length
  const latestRun = metrics[0]

  const statusColor = {
    healthy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    degraded: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    failing: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#f5f1e8]">Pipeline Health</h1>
        <p className="mt-1 text-sm text-white/50">Real-time scraper, intelligence, and data quality monitoring</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Sources" value={sources.length} />
        <KpiCard label="Failing Sources" value={failingCount} alert={failingCount > 0} />
        <KpiCard label="Latest Run Candidates" value={latestRun?.totalCandidates ?? 0} />
        <KpiCard label="Passthrough Rate" value={`${Math.round((latestRun?.passthroughRate ?? 0) * 100)}%`} />
      </div>

      {latestRun && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">Latest Run — {latestRun.runId}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="Inserted" value={latestRun.totalInserted} />
            <Metric label="Skipped" value={latestRun.totalSkipped} />
            <Metric label="Failed" value={latestRun.totalFailed} alert={latestRun.totalFailed > 0} />
            <Metric label="AI Calls" value={latestRun.aiApiCalls} />
            <Metric label="Avg Fetch" value={`${latestRun.avgFetchLatencyMs}ms`} />
            <Metric label="Avg Normalise" value={`${latestRun.avgNormaliseLatencyMs}ms`} />
            <Metric label="Budget Exceeded" value={latestRun.budgetExceeded ? 'Yes' : 'No'} alert={latestRun.budgetExceeded} />
            <Metric label="Duration" value={`${Math.round((new Date(latestRun.completedAt).getTime() - new Date(latestRun.startedAt).getTime()) / 1000)}s`} />
          </div>
          {latestRun.topErrors.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Top Errors</h3>
              <div className="mt-2 space-y-1">
                {latestRun.topErrors.map((e) => (
                  <div key={e.error} className="flex justify-between text-sm">
                    <span className="text-white/60">{e.error}</span>
                    <span className="text-white/40">{e.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">Source Health</h2>
          <div className="flex gap-2">
            {(['all', 'healthy', 'degraded', 'failing'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  filter === f ? 'bg-gold/20 text-gold' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-white/40">Loading source health...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Failures</th>
                  <th className="px-4 py-3">Last Success</th>
                  <th className="px-4 py-3">Cadence</th>
                  <th className="px-4 py-3">Last Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSources.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white/80">{s.name}</div>
                      <div className="text-xs text-white/30">{s.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60">{s.consecutiveFailures}</td>
                    <td className="px-4 py-3 text-white/60">
                      {s.lastSuccessAt ? new Date(s.lastSuccessAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-white/60">{s.cadenceHours}h</td>
                    <td className="px-4 py-3 text-white/40 max-w-xs truncate" title={s.lastError ?? ''}>
                      {s.lastError ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${alert ? 'border-rose-500/30 bg-rose-500/10' : 'border-white/10 bg-white/[0.02]'}`}>
      <div className="text-2xl font-semibold text-[#f5f1e8]">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-white/40">{label}</div>
    </div>
  )
}

function Metric({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div>
      <div className={`text-lg font-medium ${alert ? 'text-rose-400' : 'text-white/80'}`}>{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  )
}
