import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { listIaScoringRecords } from '@/lib/intelligence-automation/db'
// Map string priority to numeric representation for display/sorting
function priorityNum(p: string): number {
  if (p === 'high')   return 80
  if (p === 'medium') return 50
  return 20
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-zinc-600'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-zinc-300 font-medium">{score}</span>
    </div>
  )
}

const TIER_LABEL = (priority: number) =>
  priority >= 80 ? { label: 'urgent', cls: 'bg-red-950 text-red-400' } :
  priority >= 60 ? { label: 'high',   cls: 'bg-orange-950 text-orange-400' } :
  priority >= 40 ? { label: 'medium', cls: 'bg-amber-950 text-amber-400' } :
                   { label: 'low',    cls: 'bg-zinc-800 text-zinc-400' }

export default async function RoutingPage() {
  await requireAdminAuth()

  const result  = await listIaScoringRecords()
  const records = result.ok ? result.data : []

  const sorted = [...records].sort((a, b) => priorityNum(b.routingPriority) - priorityNum(a.routingPriority))

  const counts = {
    urgent: records.filter(r => priorityNum(r.routingPriority) >= 80).length,
    high:   records.filter(r => { const n = priorityNum(r.routingPriority); return n >= 60 && n < 80 }).length,
    medium: records.filter(r => { const n = priorityNum(r.routingPriority); return n >= 40 && n < 60 }).length,
    low:    records.filter(r => priorityNum(r.routingPriority) < 40).length,
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
        <p className="text-sm text-zinc-500 mt-1">Counterparties ranked by routing priority score — highest introduction and commercial fit first.</p>
      </div>
<div className="flex gap-3 flex-wrap">
        {Object.entries(counts).filter(([, n]) => n > 0).map(([tier, n]) => {
          const { label, cls } = TIER_LABEL(tier === 'urgent' ? 80 : tier === 'high' ? 60 : tier === 'medium' ? 40 : 0)
          return (
            <div key={tier} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
              <span className="text-lg font-bold text-zinc-100">{n}</span>
            </div>
          )
        })}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-medium">total</span>
          <span className="text-lg font-bold text-zinc-100">{records.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-8 text-center text-xs text-zinc-500">No scoring records found.</div>
        ) : sorted.map(r => {
          const tier = TIER_LABEL(priorityNum(r.routingPriority))
          return (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tier.cls}`}>{tier.label}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-zinc-100 text-sm font-semibold leading-snug">{r.counterpartyName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500 font-mono">{r.counterpartyRole}</span>
                        {r.marketAccessRelevance.slice(0, 2).map(m => (
                          <span key={m} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{m}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-zinc-600">Routing</span>
                        <ScoreBar score={priorityNum(r.routingPriority)} />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-zinc-600">Intro</span>
                        <ScoreBar score={priorityNum(r.introductionPriority)} />
                      </div>
                      <div className="text-xs text-zinc-600 mt-1">{r.scoredAt.slice(0, 10)}</div>
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
                      {r.scoreDrivers.map(d => (
                        <span key={d} className="text-xs bg-zinc-800/60 text-zinc-500 px-2 py-0.5 rounded font-mono">{d}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
