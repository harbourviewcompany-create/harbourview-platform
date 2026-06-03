import { requireAdminAuth } from '@/lib/admin-auth'
import Link from 'next/link'
import { listIaSignals } from '@/lib/intelligence-automation/db'

const STAGE_LABEL: Record<string, string> = {
  captured: 'pending',
  review:   'pending',
  approved: 'accepted',
  rejected: 'rejected',
  archived: 'accepted',
}
const REVIEW: Record<string, string> = {
  pending:  'bg-zinc-800 text-zinc-300',
  accepted: 'bg-green-950 text-green-400',
  rejected: 'bg-red-950 text-red-400',
  escalated:'bg-purple-950 text-purple-400',
}
const CONFIDENCE: Record<string, string> = {
  high:      'bg-emerald-950 text-emerald-400',
  medium:    'bg-amber-950 text-amber-400',
  low:       'bg-zinc-800 text-zinc-400',
  uncertain: 'bg-red-950 text-red-300',
}
const IMPACT: Record<string, string> = {
  high:   'text-orange-400',
  medium: 'text-amber-400',
  low:    'text-zinc-500',
}

export default async function SignalsPage() {
  await requireAdminAuth()

  const result  = await listIaSignals()
  const signals = result.data ?? []

  const toStatus = (stage: string) => STAGE_LABEL[stage] ?? 'pending'

  const counts = {
    pending:  signals.filter(s => toStatus(s.stage) === 'pending').length,
    accepted: signals.filter(s => toStatus(s.stage) === 'accepted').length,
    rejected: signals.filter(s => toStatus(s.stage) === 'rejected').length,
    escalated:0,
  }

  const sorted = [...signals].sort((a, b) => {
    const p: Record<string, number>  = { review: 0, captured: 1, approved: 2, rejected: 3, archived: 4 }
    const cp: Record<string, number> = { high: 0, medium: 1, low: 2, uncertain: 3 }
    if (a.stage !== b.stage) return (p[a.stage] ?? 9) - (p[b.stage] ?? 9)
    return (cp[a.confidence] ?? 9) - (cp[b.confidence] ?? 9)
  })

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
          <Link href="/admin/agents" className="hover:text-zinc-300">Agents</Link>
          <span>/</span>
          <span className="text-zinc-300">Extracted Signals</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Extracted Signals</h1>
      </div>

      <div className="flex gap-3 flex-wrap">
        {Object.entries(counts).map(([status, n]) => (
          <div key={status} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REVIEW[status]}`}>{status}</span>
            <span className="text-lg font-bold text-zinc-100">{n}</span>
          </div>
        ))}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-medium">total</span>
          <span className="text-lg font-bold text-zinc-100">{signals.length}</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-zinc-500">No signals found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Signal', 'Market', 'Source', 'Confidence', 'Impact', 'Detected', 'Stage'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-zinc-400 font-medium text-xs text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sorted.map(s => (
                <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 max-w-sm">
                    <div className="text-zinc-200 text-xs font-medium leading-relaxed">{s.title}</div>
                    <div className="text-zinc-500 text-xs mt-1 leading-relaxed line-clamp-2">{s.summary}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{s.market}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs max-w-40 truncate">{s.sourceName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONFIDENCE[s.confidence]}`}>{s.confidence}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${IMPACT[s.commercialImpact]}`}>{s.commercialImpact}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{s.detectedAt.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REVIEW[toStatus(s.stage)]}`}>
                      {toStatus(s.stage)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
