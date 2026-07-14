import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { listEvalRows, summarize } from '@/lib/intelligence-automation/evalSet';
import { EvalRowCard } from './EvalRowCard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Intel Eval Set — Stage 0 Labeling',
  robots: { index: false, follow: false },
};

/**
 * Stage 0 of docs/INTELLIGENCE_ARCHITECTURE_SPEC.md — the labeled evaluation set.
 * This is the ground-truth surface every later stage (classifier, promotion)
 * is validated against BEFORE it is wired to anything (spec Section 6.2).
 *
 * Assistant drafts are pre-filled per row (draft_*); the operator confirms or
 * corrects. Precision/recall at Stage 2 is computed on human-confirmed rows only.
 */
export default async function IntelEvalPage() {
  await requireAdminAuth();

  const result = await listEvalRows();
  const rows = result.ok ? result.data : [];
  const isLive = result.ok;
  const s = summarize(rows);
  const donePct = s.total > 0 ? Math.round(((s.confirmed + s.corrected) / s.total) * 100) : 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">
            Intelligence architecture · Stage 0
          </p>
          <h2 className="mt-1 text-2xl font-semibold">Eval Set Labeling</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#F5F1E8]/65">
            Ground-truth labels for the classifier. Confirm or correct each draft. Nothing in the
            pipeline is trusted until it clears the precision/recall bar on the human-confirmed rows
            here.{' '}
            <span
              className={`text-[10px] uppercase tracking-[0.14em] ${
                isLive ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isLive ? 'Live' : 'Unreachable'}
            </span>
          </p>
        </div>
        <Link
          href="/admin/intelligence-automation"
          className="text-sm text-[#C6A55A] underline-offset-4 hover:underline"
        >
          ← Intelligence hub
        </Link>
      </div>

      {/* Progress bar */}
      <div className="rounded-lg border border-white/10 bg-[#0B1A2F]/50 p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#F5F1E8]/70">
          <span>
            <span className="text-lg font-semibold text-[#F5F1E8]">{s.confirmed + s.corrected}</span>
            <span className="text-[#F5F1E8]/45"> / {s.total} human-labeled</span>
          </span>
          <span className="text-emerald-300">{s.confirmed} confirmed</span>
          <span className="text-amber-300">{s.corrected} corrected</span>
          <span className="text-[#F5F1E8]/40">{s.unlabelable} unlabelable</span>
          <span className="text-sky-300">{s.remaining} remaining</span>
          {s.agreementPct !== null ? (
            <span className="text-[#C6A55A]">
              draft agreement {s.agreementPct}% (on {s.confirmed + s.corrected} judged)
            </span>
          ) : null}
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#C6A55A] transition-all"
            style={{ width: `${donePct}%` }}
          />
        </div>
      </div>

      {!isLive ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
          Eval set is unreachable. Confirm <code>SUPABASE_SERVICE_ROLE_KEY</code> is set and the
          <code> api.intel_eval_labeling</code> view exists (migration{' '}
          <code>expose_intel_eval_set_via_api_schema</code>).
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map((row) => (
            <EvalRowCard key={row.signalId} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}
