import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { agentQueue } from '@/lib/intelligence-automation/fixtures';

export const dynamic = 'force-dynamic';

const priorityColors: Record<string, string> = {
  urgent: 'text-red-400 border-red-400/30 bg-red-400/10',
  high: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  medium: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  low: 'text-[#F5F1E8]/40 border-white/15 bg-white/5',
};
const statusColors: Record<string, string> = {
  pending: 'text-amber-400', in_progress: 'text-sky-400',
  completed: 'text-emerald-400', escalated: 'text-red-400', deferred: 'text-[#F5F1E8]/40',
};
const priorityOrder = ['urgent', 'high', 'medium', 'low'];

export default async function IntelAgentsPage() {
  await requireAdminAuth();
  const sorted = [...agentQueue].sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence automation</p>
          <h2 className="mt-1 text-2xl font-semibold">Agent Work Queues</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">Deterministic agent queues for source watching, signal analysis, opportunity qualification, document review, buyer/seller matching, and deal flow.</p>
        </div>
        <Link href="/admin/intelligence-automation" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">← Intelligence hub</Link>
      </div>
      <div className="space-y-3">
        {sorted.map(item => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] ${priorityColors[item.priority]}`}>{item.priority}</span>
                  <span className="text-xs text-[#F5F1E8]/45">{item.agentLabel}</span>
                  <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${statusColors[item.status]}`}>{item.status.replace(/_/g, ' ')}</span>
                </div>
                <h3 className="mt-2 font-semibold text-[#F5F1E8]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/65">{item.rationale}</p>
                <div className="mt-3 rounded-xl border border-[#C6A55A]/15 bg-[#C6A55A]/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#C6A55A]/70">Suggested action</p>
                  <p className="mt-1 text-sm text-[#F5F1E8]/80">{item.suggestedAction}</p>
                </div>
              </div>
              <div className="shrink-0 text-right text-xs text-[#F5F1E8]/45">
                <p>Object: <span className="text-[#F5F1E8]/70">{item.objectLabel}</span></p>
                <p className="mt-1">Next: <span className="text-[#F5F1E8]/70">{item.nextAction}</span></p>
                <p className="mt-1">{item.createdAt}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
