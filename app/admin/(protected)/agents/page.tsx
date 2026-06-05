import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import {
  listIaSignals,
  listIaAgentTasks,
  listIaSources,
  listIaScoringRecords,
  listIaFeedbackEvents,
} from '@/lib/intelligence-automation/db'

const NAV = [
  { href: '/admin/agents/watchers',        label: 'Watchers',          desc: 'Source watchers by market and type' },
  { href: '/admin/agents/queues',          label: 'Agent Queue',       desc: 'Pending and in-progress agent tasks' },
  { href: '/admin/agents/adapters',        label: 'Source Adapters',   desc: 'Adapter health and configuration status' },
  { href: '/admin/agents/signals',         label: 'Extracted Signals', desc: 'Commercial signals pending review' },
  { href: '/admin/agents/scoring',         label: 'Scoring & Memory',  desc: 'Counterparty score and relationship updates' },
  { href: '/admin/agents/routing',         label: 'Predictive Routing',desc: 'Routing and intro matching suggestions' },
  { href: '/admin/agents/evidence-actions',label: 'Evidence & Actions',desc: 'Triggered actions and execution tasks' },
  { href: '/admin/agents/runs',            label: 'Agent Runs',        desc: 'Run history and performance log' },
]

const OUTCOME_COLORS: Record<string, string> = {
  introduction_made:       'bg-green-950 text-green-400',
  signal_validated:        'bg-blue-950 text-blue-400',
  score_adjusted:          'bg-amber-950 text-amber-400',
  route_rejected:          'bg-red-950 text-red-400',
  evidence_uploaded:       'bg-purple-950 text-purple-400',
  counterparty_updated:    'bg-indigo-950 text-indigo-400',
}

export default async function AgentsHubPage() {
  await requireAdminAuth()

  const [signalsRes, tasksRes, sourcesRes, scoringRes, feedbackRes] = await Promise.all([
    listIaSignals(),
    listIaAgentTasks(),
    listIaSources(),
    listIaScoringRecords(),
    listIaFeedbackEvents(),
  ])

  const signals = signalsRes.ok ? signalsRes.data : []
  const tasks = tasksRes.ok ? tasksRes.data : []
  const sources = sourcesRes.ok ? sourcesRes.data : []
  const feedback = feedbackRes.ok ? feedbackRes.data : []

  const activeWatchers = sources.filter(s => s.status === 'active').length
  const pendingSignals  = signals.filter(s => s.stage === 'new' || s.stage === 'needs_review').length
  const urgentQueue     = tasks.filter(i => i.priority === 'urgent' && ['pending', 'in_progress'].includes(i.status)).length
  const activeQueue     = tasks.filter(i => ['pending', 'in_progress'].includes(i.status)).length
  const degradedSources = sources.filter(s => s.status === 'paused' || s.status === 'deprecated').length

  const recentEvents = [...feedback]
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
    .slice(0, 6)
  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Intelligence Agents</h1>
        <p className="text-sm text-zinc-500 mt-1">Watcher management, signal review, scoring updates, routing, and execution tasks.</p>
      </div>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Sources',    value: activeWatchers, sub: `of ${sources.length} total` },
          { label: 'Pending Signals',   value: pendingSignals,  sub: 'awaiting review' },
          { label: 'Queue Items',       value: activeQueue,     sub: `${urgentQueue} urgent` },
          { label: 'Feedback Events',   value: feedback.length, sub: 'logged outcomes' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-zinc-100">{s.value}</div>
            <div className="text-sm font-medium text-zinc-300 mt-0.5">{s.label}</div>
            <div className="text-xs text-zinc-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {degradedSources > 0 && (
        <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-800/50 rounded-lg px-4 py-3 text-sm text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          <span>{degradedSources} source{degradedSources > 1 ? 's' : ''} paused or in error — check adapter health.</span>
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
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent Intelligence Events</h2>
          <Link href="/admin/agents/runs" className="text-xs text-zinc-500 hover:text-zinc-300">View all →</Link>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {recentEvents.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-zinc-500">No feedback events logged yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Outcome Type', 'Counterparty', 'Market', 'Score Impact', 'Routing Impact', 'Logged'].map((h, i) => (
                    <th key={h} className={`px-4 py-2.5 text-zinc-400 font-medium text-xs ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {recentEvents.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${OUTCOME_COLORS[r.outcomeType] ?? 'bg-zinc-800 text-zinc-400'}`}>
                        {r.outcomeType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-300 text-xs">{r.counterpartyName ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-400 text-xs">{r.market}</td>
                    <td className="px-4 py-2.5 text-zinc-300 text-xs text-right font-medium">{r.scoreImpact ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-300 text-xs text-right font-medium">{r.routingImpact ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-400 text-xs text-right whitespace-nowrap">{r.loggedAt.slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )

}
