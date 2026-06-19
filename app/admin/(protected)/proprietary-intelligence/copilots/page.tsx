import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listCopilotTasks } from '@/lib/proprietary-intelligence/admin'

export const dynamic = 'force-dynamic'

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/15 text-red-400 border border-red-500/25',
  medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  low: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
}

const statusColors: Record<string, string> = {
  ready: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  in_progress: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  pending_review: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  complete: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
}

export default async function CopilotsPage() {
  await requireAdminAuth()
  const result = await listCopilotTasks()
  const tasks = result.ok ? (result.data ?? []) : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Proprietary Intelligence</p>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">AI Copilot Tasks</h1>
          <Link href="/admin/proprietary-intelligence" className="text-xs text-[#C6A55A] hover:underline">
            ← Overview
          </Link>
        </div>
        <p className="text-sm text-[#F5F1E8]/60">Pending and active copilot tasks across sourcing, deal flow, and introductions.</p>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Copilot</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Title</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Summary</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Market</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Category</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Priority</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-[#F5F1E8]/60 text-xs font-mono">{task.copilot.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 font-medium text-[#F5F1E8] max-w-[200px]">{task.title}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/55 text-xs max-w-[300px]">{task.summary}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/70">{task.market}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/60 text-xs">{task.category.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityColors[task.priority] ?? priorityColors.low}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[task.status] ?? statusColors.complete}`}>
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[#F5F1E8]/40">No copilot tasks found.</p>
        )}
      </div>
    </section>
  )
}
