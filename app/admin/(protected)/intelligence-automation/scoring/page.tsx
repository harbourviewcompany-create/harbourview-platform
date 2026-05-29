import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { scoringRecords } from '@/lib/intelligence-automation/fixtures';

export const dynamic = 'force-dynamic';

const priorityColors: Record<string, string> = {
  high: 'text-emerald-400', medium: 'text-amber-400', low: 'text-[#F5F1E8]/50',
  urgent: 'text-red-400', soon: 'text-amber-400', when_ready: 'text-[#F5F1E8]/60',
  dormant: 'text-[#F5F1E8]/35', not_ready: 'text-red-400/70',
};

function ScoreBar({ value }: { value: number }) {
  const color = value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : '#f87171';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

export default async function IntelScoringPage() {
  await requireAdminAuth();
  const sorted = [...scoringRecords].sort((a, b) => b.fitScore - a.fitScore);
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence automation</p>
          <h2 className="mt-1 text-2xl font-semibold">Counterparty Scoring</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">Fit, readiness, and trust scores. Routing priority, follow-up priority, and introduction priority across active counterparties.</p>
        </div>
        <Link href="/admin/intelligence-automation" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">← Intelligence hub</Link>
      </div>
      <div className="space-y-3">
        {sorted.map(sc => (
          <div key={sc.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-[#F5F1E8]">{sc.counterpartyName}</h3>
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] capitalize text-[#F5F1E8]/60">{sc.counterpartyRole.replace(/_/g, ' ')}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <div><p className="text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Fit</p><ScoreBar value={sc.fitScore} /></div>
                  <div><p className="text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Readiness</p><ScoreBar value={sc.readinessScore} /></div>
                  <div><p className="text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Trust</p><ScoreBar value={sc.trustScore} /></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {sc.scoreDrivers.map(d => <span key={d} className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#F5F1E8]/55">{d}</span>)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 text-right text-xs">
                <p><span className="text-[#F5F1E8]/40">Routing: </span><span className={`font-semibold uppercase ${priorityColors[sc.routingPriority]}`}>{sc.routingPriority}</span></p>
                <p><span className="text-[#F5F1E8]/40">Follow-up: </span><span className={`font-semibold uppercase ${priorityColors[sc.followUpPriority]}`}>{sc.followUpPriority.replace(/_/g, ' ')}</span></p>
                <p><span className="text-[#F5F1E8]/40">Intro: </span><span className={`font-semibold uppercase ${priorityColors[sc.introductionPriority]}`}>{sc.introductionPriority.replace(/_/g, ' ')}</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
