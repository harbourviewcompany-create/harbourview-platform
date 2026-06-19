import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listEnterpriseDashboardMetrics } from '@/lib/enterprise/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function trendIcon(trend: string) {
  switch (trend) {
    case 'up':
      return { icon: '↑', color: 'text-emerald-400' }
    case 'down':
      return { icon: '↓', color: 'text-red-400' }
    default:
      return { icon: '→', color: 'text-zinc-400' }
  }
}

export default async function DashboardsPage() {
  await requireAdminAuth()

  const result = await listEnterpriseDashboardMetrics()
  const metrics = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Enterprise Coordination</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Dashboard Metrics</h1>
          <p className="mt-1 text-sm text-zinc-400">
            KPIs across deal velocity, coverage, operator load, and network growth
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FixtureBanner isFixture={isFixture} />
          <Link
            href="/admin/enterprise"
            className="text-xs text-zinc-500 hover:text-[#C6A55A] transition-colors"
          >
            ← Overview
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metrics.map((m) => {
          const trend = trendIcon(m.trend)
          return (
            <div
              key={m.id}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-2"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">
                {m.category.replace(/_/g, ' ')}
              </p>
              <p className="text-sm text-zinc-300">{m.label}</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-semibold text-[#F5F1E8]">{m.value}</span>
                <span className="text-sm text-zinc-500 mb-0.5">{m.unit}</span>
                <span className={`text-lg font-semibold mb-0.5 ml-auto ${trend.color}`}>
                  {trend.icon}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-xs text-zinc-600">Target</span>
                <span className="text-xs text-zinc-400">
                  {m.target} {m.unit}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
