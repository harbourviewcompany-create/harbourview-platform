import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import {
  listIaSources,
  listIaSignals,
  listIaAgentTasks,
  listIaEvidence,
} from '@/lib/intelligence-automation/db';
import { SignalStageActions } from './signals/SignalStageActions';

export const dynamic = 'force-dynamic';

// ── Active queues: sections backed by a table that actually accumulates new
// rows over time. Counted and surfaced first, with real per-card numbers.
const activeSections = [
  { key: 'signals',  title: 'Signal Inbox',      href: '/admin/intelligence-automation/signals',  eyebrow: 'Signal generation', description: 'Generated commercial signals awaiting qualification.' },
  { key: 'agents',   title: 'Agent Work Queues', href: '/admin/intelligence-automation/agents',   eyebrow: 'Agent queues',      description: 'Deterministic task queue for source watching, analysis, and matching.' },
  { key: 'evidence', title: 'Evidence Vault',    href: '/admin/intelligence-automation/evidence', eyebrow: 'Private evidence',  description: 'COAs, licences, GACP/EU-GMP certificates, and commercial evidence pending review.' },
] as const;

// ── Reference sections: currently backed by a single seed batch or a
// canonical source-backed intelligence packet rather than an active pipeline.
// Shown, but honestly labelled, so they don't read as "live" when they aren't.
const referenceSections = [
  { title: 'Counterparty Intelligence', href: '/admin/intelligence-automation/counterparty-intelligence', eyebrow: 'Market-access pathways', description: 'Verified companies, licences, ownership changes, route-to-market posture, commercial openings, and next triggers.' },
  { title: 'Source Registry',      href: '/admin/intelligence-automation/sources',         eyebrow: 'Data acquisition',    description: 'Intelligence sources across licence databases, regulator feeds, importer directories, and manual relationship inputs.' },
  { title: 'Relationship Memory',  href: '/admin/intelligence-automation/counterparties',  eyebrow: 'Counterparty memory', description: 'Persistent memory for buyers, sellers, importers, distributors, suppliers, and service providers.' },
  { title: 'Counterparty Scoring', href: '/admin/intelligence-automation/scoring',         eyebrow: 'Scoring engine',      description: 'Fit, readiness, and trust scores with routing priority.' },
  { title: 'Market Graph',         href: '/admin/intelligence-automation/market-graph',    eyebrow: 'Graph layer',         description: 'Entities and edges connecting markets, counterparties, pathways, and signals.' },
  { title: 'Commercial Feedback',  href: '/admin/intelligence-automation/feedback',        eyebrow: 'Feedback loop',       description: 'Outcome events that update counterparty scores and routing priorities.' },
  { title: 'Signal Candidates',    href: '/admin/intelligence-automation/signal-candidates', eyebrow: 'Signal engine',     description: 'Candidate queue from the signal engine, ahead of promotion into Signal Inbox.' },
] as const;

const stageBadge: Record<string, string> = {
  new:          'text-sky-400 border-sky-400/30 bg-sky-400/10',
  needs_review: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
};

