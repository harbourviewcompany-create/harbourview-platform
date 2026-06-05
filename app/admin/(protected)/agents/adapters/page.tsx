import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { listIaSources } from '@/lib/intelligence-automation/db'
const STATUS_TO_HEALTH: Record<string, string> = {
  active:    'healthy',
  paused:    'degraded',
  error:     'error',
  scheduled: 'not_tested',
}
const HEALTH: Record<string, string> = {
  healthy:   'bg-green-950 text-green-400',
  degraded:  'bg-amber-950 text-amber-400',
  error:     'bg-red-950 text-red-400',
  not_tested:'bg-zinc-800 text-zinc-400',
}
const DOT: Record<string, string> = {
  healthy:   'bg-green-400',
  degraded:  'bg-amber-400',
  error:     'bg-red-400',
  not_tested:'bg-zinc-500',
}

export default async function AdaptersPage() {
  await requireAdminAuth()

  const result  = await listIaSources()
  const sources = result.ok ? result.data : []
  const withHealth = sources.map(s => ({ ...s, health: STATUS_TO_HEALTH[s.status] ?? 'not_tested' }))

  const counts = {
    healthy:    withHealth.filter(s => s.health === 'healthy').length,
    degraded:   withHealth.filter(s => s.health === 'degraded').length,
    error:      withHealth.filter(s => s.health === 'error').length,
    not_tested: withHealth.filter(s => s.health === 'not_tested').length,
  }

  const sorted = [...withHealth].sort((a, b) => {
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
            {counts.degraded > 0 && `${counts.degraded} degraded — check source configuration. `}
            {counts.error > 0 && `${counts.error} in error state — immediate investigation required. `}
            {counts.not_tested > 0 && `${counts.not_tested} scheduled — pending activation.`}
          </span>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-zinc-500">No sources configured.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Source', 'Category', 'Health', 'Markets', 'Reliability', 'Last Checked', 'Next Check', 'Notes'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-zinc-400 font-medium text-xs text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sorted.map(s => (
                <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-200 text-xs font-medium max-w-56">{s.name}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">{s.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT[s.health]}`} />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HEALTH[s.health]}`}>{s.health.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.markets.map(m => (
                        <span key={m} className="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">{m}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{s.reliability}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{s.lastChecked || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{s.nextCheck || '—'}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs max-w-48">{s.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
