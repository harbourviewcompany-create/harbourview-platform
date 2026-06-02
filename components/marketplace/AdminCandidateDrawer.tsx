import type { MarketplaceAdminQueueItem } from '@/lib/server/marketplaceAdminQuery'

export function AdminCandidateDrawer({ candidate }: { candidate: MarketplaceAdminQueueItem }) {
  return (
    <aside className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-5 text-sm text-[#F5F1E8]/70">
      <h3 className="text-lg font-semibold text-[#F5F1E8]">{candidate.title || 'Candidate review'}</h3>
      <dl className="mt-4 grid gap-3">
        <div><dt className="text-[#C6A55A]">Category</dt><dd>{candidate.category_key || 'unassigned'}</dd></div>
        <div><dt className="text-[#C6A55A]">Verification</dt><dd>{candidate.verification_status || 'unverified'}</dd></div>
        <div><dt className="text-[#C6A55A]">Publication</dt><dd>{candidate.publication_status || 'not_publishable'}</dd></div>
      </dl>
    </aside>
  )
}
