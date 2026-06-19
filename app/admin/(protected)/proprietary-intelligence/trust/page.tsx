import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listTrustScores } from '@/lib/proprietary-intelligence/admin'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  priority: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  watch: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  reengage: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  standard: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
}

function ScoreCell({ value }: { value: number }) {
  const color = value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-amber-400' : 'text-red-400'
  return <span className={`tabular-nums ${color}`}>{value}</span>
}

export default async function TrustPage() {
  await requireAdminAuth()
  const result = await listTrustScores()
  const scores = result.ok ? (result.data ?? []) : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Proprietary Intelligence</p>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">Trust Scores</h1>
          <Link href="/admin/proprietary-intelligence" className="text-xs text-[#C6A55A] hover:underline">
            ← Overview
          </Link>
        </div>
        <p className="text-sm text-[#F5F1E8]/60">Relationship trust and commercial reliability scores per counterparty.</p>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Entity</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Type</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Market</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Category</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Trust</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Response</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Doc Quality</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Intro</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Reliability</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Relationship</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#F5F1E8]/40 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {scores.map((ts) => (
              <tr key={ts.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-[#F5F1E8]">{ts.entity_label}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/60 text-xs">{ts.entity_type}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/70">{ts.market}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/60 text-xs">{ts.category.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-right font-semibold"><ScoreCell value={ts.trust_score} /></td>
                <td className="px-4 py-3 text-right"><ScoreCell value={ts.responsiveness} /></td>
                <td className="px-4 py-3 text-right"><ScoreCell value={ts.document_quality} /></td>
                <td className="px-4 py-3 text-right"><ScoreCell value={ts.intro_success} /></td>
                <td className="px-4 py-3 text-right"><ScoreCell value={ts.commercial_reliability} /></td>
                <td className="px-4 py-3 text-right"><ScoreCell value={ts.relationship_strength} /></td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[ts.status] ?? statusColors.standard}`}>
                    {ts.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {scores.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[#F5F1E8]/40">No trust scores found.</p>
        )}
      </div>
    </section>
  )
}
