import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listPredictions } from '@/lib/proprietary-intelligence/admin'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  expired: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
  validated: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  invalidated: 'bg-red-500/15 text-red-400 border border-red-500/25',
}

export default async function PredictionsPage() {
  await requireAdminAuth()
  const result = await listPredictions()
  const predictions = result.ok ? (result.data ?? []) : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Proprietary Intelligence</p>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">Commercial Predictions</h1>
          <Link href="/admin/proprietary-intelligence" className="text-xs text-[#C6A55A] hover:underline">
            ← Overview
          </Link>
        </div>
        <p className="text-sm text-[#F5F1E8]/60">AI-generated fit scores, probabilities, and next-best-action recommendations.</p>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {predictions.map((pred) => (
          <div key={pred.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{pred.prediction_type.replace(/_/g, ' ')}</p>
              <p className="mt-1 font-semibold text-[#F5F1E8]">{pred.entity_label}</p>
            </div>
            <div className="flex gap-2 text-xs text-[#F5F1E8]/50">
              <span>{pred.market}</span>
              <span>·</span>
              <span>{pred.category.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-[#F5F1E8]/40">Confidence</p>
                <p className="text-lg font-semibold text-[#F5F1E8]">{Math.round(pred.confidence_score * 100)}%</p>
              </div>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#C6A55A]"
                  style={{ width: `${Math.round(pred.confidence_score * 100)}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-[#F5F1E8]/70">{pred.predicted_value}</p>
            {pred.supporting_factors.length > 0 && (
              <ul className="space-y-1">
                {pred.supporting_factors.map((factor, i) => (
                  <li key={i} className="flex gap-2 text-xs text-[#F5F1E8]/50">
                    <span className="text-[#C6A55A] mt-0.5">·</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[pred.status] ?? statusColors.active}`}>
                {pred.status}
              </span>
              <span className="text-xs text-[#F5F1E8]/40">
                {new Date(pred.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        ))}
      </div>
      {predictions.length === 0 && (
        <p className="text-center text-sm text-[#F5F1E8]/40 py-8">No predictions found.</p>
      )}
    </section>
  )
}
