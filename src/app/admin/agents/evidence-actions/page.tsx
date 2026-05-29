import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { evidenceTriggers, executionTasks } from '@/lib/fixtures/agents_fixtures'

const TRIGGER_STATUS: Record<string, string> = {
  triggered: 'bg-blue-950 text-blue-400',
  pending: 'bg-zinc-800 text-zinc-300',
  completed: 'bg-green-950 text-green-400',
}
const TASK_STATUS: Record<string, string> = {
  ready: 'bg-green-950 text-green-400',
  waiting_on_docs: 'bg-amber-950 text-amber-400',
  waiting_on_counterparty: 'bg-orange-950 text-orange-400',
  completed: 'bg-zinc-800 text-zinc-400',
  deferred: 'bg-zinc-800 text-zinc-500',
}
const PRIORITY: Record<string, string> = {
  urgent: 'bg-red-950 text-red-400',
  high: 'bg-orange-950 text-orange-400',
  medium: 'bg-amber-950 text-amber-400',
  low: 'bg-zinc-800 text-zinc-400',
}

export default async function EvidenceActionsPage() {
  await requireAdminAuth()

  const readyTasks = executionTasks.filter(t => t.status === 'ready')
  const waitingTasks = executionTasks.filter(t => t.status.startsWith('waiting'))
  const deferredTasks = executionTasks.filter(t => t.status === 'deferred')

  const sortedTasks = [...executionTasks].sort((a, b) => {
    const sp: Record<string, number> = { ready: 0, waiting_on_docs: 1, waiting_on_counterparty: 2, deferred: 3, completed: 4 }
    const pp: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    if (a.status !== b.status) return (sp[a.status] ?? 9) - (sp[b.status] ?? 9)
    return (pp[a.priority] ?? 9) - (pp[b.priority] ?? 9)
  })

  return (
    <div className="p-6 max-w-7xl space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
          <Link href="/admin/agents" className="hover:text-zinc-300">Agents</Link>
          <span>/</span>
          <span className="text-zinc-300">Evidence &amp; Actions</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Evidence &amp; Actions</h1>
      </div>

      {/* Evidence Triggers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Evidence → Action Triggers</h2>
          <div className="flex gap-3 text-xs text-zinc-500">
            <span>{evidenceTriggers.filter(e => e.status === 'triggered').length} triggered</span>
            <span>·</span>
            <span>{evidenceTriggers.filter(e => e.status === 'pending').length} pending</span>
            <span>·</span>
            <span>{evidenceTriggers.filter(e => e.status === 'completed').length} completed</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Evidence Type', 'Counterparty', 'Triggered Action', 'Market', 'Triggered At', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-zinc-400 font-medium text-xs text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {evidenceTriggers.map(e => (
                <tr key={e.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">{e.evidenceType}</td>
                  <td className="px-4 py-3 text-zinc-300 text-xs font-medium">{e.counterpartyName ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-64 leading-relaxed">{e.triggerAction}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{e.market}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{e.triggeredAt}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRIGGER_STATUS[e.status]}`}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Execution Tasks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Execution Automation Tasks</h2>
          <div className="flex gap-3 text-xs text-zinc-500">
            <span>{readyTasks.length} ready</span>
            <span>·</span>
            <span>{waitingTasks.length} waiting</span>
            <span>·</span>
            <span>{deferredTasks.length} deferred</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Priority', 'Task', 'Market', 'Type', 'Status', 'Due Date', 'Notes'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-zinc-400 font-medium text-xs text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sortedTasks.map(t => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY[t.priority]}`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-200 text-xs font-medium max-w-sm leading-relaxed">{t.title}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{t.market}</td>
                  <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{t.taskType}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS[t.status]}`}>{t.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{t.dueDate ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs max-w-48">{t.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
