import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { fetchAdminSupabaseJson, getAdminDataClient, type AdminDataError } from '@/lib/supabase/adminDataClient';
import {
  getInquiryTypeLabel,
  getPriorityRank,
  priorityLabels,
  PRIORITIES,
  reviewStatusLabels,
  REVIEW_STATUSES,
} from '@/lib/marketplace/inquiryWorkflow';

export const dynamic = 'force-dynamic';

type MarketplaceInquiry = {
  id: string;
  created_at: string;
  inquiry_type: string;
  contact_company: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  status: string;
  message: string;
  listing_id: string | null;
  buyer_request_id: string | null;
  review_status: string;
  priority: string;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
};

type AdminInquiriesPageProps = {
  searchParams?: Promise<{
    status?: string;
    priority?: string;
    type?: string;
  }>;
};

const inquiryTypeFilters = [
  ['listing_submission', 'Listing submission'],
  ['wanted_request_submission', 'Wanted request'],
  ['quote_routing', 'Quote/general inquiry'],
  ['quote_request', 'Quote/general inquiry'],
] as const;

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

function preview(value: string) {
  return value.length > 96 ? `${value.slice(0, 96)}...` : value;
}

function getInquiryContext(inquiry: MarketplaceInquiry) {
  if (inquiry.listing_id) return `Listing ${inquiry.listing_id}`;
  if (inquiry.buyer_request_id) return `Buyer request ${inquiry.buyer_request_id}`;
  return getInquiryTypeLabel(inquiry.inquiry_type);
}

function filterInquiries(inquiries: MarketplaceInquiry[], filters: Awaited<AdminInquiriesPageProps['searchParams']>) {
  return inquiries.filter((inquiry) => {
    if (filters?.status && inquiry.review_status !== filters.status) return false;
    if (filters?.priority && inquiry.priority !== filters.priority) return false;
    if (filters?.type && inquiry.inquiry_type !== filters.type) return false;
    return true;
  });
}

function sortInquiries(inquiries: MarketplaceInquiry[]) {
  return [...inquiries].sort((a, b) => {
    const priorityDelta = getPriorityRank(a.priority) - getPriorityRank(b.priority);
    if (priorityDelta !== 0) return priorityDelta;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

async function getInquiries(): Promise<{ inquiries: MarketplaceInquiry[]; error: AdminDataError | null }> {
  const result = await fetchAdminSupabaseJson<MarketplaceInquiry[]>(
    '/rest/v1/marketplace_inquiries?select=id,created_at,inquiry_type,contact_company,contact_name,contact_email,contact_phone,status,message,listing_id,buyer_request_id,review_status,priority,last_contacted_at,next_follow_up_at&limit=100',
  );

  if (!result.ok) return { inquiries: [], error: result.error };
  return { inquiries: result.data, error: null };
}

export default async function AdminInquiriesPage({ searchParams }: AdminInquiriesPageProps) {
  await requireAdminAuth();

  const params = await searchParams;
  const { inquiries, error } = await getInquiries();
  const configured = getAdminDataClient().ok;
  const visibleInquiries = sortInquiries(filterInquiries(inquiries, params));

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Marketplace inquiries</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            Review inbound requests before seller contact, quote routing or marketplace introduction.
          </p>
        </div>
        <Link href="/marketplace/listings" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">
          View public listings
        </Link>
      </div>

      {!configured || error ? (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">
          {error?.message || 'Admin inquiry review is not configured. Set SUPABASE_SERVICE_ROLE_KEY and HARBOURVIEW_ADMIN_REVIEW_ENABLED=true in the server environment before using this private queue.'}
        </div>
      ) : null}

      <form className="mb-5 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm md:grid-cols-4" action="/admin/inquiries">
        <label className="text-[#F5F1E8]/70">
          Status
          <select name="status" defaultValue={params?.status || ''} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]">
            <option value="">All statuses</option>
            {REVIEW_STATUSES.map((status) => <option key={status} value={status}>{reviewStatusLabels[status]}</option>)}
          </select>
        </label>
        <label className="text-[#F5F1E8]/70">
          Priority
          <select name="priority" defaultValue={params?.priority || ''} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]">
            <option value="">All priorities</option>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
          </select>
        </label>
        <label className="text-[#F5F1E8]/70">
          Inquiry type
          <select name="type" defaultValue={params?.type || ''} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-3 py-2 text-[#F5F1E8]">
            <option value="">All types</option>
            {inquiryTypeFilters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <div className="flex items-end gap-3">
          <button type="submit" className="rounded-full bg-[#C6A55A] px-4 py-2 font-medium text-[#081423] transition hover:bg-[#D8BC73]">
            Apply filters
          </button>
          <Link href="/admin/inquiries" className="rounded-full border border-white/15 px-4 py-2 text-[#F5F1E8]/70 transition hover:bg-white/10">
            Reset
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
            <tr>
              <th className="p-4">Created</th>
              <th className="p-4">Type</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Company</th>
              <th className="p-4">Email</th>
              <th className="p-4">Review status</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Next follow-up</th>
              <th className="p-4">Last contacted</th>
              <th className="p-4">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {visibleInquiries.length ? visibleInquiries.map((inquiry) => (
              <tr key={inquiry.id} className="align-top text-[#F5F1E8]/75">
                <td className="whitespace-nowrap p-4">{formatDate(inquiry.created_at)}</td>
                <td className="p-4">
                  <Link href={`/admin/inquiries/${inquiry.id}`} className="font-medium text-[#F5F1E8] underline-offset-4 hover:underline">
                    {getInquiryContext(inquiry)}
                  </Link>
                  <div className="mt-1 text-xs text-[#F5F1E8]/45">{getInquiryTypeLabel(inquiry.inquiry_type)}</div>
                </td>
                <td className="p-4">{inquiry.contact_name}</td>
                <td className="p-4">{inquiry.contact_company || 'Not provided'}</td>
                <td className="p-4">{inquiry.contact_email}</td>
                <td className="p-4">{reviewStatusLabels[inquiry.review_status as keyof typeof reviewStatusLabels] || inquiry.review_status}</td>
                <td className="p-4">
                  <span className="rounded-full border border-[#C6A55A]/30 px-3 py-1 text-xs text-[#D8BC73]">
                    {priorityLabels[inquiry.priority as keyof typeof priorityLabels] || inquiry.priority}
                  </span>
                </td>
                <td className="whitespace-nowrap p-4">{formatDate(inquiry.next_follow_up_at)}</td>
                <td className="whitespace-nowrap p-4">{formatDate(inquiry.last_contacted_at)}</td>
                <td className="max-w-xs p-4">{preview(inquiry.message)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} className="p-8 text-center text-[#F5F1E8]/55">
                  No marketplace inquiries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
