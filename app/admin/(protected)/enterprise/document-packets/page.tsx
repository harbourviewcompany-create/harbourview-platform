import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listDocumentReadinessPackets } from '@/lib/enterprise/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function statusPill(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-950 text-emerald-400 border border-emerald-400/20'
    case 'ready':
      return 'bg-blue-950 text-blue-400 border border-blue-400/20'
    case 'in_review':
      return 'bg-amber-950 text-amber-400 border border-amber-400/20'
    case 'missing_documents':
      return 'bg-red-950 text-red-400 border border-red-400/20'
    default:
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
  }
}

function completenessColor(pct: number) {
  if (pct >= 90) return 'bg-emerald-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

export default async function DocumentPacketsPage() {
  await requireAdminAuth()

  const result = await listDocumentReadinessPackets()
  const packets = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Enterprise Coordination</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Document Readiness</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Completeness tracking for compliance packets, CoAs, licences, and supply packages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FixtureBanner isFixture={isFixture} />
          <Link
            href="/admin/enterprise"
            className="text-xs text-zinc-500 hover:text-[#C6A55A] transition-colors"
          >
            ← Overview
          </Link>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/25">
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Title</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Category</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Entity</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Market</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Completeness</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Missing</th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A] font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {packets.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-[#F5F1E8] font-medium">{p.title}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{p.packet_category}</td>
                  <td className="px-4 py-3 text-zinc-300 text-xs">{p.entity_label}</td>
                  <td className="px-4 py-3">
                    <span className="rounded px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-300">{p.market}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${completenessColor(p.completeness_pct)}`}
                          style={{ width: `${p.completeness_pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400">{p.completeness_pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {p.missing_items.length === 0 ? (
                      <span className="text-zinc-600">—</span>
                    ) : (
                      <span className="text-red-400">{p.missing_items.length} item{p.missing_items.length !== 1 ? 's' : ''}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${statusPill(p.status)}`}>
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
