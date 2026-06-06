import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { updateMarketplaceCandidateStatus } from '@/app/actions/updateCandidateStatus';
import { getCandidateDetail } from '@/lib/marketplace/candidates';
import { CONSUMABLES_LISTING_TYPES, CONSUMABLES_SUBCATEGORIES, getDraftApprovalBlockers } from '@/lib/marketplace/consumables';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function Value({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <dt className="text-xs uppercase tracking-[0.18em] text-[#C6A55A]">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-[#F5F1E8]/75">{children || 'Not set'}</dd>
    </div>
  );
}

function ActionForm({ id, toStatus, label }: { id: string; toStatus: string; label: string }) {
  return (
    <form action={updateMarketplaceCandidateStatus} className="rounded-xl border border-white/10 bg-black/20 p-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to_status" value={toStatus} />
      <label className="text-sm text-[#F5F1E8]/70">
        Review note
        <textarea name="note" rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]" />
      </label>
      <button type="submit" className="mt-3 rounded-full border border-[#C6A55A]/50 px-4 py-2 text-sm text-[#C6A55A] transition hover:bg-[#C6A55A]/10">
        {label}
      </button>
    </form>
  );
}

export default async function CandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  await requireAdminAuth();
  const { id } = await params;
  const query = await searchParams;
  const result = await getCandidateDetail(id);

  if (!result.ok) {
    return <section className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">{(result as any).error.message}</section>;
  }

  const { candidate, snapshot, source, events } = result.data;
  const draftBlockers = getDraftApprovalBlockers(candidate);

  return (
    <section>
      <Link href="/admin/candidates" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">Back to candidate queue</Link>

      {query?.error ? (
        <div className="mt-5 rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">
          {query.error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[#C6A55A]">{candidate.marketplace_category}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{candidate.title_internal || candidate.title_public_draft || 'Untitled candidate'}</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/60">
            Status: {candidate.status}. Approved draft remains private and does not publish a public listing.
          </p>

          <div className="mt-5 rounded-2xl border border-[#C6A55A]/20 bg-black/20 p-4" data-testid="candidate-workflow-spine">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C6A55A]">Manual-source workflow</p>
            <ol className="mt-3 grid gap-2 text-sm text-[#F5F1E8]/70 md:grid-cols-4">
              <li><span className="font-semibold text-[#F5F1E8]">1. Source</span><br />Private URL registry</li>
              <li><span className="font-semibold text-[#F5F1E8]">2. Snapshot</span><br />Manual captured text/hash</li>
              <li><span className="font-semibold text-[#F5F1E8]">3. Candidate</span><br />Private review draft</li>
              <li><span className="font-semibold text-[#F5F1E8]">4. Review event</span><br />Status audit trail</li>
            </ol>
          </div>

          <div className={`mt-5 rounded-xl border p-4 text-sm ${draftBlockers.length ? 'border-amber-300/35 bg-amber-950/20 text-amber-100' : 'border-emerald-300/25 bg-emerald-950/10 text-emerald-100'}`} data-testid="candidate-approval-blockers">
            <p className="font-semibold">Approval blockers</p>
            {draftBlockers.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5">
                {draftBlockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-[#F5F1E8]/65">No V0 consumables blockers detected. Approval as draft still remains private and requires manual operator judgment.</p>
            )}
          </div>

          <dl className="mt-6 grid gap-3 md:grid-cols-2">
            <Value label="Source URL">{source?.source_url}</Value>
            <Value label="Source title">{snapshot?.captured_title}</Value>
            <Value label="Captured date">{formatDate(snapshot?.captured_at || null)}</Value>
            <Value label="Fetch status">{snapshot?.fetch_status}</Value>
            <Value label="Internal title">{candidate.title_internal}</Value>
            <Value label="Public draft title">{candidate.title_public_draft}</Value>
            <Value label="Category">{candidate.marketplace_category}</Value>
            <Value label="Subcategory">{candidate.subcategory}</Value>
            <Value label="Listing type">{candidate.listing_type}</Value>
            <Value label="Supply type">{candidate.supply_type}</Value>
            <Value label="Condition">{candidate.condition}</Value>
            <Value label="Bulk available">{candidate.bulk_available ? 'Yes' : 'No'}</Value>
            <Value label="Recurring supply available">{candidate.recurring_supply_available ? 'Yes' : 'No'}</Value>
            <Value label="Region available">{candidate.region_available}</Value>
            <Value label="Lead time">{candidate.lead_time_text}</Value>
            <Value label="Public restriction note">{candidate.public_restriction_note}</Value>
            <Value label="Confidence score">{candidate.confidence_score}</Value>
            <Value label="Commercial relevance score">{candidate.commercial_relevance_score}</Value>
            <Value label="Compliance risk score">{candidate.compliance_risk_score}</Value>
            <Value label="Restricted item">{candidate.restricted_item ? 'Yes' : 'No'}</Value>
            <Value label="Requires licence review">{candidate.requires_license_review ? 'Yes' : 'No'}</Value>
            <Value label="Reviewed by">{candidate.reviewed_by}</Value>
            <Value label="Reviewed at">{formatDate(candidate.reviewed_at)}</Value>
          </dl>

          <div className="mt-5 grid gap-3">
            <Value label="Captured text excerpt">{snapshot?.captured_text?.slice(0, 1200)}</Value>
            <Value label="Internal description">{candidate.description_internal}</Value>
            <Value label="Public draft description">{candidate.description_public_draft}</Value>
            <Value label="Rejection reason">{candidate.rejection_reason}</Value>
          </div>
        </article>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5">
            <h3 className="font-semibold">Review actions</h3>
            <p className="mt-2 text-sm text-[#F5F1E8]/60">No action publishes publicly. Approved draft is a private admin state only.</p>
            <div className="mt-4 grid gap-3">
              <ActionForm id={candidate.id} toStatus="needs_review" label="Mark needs review" />
              <ActionForm id={candidate.id} toStatus="needs_verification" label="Mark needs verification" />
              <ActionForm id={candidate.id} toStatus="approved_draft" label="Approve as private draft only" />
              <ActionForm id={candidate.id} toStatus="rejected" label="Reject" />
              <ActionForm id={candidate.id} toStatus="archived" label="Archive" />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="font-semibold">Allowed values</h3>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Subcategories</p>
            <p className="mt-1 text-sm text-[#F5F1E8]/65">{CONSUMABLES_SUBCATEGORIES.join(', ')}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Listing types</p>
            <p className="mt-1 text-sm text-[#F5F1E8]/65">{CONSUMABLES_LISTING_TYPES.join(', ')}</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="font-semibold">Review events</h3>
            <div className="mt-4 space-y-3">
              {events.length ? events.map((event) => (
                <article key={event.id} className="rounded-xl border border-white/10 p-3 text-sm text-[#F5F1E8]/70">
                  <p className="font-medium text-[#F5F1E8]">{event.event_type}</p>
                  <p className="text-xs text-[#C6A55A]">{event.from_status || 'new'} {'->'} {event.to_status || 'none'} | {formatDate(event.created_at)}</p>
                  <p className="mt-2 whitespace-pre-wrap">{event.note || 'No note'}</p>
                </article>
              )) : <p className="text-sm text-[#F5F1E8]/55">No review events.</p>}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
