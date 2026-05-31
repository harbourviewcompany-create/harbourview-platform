import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { listIaSources } from '@/lib/intelligence-automation/db';

export const dynamic = 'force-dynamic';

const reliabilityColors: Record<string, string> = {
  high:       'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  medium:     'text-amber-400 border-amber-400/30 bg-amber-400/10',
  low:        'text-red-400 border-red-400/30 bg-red-400/10',
  unverified: 'text-[#F5F1E8]/50 border-white/20 bg-white/5',
};
const statusColors: Record<string, string> = {
  active:       'text-emerald-400',
  paused:       'text-amber-400',
  needs_review: 'text-red-400',
  deprecated:   'text-[#F5F1E8]/35',
};

export default async function IntelSourcesPage() {
  await requireAdminAuth();
  const result = await listIaSources();
  const sources = result.ok ? result.data : [];
  const isLive = result.ok;

  const statusCounts = ['active','paused','needs_review','deprecated'].reduce<Record<string, number>>((acc, s) => {
    acc[s] = sources.filter(src => src.status === s).length;
    return acc;
  }, {});

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence automation</p>
          <h2 className="mt-1 text-2xl font-semibold">Source Registry</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            Global intelligence sources.{' '}
            <span className={`text-[10px] uppercase tracking-[0.14em] ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isLive ? 'Live — Supabase' : 'Fixture fallback — validate before live fetch'}
            </span>
          </p>
        </div>
        <Link href="/admin/intelligence-automation" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">← Intelligence hub</Link>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${statusColors[status] ?? ''} border-white/15 bg-white/5`}>
            {count} {status.replace(/_/g, ' ')}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
            <tr>
              <th className="p-4">Source</th>
              <th className="p-4">Category</th>
              <th className="p-4">Markets</th>
              <th className="p-4">Reliability</th>
              <th className="p-4">Signals</th>
              <th className="p-4">Last checked</th>
              <th className="p-4">Next check</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {sources.map(s => (
              <tr key={s.id} className="text-[#F5F1E8]/75 hover:bg-white/[0.02]">
                <td className="p-4">
                  <p className="font-medium text-[#F5F1E8]">{s.name}</p>
                  {s.notes && <p className="mt-1 text-xs text-[#F5F1E8]/40">{s.notes}</p>}
                </td>
                <td className="p-4 text-xs">{s.category.replace(/_/g, ' ')}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {s.markets.map(m => (
                      <span key={m} className="rounded-full border border-white/15 px-2 py-0.5 text-[10px]">{m}</span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${reliabilityColors[s.reliability]}`}>
                    {s.reliability}
                  </span>
                </td>
                <td className="p-4 text-center font-semibold">{s.signalYield}</td>
                <td className="p-4 text-xs text-[#F5F1E8]/55">{s.lastChecked || '—'}</td>
                <td className="p-4 text-xs text-[#F5F1E8]/55">{s.nextCheck || '—'}</td>
                <td className="p-4">
                  <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${statusColors[s.status] ?? ''}`}>
                    {s.status.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#F5F1E8]/45">No sources found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
