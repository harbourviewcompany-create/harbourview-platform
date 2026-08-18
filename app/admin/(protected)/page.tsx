import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminWorkSnapshot } from '@/lib/admin/work/server'
import type { AdminWorkItemDTO, AdminWorkPriority } from '@/lib/admin/work/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const priorityClass: Record<AdminWorkPriority, string> = {
  critical: 'border-rose-400/30 bg-rose-500/8 text-rose-200',
  high: 'border-amber-300/25 bg-amber-400/8 text-amber-100',
  normal: 'border-white/10 bg-white/[0.025] text-[#F5F1E8]/70',
  low: 'border-white/8 bg-white/[0.015] text-[#F5F1E8]/50',
}

function ageLabel(value: string) {
  const ms = Date.now() - new Date(value).getTime()
  const hours = Math.max(0, Math.floor(ms / 3_600_000))
  if (hours < 1) return '<1h'
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function WorkRow({ item }: { item: AdminWorkItemDTO }) {
  return (
    <Link
      href={item.href}
      className="grid min-w-0 gap-2 border-b border-white/6 px-4 py-3 transition last:border-b-0 hover:bg-white/[0.025] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${priorityClass[item.priority]}`}>{item.priority}</span>
          <span className="truncate text-sm font-medium text-[#F5F1E8]">{item.title}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#F5F1E8]/46">{item.summary || item.reason.label}</p>
      </div>
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.1em] text-[#F5F1E8]/32">
        <span>{item.reason.label}</span>
        <span>{ageLabel(item.createdAt)}</span>
      </div>
    </Link>
  )
}

export default async function AdminCommandCenterPage() {
  const auth = (await requireAdminAuth())!
  const snapshot = await getAdminWorkSnapshot()
  const unresolved = snapshot.items.filter((item) => !['resolved'].includes(item.status))
  const urgent = unresolved.filter((item) => item.priority === 'critical' || item.priority === 'high')
  const signalWork = unresolved.filter((item) => item.source === 'engine_signal' || item.source === 'regulatory_signal')
  const marketplaceWork = unresolved.filter((item) => ['marketplace_inquiry', 'marketplace_candidate', 'intake'].includes(item.source))
  const operational = unresolved.filter((item) => item.source === 'operational_exception')
  const myWork = unresolved.filter((item) => item.assignedTo?.id === auth.user.id)
  const degradedSources = snapshot.sources.filter((source) => source.state === 'degraded')
  const recent = [...unresolved].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8)

  return (
    <section className="min-w-0 space-y-5">
      <header className="flex min-w-0 flex-col gap-4 border-b border-white/8 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#C6A55A]">Harbourview internal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Admin Command Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#F5F1E8]/55">
            Live operator work from existing review, signal, marketplace and pipeline data. Counts distinguish unavailable sources from true zeroes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/work" className="rounded-lg bg-[#C6A55A] px-4 py-2 text-sm font-semibold text-[#071423]">Open work queue</Link>
          <Link href="/admin/signals" className="rounded-lg border border-white/12 px-4 py-2 text-sm text-[#F5F1E8]/72">Review signals</Link>
        </div>
      </header>

      {degradedSources.length ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-400/8 px-4 py-3 text-sm text-amber-100">
          <span className="font-medium">Partial data:</span>{' '}
          {degradedSources.map((source) => source.source.replace(/_/g, ' ')).join(', ')} could not be loaded. Their counts are not treated as zero.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Requires attention', value: urgent.length, href: '/admin/work?priority=attention' },
          { label: 'Signal review', value: signalWork.length, href: '/admin/signals' },
          { label: 'Marketplace work', value: marketplaceWork.length, href: '/admin/work?domain=marketplace' },
          { label: 'Operational exceptions', value: operational.length, href: '/admin/work?source=operational_exception' },
        ].map((metric) => (
          <Link key={metric.label} href={metric.href} className="rounded-xl border border-white/8 bg-white/[0.022] p-4 transition hover:border-[#C6A55A]/25 hover:bg-white/[0.035]">
            <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{metric.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#F5F1E8]/38">{metric.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-white/8 bg-[#091728]">
          <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Requires attention</h2>
              <p className="mt-0.5 text-xs text-[#F5F1E8]/38">Highest-priority unresolved work across domains.</p>
            </div>
            <Link className="shrink-0 text-xs text-[#C6A55A]" href="/admin/work?priority=attention">View all</Link>
          </div>
          {urgent.length ? urgent.slice(0, 10).map((item) => <WorkRow key={item.id} item={item} />) : (
            <div className="px-4 py-8 text-center text-sm text-[#F5F1E8]/38">No critical or high-priority work is currently loaded.</div>
          )}
        </section>

        <div className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-xl border border-white/8 bg-[#091728]">
            <div className="border-b border-white/8 px-4 py-3">
              <h2 className="text-sm font-semibold">My work</h2>
              <p className="mt-0.5 text-xs text-[#F5F1E8]/38">Persistent queue items assigned to this account.</p>
            </div>
            {myWork.length ? myWork.slice(0, 5).map((item) => <WorkRow key={item.id} item={item} />) : (
              <div className="px-4 py-6 text-sm text-[#F5F1E8]/38">No loaded work is assigned to you.</div>
            )}
          </section>

          <section className="rounded-xl border border-white/8 bg-[#091728] p-4">
            <h2 className="text-sm font-semibold">Source status</h2>
            <div className="mt-3 space-y-2">
              {snapshot.sources.map((source) => (
                <div key={source.source} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-[#F5F1E8]/55">{source.source.replace(/_/g, ' ')}</span>
                  <span className={source.state === 'loaded' ? 'text-emerald-300/80' : 'text-amber-200'}>
                    {source.state === 'loaded' ? `${source.count} loaded` : 'degraded'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="min-w-0 overflow-hidden rounded-xl border border-white/8 bg-[#091728]">
        <div className="border-b border-white/8 px-4 py-3">
          <h2 className="text-sm font-semibold">Recent unresolved activity</h2>
          <p className="mt-0.5 text-xs text-[#F5F1E8]/38">Newest work records from the current read model.</p>
        </div>
        {recent.length ? recent.map((item) => <WorkRow key={item.id} item={item} />) : (
          <div className="px-4 py-8 text-center text-sm text-[#F5F1E8]/38">No unresolved work is currently loaded.</div>
        )}
      </section>
    </section>
  )
}
