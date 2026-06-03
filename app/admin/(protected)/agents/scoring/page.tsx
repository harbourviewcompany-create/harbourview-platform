import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { listIaScoringRecords, listIaCounterparties } from '@/lib/intelligence-automation/db'

const DOC_STATUS: Record<string, string> = {
  complete:    'bg-green-950 text-green-400',
  partial:     'bg-amber-950 text-amber-400',
  pending:     'bg-zinc-800 text-zinc-300',
  not_started: 'bg-zinc-800 text-zinc-500',
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-zinc-300 font-medium tabular-nums">{score}</span>
    </div>
  )
}

export default async function ScoringMemoryPage() {
  await requireAdminAuth()

  const [scoringRes, counterpartiesRes] = await Promise.all([
    listIaScoringRecords(),
    listIaCounterparties(),
  ])

  const scores       = scoringRes.data       ?? []
  const counterparties = counterpartiesRes.data ?? []

  const sortedScores = [...scores].sort((a, b) => b.routingPriority - a.routingPriority)
  const sortedMemory = [...counterparties].sort((a, b) => b.interactionCount - a.interactionCount)

  return (
    <div className="p-6 max-w-7xl space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
          <Link href="/admin/agents" className="hover:text-zinc-300">Agents</Link>
          <span>/</span>
          <span className="text-zinc-300">Scoring &amp; Memory</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Scoring &amp; Memory</h1>
      </div>

      {/* Scoring */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Counterparty Scores</h2>
          <span className="text-xs text-zinc-500">{scores.length} records · ranked by routing priority</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {sortedScores.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-500">No scoring records found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Counterparty', 'Role', 'Fit', 'Readiness', 'Trust', 'Routing Priority', 'Scored At', 'Drivers'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-zinc-400 font-medium text-xs text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {sortedScores.map(s => (
                  <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-200 text-xs font-medium whitespace-nowrap">{s.counterpartyName}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{s.counterpartyRole}</td>
                    <td className="px-4 py-3"><ScoreBar score={s.fitScore} /></td>
                    <td className="px-4 py-3"><ScoreBar score={s.readinessScore} /></td>
                    <td className="px-4 py-3"><ScoreBar score={s.trustScore} /></td>
                    <td className="px-4 py-3 text-zinc-200 text-xs font-semibold">{s.routingPriority}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{s.scoredAt.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs max-w-48 leading-relaxed">
                      {s.scoreDrivers.slice(0, 2).join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Relationship Memory */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Relationship Memory</h2>
          <span className="text-xs text-zinc-500">{counterparties.length} counterparties tracked</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {sortedMemory.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-500">No counterparty records found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Name', 'Role', 'Markets', 'Interactions', 'Intros', 'Doc Status', 'Notes'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-zinc-400 font-medium text-xs text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {sortedMemory.map(m => (
                  <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-200 text-xs font-medium whitespace-nowrap">{m.name}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{m.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.markets.slice(0, 3).map(mk => (
                          <span key={mk} className="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">{mk}</span>
                        ))}
                        {m.markets.length > 3 && <span className="text-xs text-zinc-600">+{m.markets.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 text-xs font-medium">{m.interactionCount}</td>
                    <td className="px-4 py-3 text-zinc-300 text-xs font-medium">{m.introductionCount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOC_STATUS[m.documentationStatus] ?? 'bg-zinc-800 text-zinc-400'}`}>
                        {m.documentationStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs max-w-48">{m.notes ?? '—'}</td>
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
