import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listExecutionQueue } from '@/lib/proprietary-intelligence/admin'

export const dynamic = 'force-dynamic'

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/15 text-red-400 border border-red-500/25',
  medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  low: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
}

const statusColors: Record<string, string> = {
  ready_to_execute: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  draft_pending_review: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  follow_up_due: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  complete: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
}

export default async function ExecutionPage() {
  await requireAdminAuth()
  const result = await listExecutionQueue()
  const items = result.ok ? (result.data ?? []) : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Proprietary Intelligence</p>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">Execution Queue</h1>
          <Link href="/admin/proprietary-intelligence" className="text-xs text-[#C6A55A] hover:underline">
            ← Overview
          </Link>
        </div>
        <p className="text-sm text-[#F5F1E8]/60">Autonomous execution queue — drafts, follow-ups, and deal stage updates.</p>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Queue Type</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Title</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Entity</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Market</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Category</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Priority</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Status</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-[#F5F1E8]/60 text-xs font-mono">{item.queue_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 font-medium text-[#F5F1E8] max-w-[220px]">{item.title}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/70 text-xs">{item.entity_label}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/70">{item.market}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/60 text-xs">{item.category.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityColors[item.priority] ?? priorityColors.low}`}>
                    {item.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[item.status] ?? statusColors.complete}`}>
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#F5F1E8]/50 text-xs">
                  {item.due_date
                    ? new Date(item.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[#F5F1E8]/40">No execution queue items found.</p>
        )}
      </div>
    </section>
  )
}
