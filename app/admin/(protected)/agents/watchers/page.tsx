import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { listIaSources } from '@/lib/intelligence-automation/db'
import { FixtureBanner } from '@/components/admin/FixtureBanner'

const STATUS: Record<string, string> = {
  active:    'bg-green-950 text-green-400',
  paused:    'bg-amber-950 text-amber-400',
  error:     'bg-red-950 text-red-400',
  scheduled: 'bg-indigo-950 text-indigo-400',
}

export default async function WatchersPage() {
  await requireAdminAuth()

  const result  = await listIaSources()
  const sources = result.ok ? result.data : []

  const counts = {
    active:    sources.filter(s => s.status === 'active').length,
    paused:    sources.filter(s => s.status === 'paused').length,
    error:     sources.filter(s => s.status === 'error').length,
    scheduled: sources.filter(s => s.status === 'scheduled').length,
  }

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
            <Link href="/admin/agents" className="hover:text-zinc-300">Agents</Link>
            <span>/</span>
            <span className="text-zinc-300">Watchers</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Intelligence Watchers</h1>
        </div>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="flex gap-3 flex-wrap">
        {Object.entries(counts).map(([status, n]) => (
          <div key={status} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS[status]}`}>{status}</span>
            <span className="text-lg font-bold text-zinc-100">{n}</span>
          </div>
        ))}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-medium">total</span>
          <span className="text-lg font-bold text-zinc-100">{sources.length}</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {sources.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-zinc-500">No sources configured.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Name', 'Category', 'Markets', 'Status', 'Last Checked', 'Next Check', 'Signal Yield', 'Notes'].map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 text-zinc-400 font-medium text-xs ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sources.map(s => (
                <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-zinc-200 font-medium text-xs">{s.name}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">reliability: {s.reliability}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{s.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.markets.map(m => (
                        <span key={m} className="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">{m}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS[s.status] ?? 'bg-zinc-800 text-zinc-400'}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{s.lastChecked || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{s.nextCheck || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-zinc-200 text-xs font-medium">{s.signalYield}</span>
                  </td>
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
