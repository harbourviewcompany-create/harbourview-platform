// app/admin/(protected)/listings/candidates/page.tsx
// Admin review queue for scraped listing candidates.
// Shows needs_review candidates with approve/reject actions.

import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createClient } from '@supabase/supabase-js'
import CandidateReviewCard from './CandidateReviewCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function CandidatesPage() {
  await requireAdminAuth()

  const supabase = getServiceClient()
  const { data: candidates } = await supabase
    .from('marketplace_candidates')
    .select('*')
    .eq('status', 'needs_review')
    .order('discovered_at', { ascending: false })
    .limit(100)

  const queue = candidates ?? []

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
          {queue.map((candidate) => (
            <CandidateReviewCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
    </section>
  )
}
