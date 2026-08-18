import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminWorkSnapshot } from '@/lib/admin/work/server'
import type { AdminWorkItemDTO, AdminWorkPriority, AdminWorkSource } from '@/lib/admin/work/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const sourceLabels: Record<AdminWorkSource, string> = {
  admin_review_queue: 'Persistent review',
  engine_signal: 'Engine signal',
  regulatory_signal: 'Regulatory signal',
  marketplace_inquiry: 'Inquiry',
  marketplace_candidate: 'Candidate',
  intake: 'Intake',
  operational_exception: 'Operational',
}

const priorityClass: Record<AdminWorkPriority, string> = {
  critical: 'border-rose-400/30 text-rose-200 bg-rose-500/8',
  high: 'border-amber-300/25 text-amber-100 bg-amber-400/8',
  normal: 'border-white/12 text-[#F5F1E8]/65 bg-white/[0.02]',
  low: 'border-white/8 text-[#F5F1E8]/42 bg-white/[0.01]',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function matchesDomain(item: AdminWorkItemDTO, domain?: string) {
  if (!domain) return true
  if (domain === 'marketplace') return ['marketplace_inquiry', 'marketplace_candidate', 'intake'].includes(item.source)
  if (domain === 'signals') return ['engine_signal', 'regulatory_signal'].includes(item.source)
  return true
}

export default async function AdminWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; priority?: string; domain?: string; status?: string; queue?: string }>
}) {
  await requireAdminAuth()
  const params = await searchParams
  const snapshot = await getAdminWorkSnapshot()
  const visible = snapshot.items.filter((item) => {
    if (params.queue && item.id !== `review:${params.queue}`) return false
    if (params.source && item.source !== params.source) return false
    if (params.priority === 'attention' && !['critical', 'high'].includes(item.priority)) return false
    if (params.priority && params.priority !== 'attention' && item.priority !== params.priority) return false
    if (params.status && item.status !== params.status) return false
    return matchesDomain(item, params.domain)
  })
  const degraded = snapshot.sources.filter((source) => source.state === 'degraded')

  return (
    <section className="min-w-0 space-y-5">
      <header className="flex min-w-0 flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#C6A55A]">Operator workflow</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Unified work queue</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#F5F1E8]/55">
            Persistent assignments from <code className="text-[#F5F1E8]/70">hv_admin_review_queue</code> plus live adapters for signal, marketplace, intake and operational exception workflows.
          </p>
        </div>
        <Link href="/admin" className="self-start rounded-lg border border-white/12 px-4 py-2 text-sm text-[#F5F1E8]/70">Command Center</Link>
      </header>

      {degraded.length ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-400/8 px-4 py-3 text-sm text-amber-100">
          Partial queue: {degraded.map((source) => source.source.replace(/_/g, ' ')).join(', ')} unavailable. Loaded records remain usable.
        </div>
      ) : null}

      <form className="grid gap-3 rounded-xl border border-white/8 bg-white/[0.018] p-3 sm:grid-cols-2 xl:grid-cols-5" action="/admin/work">
        <label className="text-xs text-[#F5F1E8]/45">
          Source
          <select name="source" defaultValue={params.source || ''} className="mt-1.5 min-h-10 w-full rounded-lg border border-white/10 bg-[#06101E] px-3 text-sm text-[#F5F1E8]">
            <option value="">All sources</option>
            {Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-xs text-[#F5F1E8]/45">
          Priority
          <select name="priority" defaultValue={params.priority || ''} className="mt-1.5 min-h-10 w-full rounded-lg border border-white/10 bg-[#06101E] px-3 text-sm text-[#F5F1E8]">
            <option value="">All priorities</option>
            <option value="attention">Critical + high</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="text-xs text-[#F5F1E8]/45">
          Domain
          <select name="domain" defaultValue={params.domain || ''} className="mt-1.5 min-h-10 w-full rounded-lg border border-white/10 bg-[#06101E] px-3 text-sm text-[#F5F1E8]">
            <option value="">All domains</option>
            <option value="signals">Signals</option>
            <option value="marketplace">Marketplace</option>
          </select>
        </label>
        <label className="text-xs text-[#F5F1E8]/45">
          Status
          <select name="status" defaultValue={params.status || ''} className="mt-1.5 min-h-10 w-full rounded-lg border border-white/10 bg-[#06101E] px-3 text-sm text-[#F5F1E8]">
            <option value="">All statuses</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="escalated">Escalated</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="min-h-10 rounded-lg bg-[#C6A55A] px-4 text-sm font-semibold text-[#071423]">Apply</button>
          <Link href="/admin/work" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-4 text-sm text-[#F5F1E8]/55">Reset</Link>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#F5F1E8]/38">
        <span>{visible.length} loaded work item{visible.length === 1 ? '' : 's'}</span>
        <span>Generated {formatDate(snapshot.generatedAt)}</span>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.018] px-5 py-12 text-center">
          <p className="text-sm font-medium">No loaded work matches this view.</p>
          <p className="mt-2 text-xs text-[#F5F1E8]/40">Reset filters or inspect degraded source state above before treating this as a true zero.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-white/8 bg-[#091728] md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-white/8 bg-black/15 text-[10px] uppercase tracking-[0.12em] text-[#F5F1E8]/34">
                  <tr>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Work</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assigned</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {visible.map((item) => (
                    <tr key={item.id} className="align-top transition hover:bg-white/[0.02]">
                      <td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${priorityClass[item.priority]}`}>{item.priority}</span></td>
                      <td className="max-w-xl px-4 py-3">
                        <Link href={item.href} className="font-medium text-[#F5F1E8] hover:text-[#E2C776]">{item.title}</Link>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#F5F1E8]/42">{item.summary || item.reason.label}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#F5F1E8]/52">{sourceLabels[item.source]}</td>
                      <td className="px-4 py-3 text-xs text-[#F5F1E8]/52">{item.status.replace(/_/g, ' ')}</td>
                      <td className="max-w-48 truncate px-4 py-3 text-xs text-[#F5F1E8]/42">{item.assignedTo?.label || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#F5F1E8]/42">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {visible.map((item) => (
              <Link key={item.id} href={item.href} className="block min-w-0 rounded-xl border border-white/8 bg-[#091728] p-4 active:bg-white/[0.04]">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${priorityClass[item.priority]}`}>{item.priority}</span>
                    <h2 className="mt-2 break-words text-sm font-semibold leading-5 text-[#F5F1E8]">{item.title}</h2>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.1em] text-[#F5F1E8]/30">{sourceLabels[item.source]}</span>
                </div>
                <p className="mt-2 line-clamp-3 break-words text-xs leading-5 text-[#F5F1E8]/45">{item.summary || item.reason.label}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.1em] text-[#F5F1E8]/30">
                  <span>{item.status.replace(/_/g, ' ')}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
