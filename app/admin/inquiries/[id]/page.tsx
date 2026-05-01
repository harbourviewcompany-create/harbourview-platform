import Link from 'next/link';
import { notFound } from 'next/navigation';
import { updateInquiryStatus } from '@/app/actions/updateInquiryStatus';

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
};

const statuses = ['received', 'reviewing', 'matched', 'closed'];

function getServiceConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminReviewEnabled = process.env.HARBOURVIEW_ADMIN_REVIEW_ENABLED === 'true';
  if (!url || !serviceRoleKey || !adminReviewEnabled) return null;
  return { url: url.replace(/\/$/, ''), serviceRoleKey };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

async function getInquiry(id: string): Promise<MarketplaceInquiry | null> {
  const supabase = getServiceConfig();
  if (!supabase) return null;

  const response = await fetch(
    `${supabase.url}/rest/v1/marketplace_inquiries?id=eq.${id}&select=*&limit=1`,
    {
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) return null;
  const rows = (await response.json()) as MarketplaceInquiry[];
  return rows[0] ?? null;
}

export default async function AdminInquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inquiry = await getInquiry(id);
  const configured = Boolean(getServiceConfig());

  if (!configured) {
    return (
      <section className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">
        Admin inquiry review is disabled. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and HARBOURVIEW_ADMIN_REVIEW_ENABLED=true in the server environment before using this private scaffold.
      </section>
    );
  }

  if (!inquiry) notFound();

  return (
    <section>
      <Link href="/admin/inquiries" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">
        Back to inquiry queue
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <article className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[#C6A55A]">{inquiry.inquiry_type.replaceAll('_', ' ')}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Source-backed marketplace inquiry</h2>

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
        </article>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5">
            <h3 className="text-lg font-semibold">Review status</h3>
            <p className="mt-2 text-sm text-[#F5F1E8]/60">Current status: <span className="text-[#D8BC73]">{inquiry.status}</span></p>
            <form action={updateInquiryStatus} className="mt-5 space-y-4">
              <input type="hidden" name="id" value={inquiry.id} />
              <label className="block text-sm text-[#F5F1E8]/75">
                Update status
                <select name="status" defaultValue={inquiry.status} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2">
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <button type="submit" className="rounded-full bg-[#C6A55A] px-5 py-3 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73]">
                Save status
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-[#F5F1E8]/70">
            <h3 className="font-semibold text-[#F5F1E8]">Record details</h3>
            <dl className="mt-4 space-y-3">
              <div><dt className="text-[#C6A55A]">Created</dt><dd>{formatDate(inquiry.created_at)}</dd></div>
              <div><dt className="text-[#C6A55A]">Updated</dt><dd>{formatDate(inquiry.updated_at)}</dd></div>
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