export default async function IntelligenceAutomationHubPage() {
  await requireAdminAuth();

  const [sourcesResult, signalsResult, tasksResult, evidenceResult] = await Promise.all([
    listIaSources(),
    listIaSignals(),
    listIaAgentTasks(),
    listIaEvidence(),
  ]);

  const signals   = signalsResult.ok ? signalsResult.data : [];
  const tasks     = tasksResult.ok ? tasksResult.data : [];
  const evidence  = evidenceResult.ok ? evidenceResult.data : [];
  const activeSources = sourcesResult.ok ? sourcesResult.data.filter(s => s.status === 'active').length : 0;

  const pending = signals
    .filter(s => s.stage === 'new' || s.stage === 'needs_review')
    .sort((a, b) => b.confidence - a.confidence);

  const urgentTasks     = tasks.filter(a => a.priority === 'urgent').length;
  const pendingEvidence = evidence.filter(e => e.reviewStatus === 'pending' || e.reviewStatus === 'needs_action').length;

  const isSignalPipelineLive = signalsResult.ok && signals.length > 0;

  const activeCounts: Record<string, number> = {
    signals: pending.length,
    agents: urgentTasks,
    evidence: pendingEvidence,
  };

  const totalPending = pending.length + urgentTasks + pendingEvidence;

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Intelligence automation</p>
          <span className={`text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border ${
            isSignalPipelineLive
              ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
              : 'text-amber-400 border-amber-400/30 bg-amber-400/10'
          }`}>
            {isSignalPipelineLive ? 'Signal pipeline — live' : 'Signal pipeline — no data'}
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {totalPending > 0 ? `${totalPending} item${totalPending === 1 ? '' : 's'} need your review` : "You're caught up"}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#F5F1E8]/68">
              Everything below is real work waiting on a decision — not a status report.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Active sources',   value: activeSources },
              { label: 'Pending signals',  value: pending.length },
              { label: 'Urgent tasks',     value: urgentTasks },
              { label: 'Evidence pending', value: pendingEvidence },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                <p className="text-2xl font-semibold text-[#F5F1E8]">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#C6A55A]/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Needs your review: the actual triage queue, actionable inline ── */}
      <div className="rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Signal Inbox</p>
            <h3 className="mt-1 text-xl font-semibold text-[#F5F1E8]">
              {pending.length === 0 ? 'Inbox zero' : `${pending.length} signal${pending.length === 1 ? '' : 's'} waiting on you`}
            </h3>
          </div>
          <Link href="/admin/intelligence-automation/signals" className="shrink-0 text-sm text-[#C6A55A] underline-offset-4 hover:underline">
            Open full inbox →
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 text-center text-sm text-emerald-300/75">
            Nothing pending review right now — new signals land here every 30 minutes.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 10).map(sig => (
              <div key={sig.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${stageBadge[sig.stage] ?? stageBadge.new}`}>
                      {sig.stage.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-[#F5F1E8]/45">{sig.market} · {sig.category.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="mt-1.5 truncate font-medium text-[#F5F1E8]">{sig.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#C6A55A]/70">Confidence</p>
                    <p className="text-lg font-semibold text-[#F5F1E8]">{sig.confidence}%</p>
                  </div>
                  <SignalStageActions signalId={sig.id} currentStage={sig.stage} />
                </div>
              </div>
            ))}
            {pending.length > 10 && (
              <Link href="/admin/intelligence-automation/signals" className="block text-center text-sm text-[#C6A55A] underline-offset-4 hover:underline">
                +{pending.length - 10} more in the full inbox →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Other active queues (Agent tasks, Evidence) — link out, real counts ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {activeSections.filter(s => s.key !== 'signals').map(s => {
          const count = activeCounts[s.key] ?? 0;
          return (
            <Link key={s.href} href={s.href} className="group flex items-center justify-between gap-4 rounded-2xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-5 transition hover:border-[#C6A55A]/55 hover:bg-[#10213A]">
              <div className="min-w-0">
                <span className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{s.eyebrow}</span>
                <h3 className="mt-2 text-lg font-semibold text-[#F5F1E8] group-hover:text-[#D8BC73]">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/65">{s.description}</p>
              </div>
              <div className={`shrink-0 rounded-full border px-3 py-1.5 text-center text-sm font-semibold ${
                count > 0 ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/5 text-[#F5F1E8]/40'
              }`}>
                {count}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Reference sections — honestly labelled: seed/canonical data, not a live queue ── */}
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[#F5F1E8]/40">
          Supporting intelligence · source-backed reference data, not a live queue
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {referenceSections.map(s => (
            <Link key={s.href} href={s.href} className="group rounded-2xl border border-white/10 bg-[#0B1A2F]/60 p-5 opacity-80 transition hover:opacity-100 hover:border-[#C6A55A]/40">
              <span className="text-xs uppercase tracking-[0.22em] text-[#F5F1E8]/40">{s.eyebrow}</span>
              <h3 className="mt-3 text-lg font-semibold text-[#F5F1E8]/85 group-hover:text-[#D8BC73]">{s.title}</h3>
              <p className="mt-3 min-h-16 text-sm leading-6 text-[#F5F1E8]/50">{s.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
