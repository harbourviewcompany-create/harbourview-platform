import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { getAdminDataClient } from '@/lib/supabase/adminDataClient';
import { listSources } from '@/lib/marketplace/candidates';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

export default async function AdminSourcesPage() {
  await requireAdminAuth();
  const configured = getAdminDataClient().ok;
  const sources = configured ? await listSources() : null;

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Live source intake</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            Private manual source URL registry for admin/operator review. Automatic fetch and public publication are disabled in V0.
          </p>
        </div>
        <Link href="/admin/sources/new" className="rounded-full bg-[#C6A55A] px-4 py-2 text-sm font-medium text-[#081423]">
          New source intake
        </Link>
      </div>

      {!configured || sources?.ok === false ? (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">
          {sources && !sources.ok ? sources.error.message : 'Admin source intake is not configured. Set SUPABASE_SERVICE_ROLE_KEY and HARBOURVIEW_ADMIN_REVIEW_ENABLED=true.'}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
            <tr>
              <th className="p-4">Source</th>
              <th className="p-4">Type</th>
              <th className="p-4">Jurisdiction</th>
              <th className="p-4">Use</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sources?.ok && sources.data.length ? sources.data.map((source) => (
              <tr key={source.id} className="text-[#F5F1E8]/75">
                <td className="p-4">
                  <Link href={`/admin/sources/${source.id}`} className="font-medium text-[#F5F1E8] underline-offset-4 hover:underline">
                    {source.source_name || source.source_url}
                  </Link>
                  <div className="mt-1 text-xs text-[#F5F1E8]/45">{source.source_url}</div>
                </td>
                <td className="p-4">{source.source_type}</td>
                <td className="p-4">{source.jurisdiction || 'Not set'}</td>
                <td className="p-4">{source.allowed_use || 'Manual review only'}</td>
                <td className="p-4">{formatDate(source.created_at)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#F5F1E8]/55">No sources captured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
