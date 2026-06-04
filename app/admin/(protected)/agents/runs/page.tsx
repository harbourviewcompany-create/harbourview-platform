import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { listIaFeedbackEvents } from '@/lib/intelligence-automation/db'
import { FixtureBanner } from '@/components/admin/FixtureBanner'

const OUTCOME_COLORS: Record<string, string> = {
  introduction_made:    'bg-green-950 text-green-400',
  signal_validated:     'bg-blue-950 text-blue-400',
  score_adjusted:       'bg-amber-950 text-amber-400',
  route_rejected:       'bg-red-950 text-red-400',
  evidence_uploaded:    'bg-purple-950 text-purple-400',
  counterparty_updated: 'bg-indigo-950 text-indigo-400',
}
const SCORE_IMPACT_COLOR = (impact: string | undefined) => {
  if (!impact) return 'text-zinc-500'
  const n = parseFloat(impact)
  if (isNaN(n)) return 'text-zinc-400'
  return n > 0 ? 'text-green-400' : n < 0 ? 'text-red-400' : 'text-zinc-400'
}

export default async function AgentRunsPage() {
  await requireAdminAuth()

  const result   = await listIaFeedbackEvents()
  const events = result.ok ? result.data : []
  const sorted   = [...events].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())

  const byOutcome = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.outcomeType] = (acc[e.outcomeType] ?? 0) + 1
    return acc
  }, {})
  const topOutcome = Object.entries(byOutcome).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
          <Link href="/admin/agents" className="hover:text-zinc-300">Agents</Link>
          <span>/</span>
          <span className="text-zinc-300">Agent Runs</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Intelligence Event Log</h1>
        <p className="text-sm text-zinc-500 mt-1">Logged outcomes, feedback events, and scoring impacts from agent operations.</p>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Events',      value: events.length },
          { label: 'Outcome Types',     value: Object.keys(byOutcome).length },
          { label: 'Top Outcome',       value: topOutcome ? topOutcome[0].replace(/_/g, ' ') : '—' },
          { label: 'Markets Covered',   value: new Set(events.map(e => e.market)).size },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-xl font-bold text-zinc-100 leading-tight">{s.value}</div>
            <div className="text-xs text-zinc-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-zinc-500">No feedback events logged yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Logged', 'Outcome', 'Counterparty', 'Market', 'Category', 'Score Impact', 'Routing Impact', 'Notes'].map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 text-zinc-400 font-medium text-xs ${i >= 5 && i <= 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sorted.map(r => (
                <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{r.loggedAt.slice(0, 16).replace('T', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${OUTCOME_COLORS[r.outcomeType] ?? 'bg-zinc-800 text-zinc-400'}`}>
                      {r.outcomeType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-xs">{r.counterpartyName ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{r.market}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{r.category}</td>
                  <td className={`px-4 py-3 text-xs text-right font-medium ${SCORE_IMPACT_COLOR(r.scoreImpact?.toString())}`}>
                    {r.scoreImpact !== undefined ? (r.scoreImpact > 0 ? `+${r.scoreImpact}` : r.scoreImpact) : '—'}
                  </td>
                  <td className={`px-4 py-3 text-xs text-right font-medium ${SCORE_IMPACT_COLOR(r.routingImpact?.toString())}`}>
                    {r.routingImpact !== undefined ? (r.routingImpact > 0 ? `+${r.routingImpact}` : r.routingImpact) : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs max-w-64">{r.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
