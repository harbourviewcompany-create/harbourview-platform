import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listStrategicMetrics } from '@/lib/proprietary-intelligence/admin'

export const dynamic = 'force-dynamic'

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <span className="text-emerald-400">↑</span>
  if (trend === 'down') return <span className="text-red-400">↓</span>
  return <span className="text-[#F5F1E8]/40">→</span>
}

export default async function MetricsPage() {
  await requireAdminAuth()
  const result = await listStrategicMetrics()
  const metrics = result.ok ? (result.data ?? []) : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Proprietary Intelligence</p>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">Strategic Metrics</h1>
          <Link href="/admin/proprietary-intelligence" className="text-xs text-[#C6A55A] hover:underline">
            ← Overview
          </Link>
        </div>
        <p className="text-sm text-[#F5F1E8]/60">Platform-wide intelligence KPIs — coverage, velocity, and confidence.</p>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{metric.metric_type.replace(/_/g, ' ')}</p>
            <p className="text-sm text-[#F5F1E8]/70">{metric.label}</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-semibold text-[#F5F1E8]">
                {typeof metric.value === 'number' && metric.value % 1 !== 0
                  ? metric.value.toFixed(1)
                  : metric.value}
              </p>
              <p className="text-sm text-[#F5F1E8]/50 mb-0.5">{metric.unit}</p>
              <p className="text-lg mb-0.5 ml-auto"><TrendArrow trend={metric.trend} /></p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#F5F1E8]/40">
              <span>Target:</span>
              <span className="text-[#F5F1E8]/60">{metric.target} {metric.unit}</span>
              {metric.market && (
                <>
                  <span className="ml-auto">{metric.market}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {metrics.length === 0 && (
        <p className="text-center text-sm text-[#F5F1E8]/40 py-8">No strategic metrics found.</p>
      )}
    </section>
  )
}
