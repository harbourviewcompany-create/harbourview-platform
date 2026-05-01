import Link from 'next/link';

export const dynamic = 'force-dynamic';

type MarketplaceInquiry = {
  id: string;
  created_at: string;
  listing_title: string;
  inquiry_type: string;
  company: string;
  country: string;
  name: string;
  email: string;
  status: string;
  message: string;
};

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

function preview(value: string) {
  return value.length > 120 ? `${value.slice(0, 120)}...` : value;
}

async function getInquiries(): Promise<MarketplaceInquiry[]> {
  const supabase = getServiceConfig();
  if (!supabase) return [];

  const response = await fetch(
    `${supabase.url}/rest/v1/marketplace_inquiries?select=id,created_at,listing_title,inquiry_type,company,country,name,email,status,message&order=created_at.desc&limit=50`,
    {
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) return [];
  return response.json();
}

export default async function AdminInquiriesPage() {
  const inquiries = await getInquiries();
  const configured = Boolean(getServiceConfig());

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

      {!configured ? (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">
          Admin inquiry review is disabled. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and HARBOURVIEW_ADMIN_REVIEW_ENABLED=true in the server environment before using this private scaffold.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
            <tr>
              <th className="p-4">Created</th>
              <th className="p-4">Listing</th>
              <th className="p-4">Type</th>
              <th className="p-4">Company</th>
              <th className="p-4">Country</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Status</th>
              <th className="p-4">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {inquiries.length ? inquiries.map((inquiry) => (
              <tr key={inquiry.id} className="align-top text-[#F5F1E8]/75">
                <td className="p-4 whitespace-nowrap">{formatDate(inquiry.created_at)}</td>
                <td className="p-4">
                  <Link href={`/admin/inquiries/${inquiry.id}`} className="font-medium text-[#F5F1E8] underline-offset-4 hover:underline">
                    {inquiry.listing_title}
                  </Link>
                </td>
                <td className="p-4">{inquiry.inquiry_type.replaceAll('_', ' ')}</td>
                <td className="p-4">{inquiry.company}</td>
                <td className="p-4">{inquiry.country}</td>
                <td className="p-4">
                  <div>{inquiry.name}</div>
                  <div className="text-xs text-[#F5F1E8]/45">{inquiry.email}</div>
                </td>
                <td className="p-4">
                  <span className="rounded-full border border-[#C6A55A]/30 px-3 py-1 text-xs text-[#D8BC73]">
                    {inquiry.status}
                  </span>
                </td>
                <td className="p-4 max-w-xs">{preview(inquiry.message)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#F5F1E8]/55">
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
