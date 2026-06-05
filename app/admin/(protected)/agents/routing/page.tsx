import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { listIaScoringRecords } from '@/lib/intelligence-automation/db'
import type { ScoringRecord } from '@/lib/intelligence-automation/types'
// ia_scoring_records stores routing/follow_up/introduction_priority
// as text ('high'|'medium'|'low') — convert for display
function priorityToScore(p: string | undefined): number {
  if (p === 'high')   return 80
  if (p === 'medium') return 60
  if (p === 'low')    return 40
  return 0
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-zinc-600'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-zinc-300 font-medium">{score}</span>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string | undefined }) {
  const cls =
    priority === 'high'   ? 'bg-red-950 text-red-400' :
    priority === 'medium' ? 'bg-orange-950 text-orange-400' :
                            'bg-zinc-800 text-zinc-400'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {priority ?? 'low'}
    </span>
  )
}

export default async function RoutingPage() {
  await requireAdminAuth()

  const result  = await listIaScoringRecords()
  const records = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  const sorted = [...records].sort((a, b) =>
    priorityToScore(b.routingPriority) - priorityToScore(a.routingPriority)
  )

  const counts = {
    high:   records.filter((r: ScoringRecord) => r.routingPriority === 'high').length,
    medium: records.filter((r: ScoringRecord) => r.routingPriority === 'medium').length,
    low:    records.filter((r: ScoringRecord) => r.routingPriority === 'low' || !r.routingPriority).length,
  }

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
          <Link href="/admin/agents" className="hover:text-zinc-300">Agents</Link>
          <span>/</span>
          <span className="text-zinc-300">Predictive Routing</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Predictive Routing</h1>
        <p className="text-sm text-zinc-500 mt-1">Counterparties ranked by routing priority — highest introduction and commercial fit first.</p>
      </div>
<div className="flex gap-3 flex-wrap">
        {Object.entries(counts).map(([tier, n]) => (
          <div key={tier} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <PriorityBadge priority={tier} />
            <span className="text-lg font-bold text-zinc-100">{n}</span>
          </div>
        ))}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-medium">total</span>
          <span className="text-lg font-bold text-zinc-100">{records.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-8 text-center text-xs text-zinc-500">
            No scoring records found.
          </div>
        ) : sorted.map((r: ScoringRecord) => (
          <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 pt-0.5">
                <PriorityBadge priority={r.routingPriority} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-zinc-100 text-sm font-semibold">{r.counterpartyName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500 font-mono">{r.counterpartyRole}</span>
                      {r.marketAccessRelevance.slice(0, 2).map((m: string) => (
                        <span key={m} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right space-y-1.5">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-zinc-600">Routing</span>
                      <PriorityBadge priority={r.routingPriority} />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-zinc-600">Follow-up</span>
                      <PriorityBadge priority={r.followUpPriority} />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-zinc-600">Intro</span>
                      <PriorityBadge priority={r.introductionPriority} />
                    </div>
                    <div className="text-xs text-zinc-600 mt-1">{r.scoredAt?.slice(0, 10)}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-zinc-600 mb-1">Fit score</div>
                    <ScoreBar score={r.fitScore} />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600 mb-1">Readiness</div>
                    <ScoreBar score={r.readinessScore} />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600 mb-1">Trust</div>
                    <ScoreBar score={r.trustScore} />
                  </div>
                </div>
                {r.scoreDrivers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.scoreDrivers.map((d: string) => (
                      <span key={d} className="text-xs bg-zinc-800/60 text-zinc-500 px-2 py-0.5 rounded font-mono">{d}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
