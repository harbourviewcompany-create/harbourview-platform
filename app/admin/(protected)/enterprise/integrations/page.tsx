import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listStrategicIntegrations } from '@/lib/enterprise/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function statusPill(status: string) {
  switch (status) {
    case 'ready_to_connect':
      return 'bg-emerald-950 text-emerald-400 border border-emerald-400/20'
    case 'in_development':
      return 'bg-amber-950 text-amber-400 border border-amber-400/20'
    case 'planned':
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
    default:
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
  }
}

function priorityDot(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-400'
    case 'medium':
      return 'bg-amber-400'
    case 'low':
      return 'bg-zinc-500'
    default:
      return 'bg-zinc-500'
  }
}

export default async function IntegrationsPage() {
  await requireAdminAuth()

  const result = await listStrategicIntegrations()
  const integrations = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Enterprise Coordination</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Strategic Integrations</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Planned and active integration connections for email, data, documents, and automation
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i) => (
          <div
            key={i.id}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">
                  {i.integration_category.replace(/_/g, ' ')}
                </p>
                <h2 className="mt-1 text-sm font-semibold text-[#F5F1E8]">{i.name}</h2>
              </div>
              <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${priorityDot(i.priority)}`} title={`Priority: ${i.priority}`} />
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">{i.description}</p>

            <div className="border-t border-white/10 pt-2">
              <p className="text-xs text-zinc-600 mb-0.5">Data flow</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{i.data_flow}</p>
            </div>

            <div className="flex items-center justify-between">
              <span className={`rounded-full px-2 py-1 text-xs ${statusPill(i.status)}`}>
                {i.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-zinc-600">{i.priority} priority</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
