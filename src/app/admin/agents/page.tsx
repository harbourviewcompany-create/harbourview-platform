import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import {
  watchers, adapters, extractedSignals, agentQueueItems,
  scoringUpdates, executionTasks, agentRuns,
} from '@/lib/fixtures/agents_fixtures'

const NAV = [
  { href: '/admin/agents/watchers', label: 'Watchers', desc: 'Source watchers by market and type' },
  { href: '/admin/agents/queues', label: 'Agent Queue', desc: 'Pending and in-progress agent tasks' },
  { href: '/admin/agents/adapters', label: 'Source Adapters', desc: 'Adapter health and configuration status' },
  { href: '/admin/agents/signals', label: 'Extracted Signals', desc: 'Commercial signals pending review' },
  { href: '/admin/agents/scoring', label: 'Scoring & Memory', desc: 'Counterparty score and relationship updates' },
  { href: '/admin/agents/routing', label: 'Predictive Routing', desc: 'Routing and intro matching suggestions' },
  { href: '/admin/agents/evidence-actions', label: 'Evidence & Actions', desc: 'Triggered actions and execution tasks' },
  { href: '/admin/agents/runs', label: 'Agent Runs', desc: 'Run history and performance log' },
]

const STATUS_RUN: Record<string, string> = {
  success: 'bg-green-950 text-green-400',
  partial: 'bg-amber-950 text-amber-400',
  failed: 'bg-red-950 text-red-400',
}

export default async function AgentsHubPage() {
  await requireAdminAuth()

  const activeWatchers = watchers.filter(w => w.status === 'active').length
  const pendingSignals = extractedSignals.filter(s => s.reviewStatus === 'pending').length
  const urgentQueue = agentQueueItems.filter(i => i.priority === 'urgent' && ['pending', 'in_progress'].includes(i.status)).length
  const activeQueue = agentQueueItems.filter(i => ['pending', 'in_progress'].includes(i.status)).length
  const readyTasks = executionTasks.filter(t => t.status === 'ready').length
  const pendingScoring = scoringUpdates.filter(s => s.status === 'pending').length
  const degradedAdapters = adapters.filter(a => ['degraded', 'error', 'not_tested'].includes(a.health)).length

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Intelligence Agents</h1>
        <p className="text-sm text-zinc-500 mt-1">Watcher management, signal review, scoring updates, routing, and execution tasks.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Watchers', value: activeWatchers, sub: `of ${watchers.length} total` },
          { label: 'Pending Signals', value: pendingSignals, sub: 'awaiting review' },
          { label: 'Queue Items', value: activeQueue, sub: `${urgentQueue} urgent` },
          { label: 'Ready Tasks', value: readyTasks, sub: `${pendingScoring} scoring pending` },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-zinc-100">{s.value}</div>
            <div className="text-sm font-medium text-zinc-300 mt-0.5">{s.label}</div>
            <div className="text-xs text-zinc-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {degradedAdapters > 0 && (
        <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-800/50 rounded-lg px-4 py-3 text-sm text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          <span>{degradedAdapters} adapter{degradedAdapters > 1 ? 's' : ''} degraded or untested — check adapter health.</span>
          <Link href="/admin/agents/adapters" className="ml-auto text-amber-400 hover:text-amber-200 underline underline-offset-2 whitespace-nowrap">Review adapters</Link>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {NAV.map(n => (
          <Link key={n.href} href={n.href}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-lg p-4 group transition-colors">
            <div className="font-semibold text-sm text-zinc-200 group-hover:text-white">{n.label}</div>
            <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{n.desc}</div>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent Agent Runs</h2>
          <Link href="/admin/agents/runs" className="text-xs text-zinc-500 hover:text-zinc-300">View all →</Link>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Agent Type', 'Watcher', 'Run At', 'Duration', 'Status', 'Signals', 'Tasks'].map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 text-zinc-400 font-medium text-xs ${i >= 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {agentRuns.slice(0, 6).map(r => (
                <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-zinc-300 font-mono text-xs">{r.agentType}</td>
                  <td className="px-4 py-2.5 text-zinc-400 text-xs max-w-48 truncate">{r.watcherName ?? '—'}</td>
                  <td className="px-4 py-2.5 text-zinc-400 text-xs whitespace-nowrap">{r.runAt.slice(0, 16).replace('T', ' ')}</td>
                  <td className="px-4 py-2.5 text-zinc-400 text-xs">{r.duration}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_RUN[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-300 text-xs text-right">{r.signalsExtracted}</td>
                  <td className="px-4 py-2.5 text-zinc-300 text-xs text-right">{r.tasksCreated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
