import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listOperatorWorkflowItems } from '@/lib/enterprise/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function priorityPill(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-950 text-red-400 border border-red-400/20'
    case 'medium':
      return 'bg-amber-950 text-amber-400 border border-amber-400/20'
    case 'low':
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
    default:
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ')
}

export default async function OperatorsPage() {
  await requireAdminAuth()

  const result = await listOperatorWorkflowItems()
  const items = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Enterprise Coordination</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Operator Workflows</h1>
          <p className="mt-1 text-sm text-zinc-400">
            My queue, team queue, follow-ups, approvals, and handoffs
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

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/25">
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Title</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Owner</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Status</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Priority</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Market</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Category</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-[#F5F1E8] font-medium max-w-xs">
                    <div>{item.title}</div>
                    {item.notes && (
                      <div className="text-xs text-zinc-500 mt-0.5 truncate">{item.notes}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{item.owner}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{statusLabel(item.status)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${priorityPill(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-300">
                      {item.market}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{item.category}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {item.due_date ?? <span className="text-zinc-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
