import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { listIaCounterparties } from '@/lib/intelligence-automation/db';
import { AddCounterpartyForm, LogInteractionButton, DocStatusSelect, DeleteCounterpartyButton, EditCounterpartyButton } from './CounterpartyActions';

export const dynamic = 'force-dynamic';

const docColors: Record<string, string> = {
  complete: 'text-emerald-400',
  partial:  'text-amber-400',
  missing:  'text-red-400',
};

export default async function IntelCounterpartiesPage() {
  await requireAdminAuth();
  const result = await listIaCounterparties();
  const records = result.ok ? result.data : [];
  const isLive = result.ok;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence automation</p>
          <h2 className="mt-1 text-2xl font-semibold">Relationship Memory</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            Persistent counterparty memory for buyers, sellers, importers, distributors, suppliers, and service providers.{' '}
            <span className={`text-[10px] uppercase tracking-[0.14em] ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isLive ? 'Live' : 'Fixture'}
            </span>
          </p>
        </div>
        <Link href="/admin/intelligence-automation" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">← Intelligence hub</Link>
      </div>

      {/* Doc status summary */}
      <div className="flex flex-wrap gap-2">
        {(['complete','partial','missing'] as const).map(status => {
          const count = records.filter(r => r.documentationStatus === status).length;
          return (
            <div key={status} className={`rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${docColors[status]}`}>
              {count} {status}
            </div>
          );
        })}
      </div>

      {/* Add new counterparty */}
      <AddCounterpartyForm />

      <div className="overflow-x-auto rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
            <tr>
              <th className="p-4">Counterparty</th>
              <th className="p-4">Role</th>
              <th className="p-4">Markets</th>
              <th className="p-4">Profile</th>
              <th className="p-4">Interactions</th>
              <th className="p-4">Docs</th>
              <th className="p-4">Last contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {records.map(r => (
              <tr key={r.id} className="text-[#F5F1E8]/75 hover:bg-white/[0.02]">
                <td className="p-4">
                  <p className="font-medium text-[#F5F1E8]">{r.name}</p>
                  {r.notes && <p className="mt-1 text-xs text-[#F5F1E8]/40">{r.notes}</p>}
                </td>
                <td className="p-4 text-xs capitalize">{r.role.replace(/_/g, ' ')}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {r.markets.map(m => (
                      <span key={m} className="rounded-full border border-white/15 px-2 py-0.5 text-[10px]">{m}</span>
                    ))}
                  </div>
                </td>
                <td className="p-4 max-w-xs">
                  {r.needsProfile  && <p className="text-xs text-sky-300/80"><span className="text-[#F5F1E8]/40">Needs: </span>{r.needsProfile}</p>}
                  {r.supplyProfile && <p className="text-xs text-emerald-300/80"><span className="text-[#F5F1E8]/40">Supply: </span>{r.supplyProfile}</p>}
                </td>
                <td className="p-4 text-center">
                  <p className="font-semibold text-[#F5F1E8]">{r.interactionCount}</p>
                  <p className="text-[10px] text-[#F5F1E8]/40">{r.introductionCount} intros</p>
                  <LogInteractionButton id={r.id} currentCount={r.interactionCount} />
                  <EditCounterpartyButton
                    id={r.id}
                    name={r.name}
                    role={r.role}
                    markets={r.markets}
                    categories={r.categories}
                    needsProfile={r.needsProfile}
                    supplyProfile={r.supplyProfile}
                    notes={r.notes}
                  />
                  <DeleteCounterpartyButton id={r.id} name={r.name} />
                </td>
                <td className="p-4">
                  <DocStatusSelect id={r.id} status={r.documentationStatus} />
                </td>
                <td className="p-4 text-xs text-[#F5F1E8]/55">{r.lastInteraction || '—'}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#F5F1E8]/45">No counterparties found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
