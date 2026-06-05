import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { listIaEvidence, listIaAgentTasks } from '@/lib/intelligence-automation/db'
const EVIDENCE_STATUS: Record<string, string> = {
  pending:  'bg-zinc-800 text-zinc-300',
  reviewed: 'bg-blue-950 text-blue-400',
  approved: 'bg-green-950 text-green-400',
  rejected: 'bg-red-950 text-red-400',
}
const TASK_STATUS: Record<string, string> = {
  pending:                 'bg-zinc-800 text-zinc-300',
  in_progress:             'bg-blue-950 text-blue-400',
  completed:               'bg-green-950 text-green-400',
  deferred:                'bg-zinc-800 text-zinc-500',
  escalated:               'bg-purple-950 text-purple-400',
}
const PRIORITY: Record<string, string> = {
  urgent: 'bg-red-950 text-red-400',
  high:   'bg-orange-950 text-orange-400',
  medium: 'bg-amber-950 text-amber-400',
  low:    'bg-zinc-800 text-zinc-400',
}

export default async function EvidenceActionsPage() {
  await requireAdminAuth()

  const [evidenceRes, tasksRes] = await Promise.all([
    listIaEvidence(),
    listIaAgentTasks(),
  ])

  const evidence = evidenceRes.ok ? evidenceRes.data : []
  const tasks = tasksRes.ok ? tasksRes.data : []

  const activeEvidence = evidence.filter(e => e.reviewStatus === 'pending' || e.reviewStatus === 'reviewed')
  const sortedTasks    = [...tasks].sort((a, b) => {
    const sp: Record<string, number> = { pending: 0, in_progress: 1, escalated: 2, deferred: 3, completed: 4 }
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
{/* Evidence Vault */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Evidence Vault</h2>
          <div className="flex gap-3 text-xs text-zinc-500">
            <span>{evidence.filter(e => e.reviewStatus === 'pending').length} pending</span>
            <span>·</span>
            <span>{evidence.filter(e => e.reviewStatus === 'reviewed').length} approved</span>
            <span>·</span>
            <span>{evidence.length} total</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {evidence.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-500">No evidence records found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Title', 'Type', 'Counterparty', 'Market', 'Tags', 'Added', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-zinc-400 font-medium text-xs text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {activeEvidence.map(e => (
                  <tr key={e.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-200 text-xs font-medium max-w-sm leading-relaxed">{e.title}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">{e.type}</td>
                    <td className="px-4 py-3 text-zinc-300 text-xs">{e.linkedCounterpartyName ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{e.linkedMarket ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {e.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{e.addedAt.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EVIDENCE_STATUS[e.reviewStatus] ?? 'bg-zinc-800 text-zinc-400'}`}>
                        {e.reviewStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Agent Tasks as Execution Queue */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Execution Task Queue</h2>
          <div className="flex gap-3 text-xs text-zinc-500">
            <span>{tasks.filter(t => t.status === 'pending').length} pending</span>
            <span>·</span>
            <span>{tasks.filter(t => t.status === 'in_progress').length} in progress</span>
            <span>·</span>
            <span>{tasks.filter(t => t.status === 'deferred').length} deferred</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {tasks.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-500">No tasks in queue.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Priority', 'Task', 'Queue', 'Agent', 'Status', 'Next Action', 'Created'].map(h => (
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
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{t.queue}</td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{t.agentLabel}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS[t.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs max-w-48">{t.nextAction}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{t.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )

}
