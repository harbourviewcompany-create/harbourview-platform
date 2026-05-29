import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { graphEntities, graphEdges } from '@/lib/intelligence-automation/fixtures';

export const dynamic = 'force-dynamic';

const typeColors: Record<string, string> = {
  market: 'text-[#C6A55A] border-[#C6A55A]/30 bg-[#C6A55A]/10',
  country: 'text-[#C6A55A] border-[#C6A55A]/30 bg-[#C6A55A]/10',
  pathway: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  opportunity: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  signal: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  importer: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  distributor: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  seller: 'text-emerald-300 border-emerald-300/30 bg-emerald-300/10',
  buyer: 'text-sky-300 border-sky-300/30 bg-sky-300/10',
  supplier: 'text-teal-400 border-teal-400/30 bg-teal-400/10',
  consultant: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  source: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  category: 'text-[#F5F1E8]/60 border-white/20 bg-white/5',
};
const strengthColors: Record<string, string> = {
  strong: 'text-emerald-400', medium: 'text-amber-400', weak: 'text-[#F5F1E8]/40',
};

export default async function IntelGraphPage() {
  await requireAdminAuth();
  const byType = graphEntities.reduce<Record<string, number>>((acc, e) => { acc[e.type] = (acc[e.type] ?? 0) + 1; return acc; }, {});
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence automation</p>
          <h2 className="mt-1 text-2xl font-semibold">Market Graph</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">Entities and edges connecting markets, counterparties, pathways, signals, categories, and sources.</p>
        </div>
        <Link href="/admin/intelligence-automation" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">← Intelligence hub</Link>
      </div>
      <div>
        <h3 className="mb-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A]/70">Entity coverage</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(byType).map(([type, count]) => (
            <div key={type} className={`rounded-full border px-3 py-1.5 text-xs ${typeColors[type] ?? 'text-[#F5F1E8]/60 border-white/20'}`}>
              <span className="font-semibold">{count}</span> <span className="capitalize">{type.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
            <tr><th className="p-4">Entity</th><th className="p-4">Type</th><th className="p-4">Market</th><th className="p-4">Connections</th><th className="p-4">Signals</th><th className="p-4">Last activity</th></tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {[...graphEntities].sort((a,b) => b.connectionCount - a.connectionCount).map(e => (
              <tr key={e.id} className="text-[#F5F1E8]/75 hover:bg-white/[0.02]">
                <td className="p-4 font-medium text-[#F5F1E8]">{e.label}</td>
                <td className="p-4"><span className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${typeColors[e.type] ?? 'text-[#F5F1E8]/50 border-white/15'}`}>{e.type.replace(/_/g, ' ')}</span></td>
                <td className="p-4 text-xs text-[#F5F1E8]/55">{e.market ?? '—'}</td>
                <td className="p-4 text-center font-semibold">{e.connectionCount}</td>
                <td className="p-4 text-center">{e.signalCount}</td>
                <td className="p-4 text-xs text-[#F5F1E8]/45">{e.lastActivity ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h3 className="mb-3 text-xs uppercase tracking-[0.18em] text-[#C6A55A]/70">Graph edges ({graphEdges.length})</h3>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1A2F]">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
              <tr><th className="p-4">From</th><th className="p-4">Relationship</th><th className="p-4">To</th><th className="p-4">Strength</th><th className="p-4">Evidenced</th></tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {graphEdges.map(e => (
                <tr key={e.id} className="text-[#F5F1E8]/70 hover:bg-white/[0.02]">
                  <td className="p-4 text-sm">{e.fromLabel}</td>
                  <td className="p-4 text-xs text-[#C6A55A]/70">{e.type.replace(/_/g, ' ')}</td>
                  <td className="p-4 text-sm">{e.toLabel}</td>
                  <td className="p-4"><span className={`text-xs font-semibold ${strengthColors[e.strength]}`}>{e.strength}</span></td>
                  <td className="p-4 text-xs">{e.evidenced ? <span className="text-emerald-400">Yes</span> : <span className="text-[#F5F1E8]/35">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
