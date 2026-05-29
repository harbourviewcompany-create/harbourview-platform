import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { feedbackEvents } from '@/lib/intelligence-automation/fixtures';

export const dynamic = 'force-dynamic';

const impactColors: Record<string, string> = {
  positive: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  negative: 'text-red-400 border-red-400/30 bg-red-400/10',
  neutral: 'text-[#F5F1E8]/50 border-white/20 bg-white/5',
};
const outcomeColors: Record<string, string> = {
  won: 'text-emerald-400', intro_sent: 'text-emerald-300', in_discussion: 'text-sky-400',
  qualified: 'text-blue-400', docs_received: 'text-teal-400', reviewed: 'text-[#F5F1E8]/70',
  docs_requested: 'text-amber-400', needs_future_follow_up: 'text-amber-300',
  converted_to_opportunity: 'text-purple-400', buyer_passed: 'text-red-400',
  seller_passed: 'text-red-400', unresponsive: 'text-red-400/70',
  weak_fit: 'text-red-400/60', dormant: 'text-[#F5F1E8]/40',
  valuable_relationship: 'text-[#C6A55A]', ignored: 'text-[#F5F1E8]/35',
  intro_proposed: 'text-sky-300', lost: 'text-red-500',
};

export default async function IntelFeedbackPage() {
  await requireAdminAuth();
  const sorted = [...feedbackEvents].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence automation</p>
          <h2 className="mt-1 text-2xl font-semibold">Commercial Feedback Loop</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">Outcome events that update counterparty scores, routing priorities, and trust levels. Closes the commercial intelligence feedback loop.</p>
        </div>
        <Link href="/admin/intelligence-automation" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">← Intelligence hub</Link>
      </div>
      <div className="space-y-3">
        {sorted.map(ev => (
          <div key={ev.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-semibold capitalize ${outcomeColors[ev.outcomeType] ?? 'text-[#F5F1E8]/70'}`}>{ev.outcomeType.replace(/_/g, ' ')}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${impactColors[ev.scoreImpact]}`}>{ev.scoreImpact} impact</span>
                </div>
                {ev.counterpartyName && <p className="mt-1.5 text-sm font-medium text-[#F5F1E8]/90">{ev.counterpartyName}</p>}
                <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/65">{ev.routingImpact}</p>
                {ev.notes && <p className="mt-1 text-xs text-amber-400/80">{ev.notes}</p>}
              </div>
              <div className="shrink-0 text-right text-xs text-[#F5F1E8]/45">
                <p>{ev.market}</p><p>{ev.category}</p><p className="mt-1">{ev.loggedAt}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
