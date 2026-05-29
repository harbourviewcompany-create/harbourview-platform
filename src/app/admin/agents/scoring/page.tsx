import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { scoringUpdates, memoryUpdates } from '@/lib/fixtures/agents_fixtures'

const STATUS: Record<string, string> = {
  pending: 'bg-zinc-800 text-zinc-300',
  applied: 'bg-green-950 text-green-400',
  rejected: 'bg-red-950 text-red-400',
}
const CONF: Record<string, string> = {
  high: 'bg-emerald-950 text-emerald-400',
  medium: 'bg-amber-950 text-amber-400',
  low: 'bg-zinc-800 text-zinc-400',
}

export default async function ScoringMemoryPage() {
  await requireAdminAuth()

  const pendingScores = scoringUpdates.filter(s => s.status === 'pending').length
  const appliedScores = scoringUpdates.filter(s => s.status === 'applied').length
  const pendingMemory = memoryUpdates.filter(m => m.status === 'pending').length
  const appliedMemory = memoryUpdates.filter(m => m.status === 'applied').length

  const sortedScores = [...scoringUpdates].sort((a, b) => {
    const p: Record<string, number> = { pending: 0, applied: 1, rejected: 2 }
    return (p[a.status] ?? 9) - (p[b.status] ?? 9)
  })
  const sortedMemory = [...memoryUpdates].sort((a, b) => {
    const p: Record<string, number> = { pending: 0, applied: 1, rejected: 2 }
    return (p[a.status] ?? 9) - (p[b.status] ?? 9)
  })

  return (
    <div className="p-6 max-w-7xl space-y-8">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
          <Link href="/admin/agents" className="hover:text-zinc-300">Agents</Link>
          <span>/</span>
          <span className="text-zinc-300">Scoring &amp; Memory</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Scoring &amp; Memory Updates</h1>
      </div>

      {/* Scoring section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Counterparty Score Updates</h2>
          <div className="flex gap-2">
            <span className="text-xs text-zinc-500">{pendingScores} pending</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">{appliedScores} applied</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Counterparty', 'Score Type', 'Current → Suggested', 'Driver', 'Confidence', 'Suggested', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-zinc-400 font-medium text-xs text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sortedScores.map(s => {
                const delta = s.suggestedValue - s.currentValue
                return (
                  <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-200 text-xs font-medium whitespace-nowrap">{s.counterpartyName}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{s.scoreType}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-400">{s.currentValue}</span>
                        <span className="text-zinc-600">→</span>
                        <span className="text-zinc-100 font-semibold">{s.suggestedValue}</span>
                        <span className={`text-xs font-medium ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs max-w-64 leading-relaxed">{s.driver}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONF[s.confidence]}`}>{s.confidence}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{s.suggestedAt}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS[s.status]}`}>{s.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Memory section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Relationship Memory Updates</h2>
          <div className="flex gap-2">
            <span className="text-xs text-zinc-500">{pendingMemory} pending</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">{appliedMemory} applied</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Counterparty', 'Update Type', 'Previous Value', 'Suggested Value', 'Source', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-zinc-400 font-medium text-xs text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sortedMemory.map(m => (
                <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-200 text-xs font-medium whitespace-nowrap">{m.counterpartyName}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{m.updateType}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs max-w-48 leading-relaxed">{m.previousValue ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-300 text-xs max-w-64 leading-relaxed">{m.suggestedValue}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs max-w-40">{m.source}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS[m.status]}`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
