import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listDatasets } from '@/lib/proprietary-intelligence/admin'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  building: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  stale: 'bg-red-500/15 text-red-400 border border-red-500/25',
  gap: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
}

export default async function DatasetsPage() {
  await requireAdminAuth()
  const result = await listDatasets()
  const datasets = result.ok ? (result.data ?? []) : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Proprietary Intelligence</p>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">Datasets</h1>
          <Link href="/admin/proprietary-intelligence" className="text-xs text-[#C6A55A] hover:underline">
            ← Overview
          </Link>
        </div>
        <p className="text-sm text-[#F5F1E8]/60">Proprietary dataset registry — coverage, freshness, and completeness status.</p>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Name</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Category</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Records</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Freshness</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Markets</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Completeness</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Status</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {datasets.map((ds) => (
              <tr key={ds.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-[#F5F1E8]">{ds.name}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/60">{ds.category.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-right text-[#F5F1E8]/80 tabular-nums">{ds.record_count.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-[#F5F1E8]/80 tabular-nums">{ds.freshness_days}d</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {ds.coverage_markets.map((m) => (
                      <span key={m} className="rounded px-1.5 py-0.5 text-xs bg-white/[0.06] text-[#F5F1E8]/70">{m}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className={ds.completeness_pct >= 80 ? 'text-emerald-400' : ds.completeness_pct >= 50 ? 'text-amber-400' : 'text-red-400'}>
                    {ds.completeness_pct}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[ds.status] ?? statusColors.gap}`}>
                    {ds.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#F5F1E8]/50 text-xs">
                  {new Date(ds.last_updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {datasets.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[#F5F1E8]/40">No datasets found.</p>
        )}
      </div>
    </section>
  )
}
