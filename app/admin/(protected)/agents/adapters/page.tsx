import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { adapters } from '@/lib/fixtures/agents_fixtures'

const HEALTH: Record<string, string> = {
  healthy: 'bg-green-950 text-green-400',
  degraded: 'bg-amber-950 text-amber-400',
  error: 'bg-red-950 text-red-400',
  not_tested: 'bg-zinc-800 text-zinc-400',
}

export default async function AdaptersPage() {
  await requireAdminAuth()

  const counts = {
    healthy: adapters.filter(a => a.health === 'healthy').length,
    degraded: adapters.filter(a => a.health === 'degraded').length,
    error: adapters.filter(a => a.health === 'error').length,
    not_tested: adapters.filter(a => a.health === 'not_tested').length,
  }

  const sorted = [...adapters].sort((a, b) => {
    const p: Record<string, number> = { error: 0, degraded: 1, not_tested: 2, healthy: 3 }
    return (p[a.health] ?? 9) - (p[b.health] ?? 9)
  })

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
          <Link href="/admin/agents" className="hover:text-zinc-300">Agents</Link>
          <span>/</span>
          <span className="text-zinc-300">Source Adapters</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Source Adapters</h1>
      </div>

      <div className="flex gap-3 flex-wrap">
        {Object.entries(counts).filter(([, n]) => n > 0).map(([health, n]) => (
          <div key={health} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HEALTH[health]}`}>{health.replace('_', ' ')}</span>
            <span className="text-lg font-bold text-zinc-100">{n}</span>
          </div>
        ))}
      </div>

      {counts.degraded + counts.error + counts.not_tested > 0 && (
        <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-800/50 rounded-lg px-4 py-3 text-sm text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1" />
          <span className="text-xs">
            {counts.degraded > 0 && `${counts.degraded} degraded — format or structure change likely. `}
            {counts.error > 0 && `${counts.error} in error state — immediate investigation required. `}
            {counts.not_tested > 0 && `${counts.not_tested} not yet validated — run test extraction before activating.`}
          </span>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Adapter', 'Type', 'Health', 'Markets', 'Output Format', 'Last Output', 'Notes'].map(h => (
                <th key={h} className="px-4 py-2.5 text-zinc-400 font-medium text-xs text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {sorted.map(a => (
              <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-200 text-xs font-medium max-w-56">{a.name}</td>
                <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">{a.type}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      a.health === 'healthy' ? 'bg-green-400' :
                      a.health === 'degraded' ? 'bg-amber-400' :
                      a.health === 'error' ? 'bg-red-400' : 'bg-zinc-500'
                    }`} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HEALTH[a.health]}`}>{a.health.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {a.markets.map(m => (
                      <span key={m} className="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">{m}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{a.outputFormat}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{a.lastOutput ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs max-w-48">{a.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
