import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { listIaSignals } from '@/lib/intelligence-automation/db';
import { SignalStageActions } from './SignalStageActions';

export const dynamic = 'force-dynamic';

const stageColors: Record<string, string> = {
  new:                        'text-sky-400 border-sky-400/30 bg-sky-400/10',
  needs_review:               'text-amber-400 border-amber-400/30 bg-amber-400/10',
  qualified:                  'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  converted_to_opportunity:   'text-purple-400 border-purple-400/30 bg-purple-400/10',
  linked_to_counterparty:     'text-blue-400 border-blue-400/30 bg-blue-400/10',
  linked_to_market_pathway:   'text-teal-400 border-teal-400/30 bg-teal-400/10',
  archived:                   'text-[#F5F1E8]/35 border-white/15 bg-white/5',
};
const impactColors: Record<string, string> = {
  high: 'text-emerald-400', medium: 'text-amber-400', low: 'text-[#F5F1E8]/50',
};
const stageOrder = ['new','needs_review','qualified','converted_to_opportunity','linked_to_counterparty','linked_to_market_pathway','archived'];

export default async function IntelSignalsPage() {
  await requireAdminAuth();
  const result = await listIaSignals();
  const signals = result.ok ? result.data : [];
  const isLive = result.ok;
  const sorted = [...signals].sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage));

  const stageCounts = stageOrder.reduce<Record<string, number>>((acc, s) => {
    acc[s] = sorted.filter(sig => sig.stage === s).length;
    return acc;
  }, {});

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence automation</p>
          <h2 className="mt-1 text-2xl font-semibold">Signal Inbox</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            Generated commercial signals from source observations. Review, qualify, and convert to opportunities.{' '}
            <span className={`text-[10px] uppercase tracking-[0.14em] ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isLive ? 'Live' : 'Fixture'}
            </span>
          </p>
        </div>
        <Link href="/admin/intelligence-automation" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">← Intelligence hub</Link>
      </div>

      {/* Stage summary bar */}
      <div className="flex flex-wrap gap-2">
        {stageOrder.map(stage => (
          <div key={stage} className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${stageColors[stage]}`}>
            {stageCounts[stage] ?? 0} {stage.replace(/_/g, ' ')}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map(sig => (
          <div key={sig.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] ${stageColors[sig.stage]}`}>
                    {sig.stage.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-[#F5F1E8]/45">{sig.type.replace(/_/g, ' ')}</span>
                </div>
                <h3 className="mt-2 font-semibold text-[#F5F1E8]">{sig.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/65">{sig.summary}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#F5F1E8]/50">
                  <span>Market: <strong className="text-[#F5F1E8]/80">{sig.market}</strong></span>
                  <span>Category: <strong className="text-[#F5F1E8]/80">{sig.category}</strong></span>
                  <span>Source: <strong className="text-[#F5F1E8]/80">{sig.sourceName}</strong></span>
                  <span>Detected: <strong className="text-[#F5F1E8]/80">{sig.detectedAt}</strong></span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-right">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#C6A55A]/70">Confidence</p>
                  <p className="mt-0.5 text-xl font-semibold text-[#F5F1E8]">{sig.confidence}%</p>
                </div>
                <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${impactColors[sig.commercialImpact]}`}>
                  {sig.commercialImpact} impact
                </p>
                <SignalStageActions signalId={sig.id} currentStage={sig.stage} />
              </div>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-8 text-center text-sm text-[#F5F1E8]/45">
            No signals found.
          </div>
        )}
      </div>
    </section>
  );
}
