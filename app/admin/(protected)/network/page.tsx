import { NetworkReviewCard } from '@/components/admin/network/NetworkReviewCard'
import {
  networkAdminReviewItems,
  summarizeNetworkAdminReview,
  type NetworkAdminReviewItem,
} from '@/lib/network/adminReview'
import { listNetworkReviewItems } from '@/lib/network/serverQueries'
import type { NetworkReviewItemRow } from '@/lib/network/serverTypes'
import {
  approveNetworkReviewItem,
  rejectNetworkReviewItem,
  requestClarificationNetworkReviewItem,
} from './actions'

export const dynamic = 'force-dynamic'

function rowToReviewItem(row: NetworkReviewItemRow): NetworkAdminReviewItem {
  return {
    id: row.id,
    objectType: row.object_type,
    title: row.title_internal,
    countryLabel: row.country_label ?? 'Unknown',
    categoryLabel: row.category_label ?? 'General',
    reviewStatus: row.review_status,
    claimRisk: row.claim_risk,
    publicPreview: {
      id: row.id,
      slug: row.source_ref ?? row.id,
      name: row.title_public_draft ?? row.title_internal,
      publicSummary: row.public_summary_draft ?? '',
    },
    suppressedFieldLabels: row.suppressed_fields,
    nextActionLabel: row.requires_legal_review
      ? 'Legal review required'
      : row.requires_compliance_review
        ? 'Compliance review required'
        : 'Awaiting review',
  }
}

const PENDING_STATUSES = new Set(['submitted', 'under_review', 'needs_clarification']);

export default async function NetworkAdminReviewPage() {
  const result = await listNetworkReviewItems()
  const isLive = result.ok && result.data.length > 0
  const items: NetworkAdminReviewItem[] = isLive
    ? result.data.map(rowToReviewItem)
    : networkAdminReviewItems

  const summary = summarizeNetworkAdminReview(items)

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <p className="text-xs uppercase tracking-[0.32em] text-[#C6A55A]">
          Harbourview Network
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-[#F5F1E8]">
              Network review
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#F5F1E8]/68">
              Admin review surface for validating public-safe DTO projections,
              suppressed fields, and workflow states before publication.{' '}
              <span className={`text-[10px] uppercase tracking-[0.14em] ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isLive ? 'Live — Supabase' : 'No items — showing placeholder data'}
              </span>
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
        {items.map((item) => (
          <div key={item.id} className="space-y-3">
            <NetworkReviewCard item={item} />
            {isLive && PENDING_STATUSES.has(item.reviewStatus) && (
              <div className="flex flex-wrap gap-2">
                <form action={approveNetworkReviewItem.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-400/10"
                  >
                    Approve &amp; publish
                  </button>
                </form>
                <form action={requestClarificationNetworkReviewItem.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-amber-400/40 px-3 py-1.5 text-xs text-amber-300 transition hover:bg-amber-400/10"
                  >
                    Needs clarification
                  </button>
                </form>
                <form action={rejectNetworkReviewItem.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-400/10"
                  >
                    Reject
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
