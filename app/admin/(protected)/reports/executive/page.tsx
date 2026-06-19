import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listExecutiveDashboardMetrics, listInstitutionalReports } from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

const TREND_ICON: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
}

const TREND_COLOUR: Record<string, string> = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  stable: 'text-[#F5F1E8]/50',
}

const STATUS_COLOURS: Record<string, string> = {
  draft: 'border-white/20 text-white/50',
  ready_for_review: 'border-amber-400/40 text-amber-300',
  published: 'border-emerald-400/40 text-emerald-300',
  shared: 'border-sky-400/40 text-sky-300',
}

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

export default async function ExecutiveDashboardPage() {
  await requireAdminAuth()

  const [metricsResult, reportsResult] = await Promise.all([
    listExecutiveDashboardMetrics(),
    listInstitutionalReports(),
  ])

  const metrics = metricsResult.ok ? metricsResult.data : []
  const executiveReports = (reportsResult.ok ? reportsResult.data : []).filter(
    (r) => r.report_type === 'executive_dashboard',
  )

  const isFixture =
    (metricsResult.ok && metricsResult.source === 'fixture') ||
    (reportsResult.ok && reportsResult.source === 'fixture')

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Reports</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Executive Dashboard</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          Platform-wide performance metrics and operational intelligence for executive review.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {metrics.map((metric) => {
          const atTarget = metric.value >= metric.target
          return (
            <div key={metric.id} className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#F5F1E8]/40">{metric.label}</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-semibold text-[#F5F1E8]">
                  {metric.unit === 'USD'
                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(metric.value)
                    : metric.unit === '%'
                    ? `${metric.value}%`
                    : metric.value.toLocaleString()}
                </span>
                <span className={`text-xs font-semibold ${TREND_COLOUR[metric.trend]}`}>
                  {TREND_ICON[metric.trend]}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                <div className="h-1 flex-1 rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${atTarget ? 'bg-emerald-400' : 'bg-[#C6A55A]'}`}
                    style={{ width: `${Math.min(100, Math.round((metric.value / metric.target) * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#F5F1E8]/30">
                  {metric.unit === 'USD'
                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(metric.target)
                    : metric.unit === '%'
                    ? `${metric.target}%`
                    : metric.target}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {executiveReports.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#F5F1E8]">Executive Reports</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {executiveReports.map((report) => (
              <div key={report.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{report.market}</p>
                  <h4 className="mt-1 font-semibold text-[#F5F1E8]">{report.title}</h4>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#F5F1E8]/40">Completeness</p>
                    <span className="text-xs font-semibold text-[#F5F1E8]">{report.completeness_pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#C6A55A]" style={{ width: `${report.completeness_pct}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Pill label={report.status} cls={STATUS_COLOURS[report.status] ?? 'border-white/20 text-white/50'} />
                  <span className="text-[10px] text-[#F5F1E8]/40">
                    {new Date(report.last_updated).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
