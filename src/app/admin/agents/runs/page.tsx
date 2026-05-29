import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { agentRuns } from '@/lib/fixtures/agents_fixtures'

const RUN_STATUS: Record<string, string> = {
  success: 'bg-green-950 text-green-400',
  partial: 'bg-amber-950 text-amber-400',
  failed: 'bg-red-950 text-red-400',
}

export default async function AgentRunsPage() {
  await requireAdminAuth()

  const sorted = [...agentRuns].sort(
    (a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime()
  )

  const totalSignals = agentRuns.reduce((s, r) => s + r.signalsExtracted, 0)
  const totalTasks = agentRuns.reduce((s, r) => s + r.tasksCreated, 0)
  const successRate = Math.round(
    (agentRuns.filter(r => r.status === 'success').length / agentRuns.length) * 100
  )

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
          <Link href="/admin/agents" className="hover:text-zinc-300">Agents</Link>
          <span>/</span>
          <span className="text-zinc-300">Agent Runs</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Agent Run History</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Runs', value: agentRuns.length },
          { label: 'Success Rate', value: `${successRate}%` },
          { label: 'Signals Extracted', value: totalSignals },
          { label: 'Tasks Created', value: totalTasks },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-zinc-100">{s.value}</div>
            <div className="text-xs text-zinc-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Run At', 'Agent Type', 'Watcher', 'Duration', 'Status', 'Signals', 'Tasks', 'Notes'].map((h, i) => (
                <th key={h} className={`px-4 py-2.5 text-zinc-400 font-medium text-xs ${i >= 5 && i <= 6 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {sorted.map(r => (
              <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{r.runAt.slice(0, 16).replace('T', ' ')}</td>
                <td className="px-4 py-3 text-zinc-300 font-mono text-xs whitespace-nowrap">{r.agentType}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs max-w-48 truncate">{r.watcherName ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{r.duration}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RUN_STATUS[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-zinc-300 text-xs text-right">{r.signalsExtracted}</td>
                <td className="px-4 py-3 text-zinc-300 text-xs text-right">{r.tasksCreated}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs max-w-64">{r.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
