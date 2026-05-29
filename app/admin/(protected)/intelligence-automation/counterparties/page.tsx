import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { relationshipMemory } from '@/lib/intelligence-automation/fixtures';

export const dynamic = 'force-dynamic';

const docColors: Record<string, string> = {
  complete: 'text-emerald-400', partial: 'text-amber-400', missing: 'text-red-400',
};

export default async function IntelCounterpartiesPage() {
  await requireAdminAuth();
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence automation</p>
          <h2 className="mt-1 text-2xl font-semibold">Relationship Memory</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">Persistent counterparty memory for buyers, sellers, importers, distributors, suppliers, and service providers.</p>
        </div>
        <Link href="/admin/intelligence-automation" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">← Intelligence hub</Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
            <tr>
              <th className="p-4">Counterparty</th><th className="p-4">Role</th><th className="p-4">Markets</th>
              <th className="p-4">Profile</th><th className="p-4">Interactions</th><th className="p-4">Docs</th><th className="p-4">Last contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {relationshipMemory.map(r => (
              <tr key={r.id} className="text-[#F5F1E8]/75 hover:bg-white/[0.02]">
                <td className="p-4">
                  <p className="font-medium text-[#F5F1E8]">{r.name}</p>
                  {r.notes && <p className="mt-1 text-xs text-[#F5F1E8]/40">{r.notes}</p>}
                </td>
                <td className="p-4 text-xs capitalize">{r.role.replace(/_/g, ' ')}</td>
                <td className="p-4"><div className="flex flex-wrap gap-1">{r.markets.map(m => <span key={m} className="rounded-full border border-white/15 px-2 py-0.5 text-[10px]">{m}</span>)}</div></td>
                <td className="p-4 max-w-xs">
                  {r.needsProfile && <p className="text-xs text-sky-300/80"><span className="text-[#F5F1E8]/40">Needs: </span>{r.needsProfile}</p>}
                  {r.supplyProfile && <p className="text-xs text-emerald-300/80"><span className="text-[#F5F1E8]/40">Supply: </span>{r.supplyProfile}</p>}
                </td>
                <td className="p-4 text-center">
                  <p className="font-semibold text-[#F5F1E8]">{r.interactionCount}</p>
                  <p className="text-[10px] text-[#F5F1E8]/40">{r.introductionCount} intros</p>
                </td>
                <td className="p-4"><span className={`text-xs font-semibold uppercase tracking-[0.12em] ${docColors[r.documentationStatus]}`}>{r.documentationStatus}</span></td>
                <td className="p-4 text-xs text-[#F5F1E8]/55">{r.lastInteraction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
