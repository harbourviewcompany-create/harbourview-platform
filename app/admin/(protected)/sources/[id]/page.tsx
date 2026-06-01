import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { getSourceDetail } from '@/lib/marketplace/candidates';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminAuth();
  const { id } = await params;
  const result = await getSourceDetail(id);

  if (!result.ok) {
    return <section className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">{(result as any).error.message}</section>;
  }

  const { source, snapshots, candidates } = result.data;

  return (
    <section>
      <Link href="/admin/sources" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">Back to sources</Link>
      <div className="mt-6 rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[#C6A55A]">Private source</p>
        <h2 className="mt-2 text-2xl font-semibold">{source.source_name || source.source_url}</h2>
        <dl className="mt-5 grid gap-3 text-sm text-[#F5F1E8]/75 md:grid-cols-2">
          <div><dt className="text-[#C6A55A]">Source URL</dt><dd className="break-all">{source.source_url}</dd></div>
          <div><dt className="text-[#C6A55A]">Source type</dt><dd>{source.source_type}</dd></div>
          <div><dt className="text-[#C6A55A]">Jurisdiction</dt><dd>{source.jurisdiction || 'Not set'}</dd></div>
          <div><dt className="text-[#C6A55A]">Fetch method</dt><dd>{source.fetch_method}</dd></div>
          <div><dt className="text-[#C6A55A]">Allowed use</dt><dd>{source.allowed_use || 'Manual review only'}</dd></div>
          <div><dt className="text-[#C6A55A]">Created</dt><dd>{formatDate(source.created_at)}</dd></div>
        </dl>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="font-semibold">Snapshots</h3>
          <div className="mt-4 space-y-4">
            {snapshots.length ? snapshots.map((snapshot) => (
              <article key={snapshot.id} className="rounded-xl border border-white/10 p-4 text-sm text-[#F5F1E8]/75">
                <p className="font-medium text-[#F5F1E8]">{snapshot.captured_title || 'Manual snapshot'}</p>
                <p className="mt-1 text-xs text-[#C6A55A]">{snapshot.fetch_status} | {formatDate(snapshot.captured_at)}</p>
                <p className="mt-3 line-clamp-4 whitespace-pre-wrap">{snapshot.captured_text || snapshot.error_message || 'No captured text.'}</p>
              </article>
            )) : <p className="text-sm text-[#F5F1E8]/55">No snapshots.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="font-semibold">Candidates</h3>
          <div className="mt-4 space-y-4">
            {candidates.length ? candidates.map((candidate) => (
              <article key={candidate.id} className="rounded-xl border border-white/10 p-4 text-sm text-[#F5F1E8]/75">
                <Link href={`/admin/candidates/${candidate.id}`} className="font-medium text-[#F5F1E8] underline-offset-4 hover:underline">
                  {candidate.title_internal || candidate.title_public_draft || 'Untitled candidate'}
                </Link>
                <p className="mt-1 text-xs text-[#C6A55A]">{candidate.status} | {candidate.subcategory || 'No subcategory'}</p>
              </article>
            )) : <p className="text-sm text-[#F5F1E8]/55">No candidates.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
