import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { predictiveRouting } from '@/lib/fixtures/agents_fixtures'

const PRIORITY: Record<string, string> = {
  urgent: 'bg-red-950 text-red-400',
  high: 'bg-orange-950 text-orange-400',
  medium: 'bg-amber-950 text-amber-400',
  low: 'bg-zinc-800 text-zinc-400',
}

function ConfidenceBar({ score }: { score: number }) {
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

export default async function RoutingPage() {
  await requireAdminAuth()

  const sorted = [...predictiveRouting].sort((a, b) => {
    const p: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    return (p[a.priority] ?? 9) - (p[b.priority] ?? 9)
  })

  const counts = {
    urgent: predictiveRouting.filter(r => r.priority === 'urgent').length,
    high: predictiveRouting.filter(r => r.priority === 'high').length,
    medium: predictiveRouting.filter(r => r.priority === 'medium').length,
    low: predictiveRouting.filter(r => r.priority === 'low').length,
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
        <p className="text-sm text-zinc-500 mt-1">Agent-generated intro matching, routing, and commercial action suggestions.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        {Object.entries(counts).filter(([, n]) => n > 0).map(([priority, n]) => (
          <div key={priority} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY[priority]}`}>{priority}</span>
            <span className="text-lg font-bold text-zinc-100">{n}</span>
          </div>
        ))}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-medium">total</span>
          <span className="text-lg font-bold text-zinc-100">{predictiveRouting.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map(r => (
          <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 pt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY[r.priority]}`}>{r.priority}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-zinc-100 text-sm font-semibold leading-snug">{r.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500 font-mono">{r.type}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-xs text-zinc-500">{r.market}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-xs text-zinc-500">{r.category}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <ConfidenceBar score={r.confidenceScore} />
                    <div className="text-xs text-zinc-600 mt-1">{r.createdAt}</div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{r.rationale}</p>
                <div className="mt-3 flex items-start gap-2">
                  <span className="text-xs text-zinc-600 flex-shrink-0 pt-0.5">→</span>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">{r.suggestedAction}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
