'use client';

import { useState, useTransition } from 'react';
import {
  QUALITY_LABELS,
  CONTENT_TYPES,
  IMPACTS,
  type EvalRow,
} from '@/lib/intelligence-automation/evalSet';
import { saveLabelAction } from './actions';

const QUALITY_HINT: Record<string, string> = {
  signal: 'Substantive real-world development — specific actor + action.',
  boilerplate: 'Repeated site chrome: footers, contact blocks, bylines.',
  spam: 'Selling / affiliate / SEO-bait, or off-topic to cannabis.',
  nav: 'Menus, breadcrumbs, pagination, login/register.',
  duplicate: 'Same event as another sampled row (note the twin).',
};

function badge(active: boolean, tone: 'gold' | 'muted' = 'muted') {
  if (active) {
    return tone === 'gold'
      ? 'border-[#C6A55A] bg-[#C6A55A]/20 text-[#F5F1E8]'
      : 'border-emerald-400 bg-emerald-400/15 text-emerald-200';
  }
  return 'border-white/15 bg-white/[0.02] text-[#F5F1E8]/55 hover:border-[#C6A55A]/40 hover:text-[#F5F1E8]';
}

export function EvalRowCard({ row }: { row: EvalRow }) {
  const human = row.labelStatus === 'confirmed' || row.labelStatus === 'corrected';
  const [quality, setQuality] = useState(row.qualityLabel ?? row.draftQualityLabel ?? 'signal');
  const [content, setContent] = useState(row.contentType ?? row.draftContentType ?? 'noise');
  const [impact, setImpact] = useState(row.impact ?? row.draftImpact ?? 'low');
  const [notes, setNotes] = useState(row.labelNotes ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isNoise = quality !== 'signal';

  function submit(unlabelable: boolean) {
    const fd = new FormData();
    fd.set('signalId', row.signalId);
    fd.set('unlabelable', String(unlabelable));
    fd.set('qualityLabel', quality);
    // For non-signal quality, content_type is definitionally 'noise'.
    fd.set('contentType', isNoise ? 'noise' : content);
    fd.set('impact', impact);
    if (notes.trim()) fd.set('notes', notes.trim());
    startTransition(async () => {
      const res = await saveLabelAction({ ok: false }, fd);
      setMsg(res.message ?? (res.ok ? 'Saved.' : 'Error.'));
    });
  }

  const statusChip =
    row.labelStatus === 'confirmed'
      ? 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10'
      : row.labelStatus === 'corrected'
        ? 'text-amber-300 border-amber-400/40 bg-amber-400/10'
        : row.labelStatus === 'unlabelable'
          ? 'text-[#F5F1E8]/40 border-white/15 bg-white/5'
          : 'text-sky-300 border-sky-400/30 bg-sky-400/10';

  return (
    <div className="rounded-lg border border-white/10 bg-[#0B1A2F]/60 p-4">
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#F5F1E8]/45">
        <span className={`rounded-full border px-2 py-0.5 ${statusChip}`}>{row.labelStatus}</span>
        <span>{row.lang}</span>
        <span>· {row.country || '—'}</span>
        <span>· score {row.score}</span>
        <span>· {row.topLane}</span>
        <span className="text-[#F5F1E8]/30">· {row.stratum}</span>
      </div>

      <h3 className="mt-2 text-sm font-medium leading-5 text-[#F5F1E8]">{row.headline}</h3>
      <p className="mt-1 line-clamp-3 text-xs leading-5 text-[#F5F1E8]/55">{row.summary}</p>
      <div className="mt-1 flex items-center gap-3 text-[11px] text-[#F5F1E8]/40">
        <span className="truncate">{row.source}</span>
        {row.url ? (
          <a
            href={row.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-[#C6A55A] underline-offset-2 hover:underline"
          >
            open source ↗
          </a>
        ) : null}
      </div>

      {row.draftReason ? (
        <p className="mt-2 rounded border border-[#C6A55A]/20 bg-[#C6A55A]/[0.06] px-2 py-1 text-[11px] leading-4 text-[#F5F1E8]/60">
          <span className="text-[#C6A55A]">draft:</span> {row.draftQualityLabel}
          {row.draftQualityLabel === 'signal' ? ` · ${row.draftContentType} · ${row.draftImpact}` : ''} — {row.draftReason}
        </p>
      ) : null}

      {/* quality_label */}
      <div className="mt-3">
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#F5F1E8]/40">quality</p>
        <div className="flex flex-wrap gap-1.5">
          {QUALITY_LABELS.map((q) => (
            <button
              key={q}
              type="button"
              title={QUALITY_HINT[q]}
              onClick={() => setQuality(q)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${badge(quality === q)}`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* content_type — only meaningful for a real signal */}
      {!isNoise ? (
        <div className="mt-3">
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#F5F1E8]/40">content type</p>
          <div className="flex flex-wrap gap-1.5">
            {CONTENT_TYPES.filter((c) => c !== 'noise').map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setContent(c)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${badge(content === c)}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-[#F5F1E8]/35">content type → noise (auto, non-signal)</p>
      )}

      {/* impact */}
      <div className="mt-3">
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#F5F1E8]/40">impact</p>
        <div className="flex flex-wrap gap-1.5">
          {IMPACTS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setImpact(i)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${badge(impact === i, 'gold')}`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="notes (e.g. duplicate twin id, why corrected)…"
        rows={2}
        className="mt-3 w-full rounded border border-white/10 bg-[#081423] px-2 py-1.5 text-xs text-[#F5F1E8] placeholder:text-[#F5F1E8]/30 focus:border-[#C6A55A]/50 focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(false)}
          className="rounded-full border border-[#C6A55A] bg-[#C6A55A]/15 px-3.5 py-1.5 text-xs font-medium text-[#F5F1E8] transition hover:bg-[#C6A55A]/25 disabled:opacity-50"
        >
          {human ? 'Update label' : 'Confirm / save'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(true)}
          className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#F5F1E8]/55 transition hover:bg-white/5 disabled:opacity-50"
        >
          Unlabelable
        </button>
        {pending ? <span className="text-[11px] text-[#F5F1E8]/40">saving…</span> : null}
        {msg ? <span className="text-[11px] text-[#C6A55A]">{msg}</span> : null}
      </div>
    </div>
  );
}
