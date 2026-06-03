import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { listIaAgentTasks } from '@/lib/intelligence-automation/db'

const PRIORITY: Record<string, string> = {
  urgent: 'bg-red-950 text-red-400',
  high:   'bg-orange-950 text-orange-400',
  medium: 'bg-amber-950 text-amber-400',
  low:    'bg-zinc-800 text-zinc-400',
}
const STATUS: Record<string, string> = {
  pending:    'bg-zinc-800 text-zinc-300',
  in_progress:'bg-blue-950 text-blue-400',
  completed:  'bg-green-950 text-green-400',
  escalated:  'bg-purple-950 text-purple-400',
  deferred:   'bg-zinc-800 text-zinc-500',
}

export default async function QueuesPage() {
  await requireAdminAuth()

  const result = await listIaAgentTasks()
  const items  = result.data ?? []

  const active = items.filter(i => ['pending', 'in_progress'].includes(i.status))
  const sorted = [...active].sort((a, b) => {
    const p: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    return (p[a.priority] ?? 9) - (p[b.priority] ?? 9)
  })

  const counts = {
    urgent:      items.filter(i => i.priority === 'urgent').length,
    pending:     items.filter(i => i.status === 'pending').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    deferred:    items.filter(i => i.status === 'deferred').length,
  }

  const deferred = items.filter(i => i.status === 'deferred')

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
          <Link href="/admin/agents" className="hover:text-zinc-300">Agents</Link>
          <span>/</span>
          <span className="text-zinc-300">Agent Queue</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Agent Queue</h1>
      </div>

      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'urgent',      value: counts.urgent,      cls: 'bg-red-950 text-red-400' },
          { label: 'pending',     value: counts.pending,     cls: 'bg-zinc-800 text-zinc-300' },
          { label: 'in progress', value: counts.in_progress, cls: 'bg-blue-950 text-blue-400' },
          { label: 'deferred',    value: counts.deferred,    cls: 'bg-zinc-800 text-zinc-500' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
            <span className="text-lg font-bold text-zinc-100">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-zinc-500">Queue is clear.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Priority', 'Queue', 'Task', 'Object', 'Status', 'Next Action', 'Created'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-zinc-400 font-medium text-xs text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sorted.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY[item.priority]}`}>{item.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">{item.queue}</td>
                  <td className="px-4 py-3 max-w-sm">
                    <div className="text-zinc-200 text-xs font-medium leading-relaxed">{item.title}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">{item.agentLabel}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-32 truncate">
                    <div>{item.objectType}</div>
                    <div className="text-zinc-600">{item.objectLabel}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS[item.status]}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-48">{item.nextAction}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{item.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deferred.length > 0 && (
        <details className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <summary className="px-4 py-3 text-xs text-zinc-400 font-medium cursor-pointer hover:text-zinc-200 select-none">
            Deferred items ({deferred.length})
          </summary>
          <div className="border-t border-zinc-800 divide-y divide-zinc-800/50">
            {deferred.map(item => (
              <div key={item.id} className="px-4 py-3 flex items-start gap-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${PRIORITY[item.priority]}`}>{item.priority}</span>
                <div>
                  <div className="text-zinc-400 text-xs font-medium">{item.title}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">{item.queue} · {item.nextAction}</div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
