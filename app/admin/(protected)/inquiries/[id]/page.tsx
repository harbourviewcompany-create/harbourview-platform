import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { fetchAdminSupabaseJson, getAdminDataClient, type AdminDataError } from '@/lib/supabase/adminDataClient';
import {
  getInquiryTypeLabel,
  getRecommendedTemplateKey,
  priorityLabels,
  PRIORITIES,
  responseTemplates,
  reviewStatusLabels,
  REVIEW_STATUSES,
} from '@/lib/marketplace/inquiryWorkflow';

export const dynamic = 'force-dynamic';

type MarketplaceInquiry = {
  id: string;
  created_at: string;
  updated_at: string;
  listing_id: string | null;
  buyer_request_id: string | null;
  inquiry_type: string;
  contact_company: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  status: string;
  message: string;
  internal_notes: string | null;
  review_status: string;
  priority: string;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  internal_response_notes: string | null;
};

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

function formatDateTimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

async function getInquiry(id: string): Promise<{ inquiry: MarketplaceInquiry | null; error: AdminDataError | null }> {
  const result = await fetchAdminSupabaseJson<MarketplaceInquiry[]>(
    `/rest/v1/marketplace_inquiries?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );

  if (!result.ok) return { inquiry: null, error: result.error };
  return { inquiry: result.data[0] ?? null, error: null };
}

export default async function AdminInquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminAuth();

  const { id } = await params;
  const { inquiry, error } = await getInquiry(id);
  const configured = getAdminDataClient().ok;

  if (!configured || error) {
    return (
      <section className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">
        {error?.message || 'Admin inquiry review is not configured. Set SUPABASE_SERVICE_ROLE_KEY and HARBOURVIEW_ADMIN_REVIEW_ENABLED=true in the server environment before using this private queue.'}
      </section>
    );
  }

  if (!inquiry) notFound();

  const recommendedTemplateKey = getRecommendedTemplateKey(inquiry.inquiry_type);

  return (
    <section>
      <Link href="/admin/inquiries" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">
        Back to inquiry queue
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[#C6A55A]">{getInquiryTypeLabel(inquiry.inquiry_type)}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{getInquiryTypeLabel(inquiry.inquiry_type)}</h2>

          <div className="mt-6 grid gap-3 text-sm text-[#F5F1E8]/75 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Company</span>
              {inquiry.contact_company || 'Not provided'}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Listing ID</span>
              {inquiry.listing_id || 'No linked Supabase listing'}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Contact</span>
              {inquiry.contact_name}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Email</span>
              {inquiry.contact_email}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Phone</span>
              {inquiry.contact_phone || 'Not provided'}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#C6A55A]">Buyer request ID</span>
              {inquiry.buyer_request_id || 'Not linked'}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C6A55A]">Message</h3>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#F5F1E8]/80">{inquiry.message}</p>
          </div>

          <div className="mt-6 rounded-2xl border border-[#C6A55A]/25 bg-black/20 p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <h3 className="text-lg font-semibold">Response templates</h3>
                <p className="mt-2 text-sm text-[#F5F1E8]/60">Select and copy the subject and body into the operator response channel.</p>
              </div>
              <span className="text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
                Recommended: {responseTemplates.find((template) => template.key === recommendedTemplateKey)?.label}
              </span>
            </div>
            <div className="mt-5 space-y-5">
              {responseTemplates.map((template) => (
                <section key={template.key} className="rounded-xl border border-white/10 bg-[#081423] p-4">
                  <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                    <h4 className="font-semibold text-[#F5F1E8]">{template.label}</h4>
                    {template.key === recommendedTemplateKey ? (
                      <span className="text-xs uppercase tracking-[0.16em] text-[#D8BC73]">Recommended</span>
                    ) : null}
                  </div>
                  <label className="mt-3 block text-xs uppercase tracking-[0.16em] text-[#C6A55A]">
                    Subject
                    <input readOnly value={template.subject} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm normal-case tracking-normal text-[#F5F1E8]" />
                  </label>
                  <label className="mt-3 block text-xs uppercase tracking-[0.16em] text-[#C6A55A]">
                    Body
                    <textarea readOnly value={template.body} rows={10} className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm normal-case leading-6 tracking-normal text-[#F5F1E8]" />
                  </label>
                </section>
              ))}
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5">
            <h3 className="text-lg font-semibold">Workflow</h3>
            <p className="mt-2 text-sm text-[#F5F1E8]/60">
              Review status: <span className="text-[#D8BC73]">{reviewStatusLabels[inquiry.review_status as keyof typeof reviewStatusLabels] || inquiry.review_status}</span>
            </p>
            <form action={`/admin/inquiries/${inquiry.id}/workflow`} method="post" className="mt-5 space-y-4">
              <input type="hidden" name="id" value={inquiry.id} />
              <label className="block text-sm text-[#F5F1E8]/75">
                Review status
                <select name="review_status" defaultValue={inquiry.review_status} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2">
                  {REVIEW_STATUSES.map((status) => <option key={status} value={status}>{reviewStatusLabels[status]}</option>)}
                </select>
              </label>
              <label className="block text-sm text-[#F5F1E8]/75">
                Priority
                <select name="priority" defaultValue={inquiry.priority} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2">
                  {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
                </select>
              </label>
              <label className="block text-sm text-[#F5F1E8]/75">
                Next follow-up
                <input type="datetime-local" name="next_follow_up_at" defaultValue={formatDateTimeLocal(inquiry.next_follow_up_at)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
              </label>
              <label className="block text-sm text-[#F5F1E8]/75">
                Internal response notes
                <textarea name="internal_response_notes" defaultValue={inquiry.internal_response_notes || ''} rows={7} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
              </label>
              <label className="flex items-center gap-3 text-sm text-[#F5F1E8]/75">
                <input type="checkbox" name="mark_contacted_now" value="1" className="h-4 w-4 accent-[#C6A55A]" />
                Mark contacted now
              </label>
              <button type="submit" className="rounded-full bg-[#C6A55A] px-5 py-3 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73]">
                Save workflow
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-[#F5F1E8]/70">
            <h3 className="font-semibold text-[#F5F1E8]">Record details</h3>
            <dl className="mt-4 space-y-3">
              <div><dt className="text-[#C6A55A]">Created</dt><dd>{formatDate(inquiry.created_at)}</dd></div>
              <div><dt className="text-[#C6A55A]">Updated</dt><dd>{formatDate(inquiry.updated_at)}</dd></div>
              <div><dt className="text-[#C6A55A]">Legacy status</dt><dd>{inquiry.status}</dd></div>
              <div><dt className="text-[#C6A55A]">Last contacted</dt><dd>{formatDate(inquiry.last_contacted_at)}</dd></div>
              <div><dt className="text-[#C6A55A]">Next follow-up</dt><dd>{formatDate(inquiry.next_follow_up_at)}</dd></div>
              <div><dt className="text-[#C6A55A]">Inquiry ID</dt><dd>{inquiry.id}</dd></div>
            </dl>
          </div>

          {inquiry.internal_notes ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-[#F5F1E8]/70">
              <h3 className="font-semibold text-[#F5F1E8]">Internal notes</h3>
              <p className="mt-3 whitespace-pre-wrap leading-7">{inquiry.internal_notes}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
