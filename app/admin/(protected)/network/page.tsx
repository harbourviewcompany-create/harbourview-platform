import { NetworkReviewCard } from '@/components/admin/network/NetworkReviewCard'
import {
  networkAdminReviewItems,
  summarizeNetworkAdminReview,
} from '@/lib/network/adminReview'

export const dynamic = 'force-dynamic'

export default function NetworkAdminReviewPage() {
  const summary = summarizeNetworkAdminReview()

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <p className="text-xs uppercase tracking-[0.32em] text-[#C6A55A]">
          Harbourview Network
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-[#F5F1E8]">
              Network review shell
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#F5F1E8]/68">
              Protected non-persistent admin review surface for validating public-safe DTO projections,
              suppressed fields and placeholder workflow states before live persistence exists.
            </p>
          </div>

          <div className="grid min-w-[240px] gap-3 rounded-2xl border border-[#C6A55A]/15 bg-black/20 p-5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#F5F1E8]/60">Review items</span>
              <strong className="text-[#F5F1E8]">{summary.total}</strong>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[#F5F1E8]/60">High-risk projections</span>
              <strong className="text-[#F5F1E8]">{summary.highRisk}</strong>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[#F5F1E8]/60">Needs clarification</span>
              <strong className="text-[#F5F1E8]">{summary.needsClarification}</strong>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        {networkAdminReviewItems.map((item) => (
          <NetworkReviewCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
