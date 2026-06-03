import { requireAdminAuth } from '@/lib/auth/adminGuard'
import Link from 'next/link'
import {
  listIaAgentTasks,
  listIaSignals,
  listIaSources,
  listIaEvidence,
  listIaScoringRecords,
} from '@/lib/intelligence-automation/db'

const NAV = [
  { href: '/admin/agents/watchers',         label: 'Watchers',          desc: 'Source watchers by market and type' },
  { href: '/admin/agents/queues',           label: 'Agent Queue',       desc: 'Pending and in-progress agent tasks' },
  { href: '/admin/agents/adapters',         label: 'Source Adapters',   desc: 'Adapter health and configuration status' },
  { href: '/admin/agents/signals',          label: 'Extracted Signals', desc: 'Commercial signals pending review' },
  { href: '/admin/agents/scoring',          label: 'Scoring & Memory',  desc: 'Counterparty score and relationship updates' },
  { href: '/admin/agents/routing',          label: 'Predictive Routing', desc: 'Routing and intro matching suggestions' },
  { href: '/admin/agents/evidence-actions', label: 'Evidence & Actions', desc: 'Triggered actions and execution tasks' },
  { href: '/admin/agents/runs',             label: 'Agent Runs',        desc: 'Run history and performance log' },
]

const STATUS_PILL: Record<string, string> = {
  pending:     'bg-amber-950 text-amber-300',
  in_progress: 'bg-sky-950 text-sky-300',
  done:        'bg-emerald-950 text-emerald-300',
  blocked:     'bg-red-950 text-red-300',
  deferred:    'bg-zinc-800 text-zinc-400',
}

const PRIORITY_PILL: Record<string, string> = {
  urgent: 'border-red-400/40 text-red-300',
  high:   'border-amber-400/40 text-amber-300',
  medium: 'border-sky-400/40 text-sky-300',
  low:    'border-white/20 text-white/40',
}

export default async function AgentsHubPage() {
  await requireAdminAuth()

  const [tasksResult, signalsResult, sourcesResult, evidenceResult, scoringResult] = await Promise.all([
    listIaAgentTasks(),
    listIaSignals(),
    listIaSources(),
    listIaEvidence(),
    listIaScoringRecords(),
  ])

  const tasks    = tasksResult.ok    ? tasksResult.data    : []
  const signals  = signalsResult.ok  ? (Array.isArray((signalsResult as any).data) ? (signalsResult as any).data : []) : []
  const sources  = sourcesResult.ok  ? sourcesResult.data  : []
  const evidence = evidenceResult.ok ? evidenceResult.data : []
  const scoring  = scoringResult.ok  ? scoringResult.data  : []

  // Derive signal array regardless of { source, data } wrapper
  const signalRows = signals.length ? signals : 
    (signalsResult.ok && (signalsResult as any).data?.data ? (signalsResult as any).data.data : [])

  const urgentTasks    = tasks.filter((t: any) => t.priority === 'urgent' && ['pending','in_progress'].includes(t.status)).length
  const activeTasks    = tasks.filter((t: any) => ['pending','in_progress'].includes(t.status)).length
  const pendingSignals = signalRows.filter((s: any) => s.stage === 'needs_review' || s.stage === 'detected').length
  const activeSources  = sources.filter((s: any) => s.status === 'active').length
  const pendingEvidence = evidence.filter((e: any) => e.reviewStatus === 'pending').length
  const pendingScoring  = scoring.filter((s: any) => !s.scoredAt || s.scoredAt === '').length

  const recentTasks = [...tasks]
    .sort((a: any, b: any) => b.createdAt?.localeCompare(a.createdAt ?? '') ?? 0)
    .slice(0, 8)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#f5f1e8]">Intelligence Agents</h1>
        <p className="mt-1 text-sm text-white/50">Watcher management, signal review, scoring, routing, and execution tasks — live from Supabase.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Active sources',   value: activeSources,    sub: `of ${sources.length} total` },
          { label: 'Active tasks',     value: activeTasks,      sub: `${urgentTasks} urgent` },
          { label: 'Pending signals',  value: pendingSignals,   sub: 'awaiting review' },
          { label: 'Pending evidence', value: pendingEvidence,  sub: 'in review queue' },
          { label: 'Scoring pending',  value: pendingScoring,   sub: 'counterparties' },
          { label: 'Total tasks',      value: tasks.length,     sub: 'all time' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-[#0b1a2f] p-4 text-center">
            <div className="text-2xl font-semibold text-[#f5f1e8]">{s.value}</div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">{s.label}</div>
            <div className="mt-0.5 text-[10px] text-white/30">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {tasks.length === 0 && signals.length === 0 && sources.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-[#080f1a] p-10 text-center">
          <p className="text-[#f5f1e8]/60">No agent data yet. The intelligence pipeline populates automatically as sources are crawled and signals are extracted.</p>
          <Link href="/admin/intelligence-automation/sources" className="mt-4 inline-block rounded-full border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10">
            Configure sources →
          </Link>
        </div>
      )}

      {/* Nav grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {NAV.map(n => (
          <Link key={n.href} href={n.href}
            className="group rounded-xl border border-white/10 bg-[#0b1a2f] p-4 transition hover:border-gold/30 hover:bg-[#10213a]">
            <div className="text-sm font-semibold text-[#f5f1e8] group-hover:text-gold">{n.label}</div>
            <div className="mt-1 text-[11px] leading-relaxed text-white/40">{n.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent tasks */}
      {recentTasks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold/70">Recent agent tasks</h2>
            <Link href="/admin/agents/queues" className="text-xs text-white/40 hover:text-white/70">View all →</Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080f1a]">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-black/30 text-[10px] uppercase tracking-[0.16em] text-gold/60">
                <tr>
                  <th className="p-3">Task</th>
                  <th className="p-3">Queue</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentTasks.map((t: any) => (
                  <tr key={t.id} className="align-top transition hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="font-medium text-[#f5f1e8]">{t.title || 'Untitled task'}</div>
                      {t.objectLabel && <div className="mt-0.5 text-[11px] text-white/35">{t.objectLabel}</div>}
                    </td>
                    <td className="p-3 text-[11px] text-white/50">{t.queue || t.agentLabel || '—'}</td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${PRIORITY_PILL[t.priority] ?? 'border-white/15 text-white/35'}`}>
                        {t.priority || '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_PILL[t.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                        {t.status?.replace(/_/g, ' ') || '—'}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-white/35">{t.createdAt || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
