import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { listRegulatorySignals, listRegulatorySources } from '@/lib/regulatory-signals/admin'
import { countEngineReviewQueue } from '@/lib/signals-engine/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function label(value: string | null | undefined) {
  return (value || 'unknown').replace(/_/g, ' ')
}

export default async function AdminSignalsPage() {
  await requireAdminAuth()
  const [signalsResult, sourcesResult, engineQueueResult] = await Promise.all([listRegulatorySignals(), listRegulatorySources(), countEngineReviewQueue({ minScore: 50 })])
  const signals = signalsResult.ok ? signalsResult.data ?? [] : []
  const sources = sourcesResult.ok ? sourcesResult.data ?? [] : []
  const pending = signals.filter((row) => ['draft', 'in_review'].includes(row.review_status)).length
  const published = signals.filter((row) => row.review_status === 'published' && row.public_safe && row.publish_to_public).length
  const failing = sources.filter((row) => row.watch_status === 'failing' || row.watch_status === 'blocked').length
  const enginePending = engineQueueResult.ok ? engineQueueResult.data : null

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Fresh regulatory sources</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">Official sources are checked, stored as private snapshots, converted into draft signals, and held for review before public display. This curated pathway is separate from the automated crawler pipeline below.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-5"><p className="text-sm text-[#F5F1E8]/55">Sources</p><p className="mt-2 text-3xl font-semibold">{sources.length}</p></div>
        <div className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-5"><p className="text-sm text-[#F5F1E8]/55">Pending</p><p className="mt-2 text-3xl font-semibold">{pending}</p></div>
        <div className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-5"><p className="text-sm text-[#F5F1E8]/55">Published</p><p className="mt-2 text-3xl font-semibold">{published}</p></div>
        <div className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-5"><p className="text-sm text-[#F5F1E8]/55">Failing</p><p className="mt-2 text-3xl font-semibold">{failing}</p></div>
      </div>
      <div className="flex gap-3 text-sm"><a className="text-[#C6A55A] underline" href="/admin/signals/sources">View sources</a><a className="text-[#C6A55A] underline" href="/admin/signals/review">Review queue</a></div>

      <div className="rounded-2xl border border-emerald-400/25 bg-[#0B1A2F] p-5">
        <p className="text-sm text-[#F5F1E8]/55">Automated engine pipeline (source_registry → signals, cat=SOURCE_ENGINE) — the actual live crawler feed</p>
        <p className="mt-2 text-3xl font-semibold text-emerald-300">{enginePending ?? '—'} <span className="text-base font-normal text-[#F5F1E8]/55">pending review (score ≥ 50)</span></p>
        <div className="mt-3 flex flex-wrap gap-4">
          <a className="text-sm text-[#C6A55A] underline" href="/admin/signals/queue">Open engine queue →</a>
          <a className="text-sm text-[#C6A55A] underline" href="/admin/signals/analysis">Signal analysis →</a>
        </div>
      </div>
      <div className="space-y-3">
        {signals.slice(0, 20).map((signal) => (
          <div key={signal.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <p className="font-semibold">{signal.headline}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#F5F1E8]/45">{label(signal.review_status)} · {label(signal.signal_type)} · {signal.country_name || 'Global'}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
