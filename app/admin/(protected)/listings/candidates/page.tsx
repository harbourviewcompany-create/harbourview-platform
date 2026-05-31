// app/admin/(protected)/listings/candidates/page.tsx
// Admin review queue for scraped listing candidates.
// Shows needs_review candidates with approve/reject actions.

import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { fetchAdminSupabaseJson } from '@/lib/supabase/adminDataClient'
import CandidateReviewCard from './CandidateReviewCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Shape returned by Supabase for marketplace_candidates rows.
// Extend as columns are added — 'unknown' fields degrade gracefully.
interface CandidateRow {
  id: string
  status: string
  title_public_draft: string | null
  title_internal: string | null
  description_public_draft: string | null
  description_internal: string | null
  marketplace_category: string | null
  product_type: string | null
  region: string | null
  country: string | null
  price_raw: string | null
  price_amount: number | null
  price_currency: string | null
  condition: string | null
  seller_type: string | null
  source_name: string | null
  source_url: string | null
  confidence: number | null
  discovered_at: string | null
  reviewed_at: string | null
  ai_normalised: Record<string, unknown> | null
}

export default async function CandidatesPage() {
  await requireAdminAuth()

  const result = await fetchAdminSupabaseJson<CandidateRow[]>(
    '/rest/v1/marketplace_candidates?status=eq.needs_review&order=discovered_at.desc&limit=100',
  )

  const queue: CandidateRow[] = result.ok ? (result.data ?? []) : []

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Scrape review queue</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            {queue.length === 0
              ? 'No candidates pending review.'
              : `${queue.length} candidate${queue.length !== 1 ? 's' : ''} awaiting review. Approve to publish to the marketplace.`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="rounded-full border border-[#C6A55A]/30 bg-[#C6A55A]/10 px-3 py-1 text-[#C6A55A]">
            {queue.length} pending
          </span>
          <a href="/admin/listings" className="text-[#F5F1E8]/50 underline-offset-4 hover:text-[#F5F1E8] hover:underline">
            View all listings
          </a>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-10 text-center">
          <p className="text-sm text-[#F5F1E8]/50">Queue is empty. The scrape engine runs daily at 06:00 UTC.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {queue.map((candidate: CandidateRow) => (
            <CandidateReviewCard
              key={candidate.id}
              candidate={{
                ...candidate,
                source_name: candidate.source_name ?? '',
                source_url: candidate.source_url ?? '',
                marketplace_category: candidate.marketplace_category ?? '',
                title_internal: candidate.title_internal ?? '',
                title_public_draft: candidate.title_public_draft ?? '',
                description_internal: candidate.description_internal ?? '',
                description_public_draft: candidate.description_public_draft ?? '',
                discovered_at: candidate.discovered_at ?? new Date().toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
