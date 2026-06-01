import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { getAdminDataClient } from '@/lib/supabase/adminDataClient';
import { listCandidates } from '@/lib/marketplace/candidates';

export const dynamic = 'force-dynamic';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

export default async function CandidatesPage() {
  await requireAdminAuth();
  const configured = getAdminDataClient().ok;
  const result = configured ? await listCandidates() : null;

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Marketplace candidates</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            Private review queue for source-supported candidates. Approved draft does not publish publicly.
          </p>
        </div>
        <Link href="/admin/sources/new" className="rounded-full bg-[#C6A55A] px-4 py-2 text-sm font-medium text-[#081423]">
          Intake source
        </Link>
      </div>

      {!configured || result?.ok === false ? (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">
          {result && !result.ok ? (result as any).error.message : 'Admin candidate review is not configured. Set SUPABASE_SERVICE_ROLE_KEY and HARBOURVIEW_ADMIN_REVIEW_ENABLED=true.'}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
            <tr>
              <th className="p-4">Candidate</th>
              <th className="p-4">Category</th>
              <th className="p-4">Listing type</th>
              <th className="p-4">Region</th>
              <th className="p-4">Source type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Risk flags</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {result?.ok && result.data.length ? result.data.map((candidate) => (
              <tr key={candidate.id} className="align-top text-[#F5F1E8]/75">
                <td className="p-4">
                  <Link href={`/admin/candidates/${candidate.id}`} className="font-medium text-[#F5F1E8] underline-offset-4 hover:underline">
                    {candidate.title_internal || candidate.title_public_draft || 'Untitled candidate'}
                  </Link>
                  <div className="mt-1 text-xs text-[#F5F1E8]/45">{candidate.candidate_type}</div>
                </td>
                <td className="p-4">{candidate.subcategory || candidate.marketplace_category}</td>
                <td className="p-4">{candidate.listing_type || 'Not set'}</td>
                <td className="p-4">{candidate.region || candidate.jurisdiction || candidate.region_available || 'Not set'}</td>
                <td className="p-4">{candidate.source_type || 'Not set'}</td>
                <td className="p-4">{candidate.status}</td>
                <td className="p-4">
                  {candidate.restricted_item ? <span className="mr-2 rounded-full border border-red-300/40 px-2 py-1 text-xs text-red-100">Restricted</span> : null}
                  {candidate.requires_license_review ? <span className="rounded-full border border-amber-300/40 px-2 py-1 text-xs text-amber-100">Licence review</span> : null}
                  {!candidate.restricted_item && !candidate.requires_license_review ? 'None' : null}
                </td>
                <td className="p-4">{formatDate(candidate.created_at)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#F5F1E8]/55">No marketplace candidates found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
