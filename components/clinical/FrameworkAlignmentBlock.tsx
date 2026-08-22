'use client'

/**
 * Phase C — Read-only Framework Alignment block.
 * Commercial evidence strategy metadata only. Does not alter clinical conclusions,
 * GRADE-style strength, or liability posture. Render only when data is present.
 */

import type { FrameworkAlignment } from '@/lib/clinical/types'

const statusClass = (status: string) => {
  if (status === 'covered' || status === 'strong' || status === 'adequate')
    return 'bg-emerald-700/35 text-emerald-100'
  if (status === 'partial') return 'bg-amber-700/35 text-amber-100'
  if (status === 'missing' || status === 'not_assessed') return 'bg-red-800/35 text-red-100'
  return 'bg-white/10 text-white/70'
}

const labelPillar: Record<string, string> = {
  valid_clinical_association: 'Valid clinical association',
  analytical_validation: 'Analytical validation',
  clinical_validation: 'Clinical validation',
}

const labelDomain: Record<string, string> = {
  safety: 'Safety',
  benefit: 'Benefit',
  durability: 'Durability',
  usability_accessibility: 'Usability / accessibility',
  user_engagement: 'User engagement',
}

export function FrameworkAlignmentBlock({
  alignment,
  compact = false,
}: {
  alignment: FrameworkAlignment
  compact?: boolean
}) {
  const pillars = alignment.imdrfPillars
    ? Object.entries(alignment.imdrfPillars)
    : []
  const domains = alignment.dtaDomains ?? []
  const rr = alignment.relevanceReliability

  return (
    <div
      className="rounded-lg border border-[#c6a55a]/25 bg-[#c6a55a]/[0.06] p-3"
      data-testid="framework-alignment-block"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a853]">
          Framework alignment
        </p>
        {alignment.commercialStageGate && (
          <span className="rounded px-1.5 py-0.5 text-[10px] bg-white/10 text-white/70">
            gate: {alignment.commercialStageGate}
          </span>
        )}
        {alignment.commercialPriority && (
          <span className="rounded px-1.5 py-0.5 text-[10px] bg-white/10 text-white/70">
            pri: {alignment.commercialPriority}
          </span>
        )}
        {alignment.dtxRwePhase && (
          <span className="rounded px-1.5 py-0.5 text-[10px] bg-white/10 text-white/70">
            DTx RWE: {alignment.dtxRwePhase}
          </span>
        )}
        {typeof alignment.alcoaPlusComplete === 'boolean' && (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] ${
              alignment.alcoaPlusComplete
                ? 'bg-emerald-700/35 text-emerald-100'
                : 'bg-amber-700/35 text-amber-100'
            }`}
          >
            ALCOA+ {alignment.alcoaPlusComplete ? 'complete' : 'incomplete'}
          </span>
        )}
      </div>

      {!compact && (
        <p className="mt-1.5 text-[11px] leading-4 text-white/45">
          Commercial / regulatory readiness metadata. Does not replace graded strength, limitations,
          or primary sources.
        </p>
      )}

      {pillars.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">IMDRF pillars</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {pillars.map(([key, val]) => (
              <span
                key={key}
                className={`rounded px-1.5 py-0.5 text-[10px] ${statusClass(val.status)}`}
                title={val.notes}
              >
                {labelPillar[key] ?? key}: {val.status}
              </span>
            ))}
          </div>
        </div>
      )}

      {domains.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">DTA domains</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {domains.map((d, i) => (
              <span
                key={`${d.domain}-${d.ecosystem}-${i}`}
                className={`rounded px-1.5 py-0.5 text-[10px] ${statusClass(d.status)}`}
                title={d.notes}
              >
                {labelDomain[d.domain] ?? d.domain}/{d.ecosystem}: {d.status}
              </span>
            ))}
          </div>
        </div>
      )}

      {rr && (
        <div className="mt-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">FDA RWE relevance / reliability</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(
              [
                'availability',
                'generalizability',
                'accuracy',
                'completeness',
                'provenance',
              ] as const
            ).map((k) => (
              <span key={k} className={`rounded px-1.5 py-0.5 text-[10px] ${statusClass(rr[k])}`}>
                {k}: {rr[k]}
              </span>
            ))}
          </div>
          {rr.overallNotes && (
            <p className="mt-1 text-[11px] text-white/45">{rr.overallNotes}</p>
          )}
        </div>
      )}
    </div>
  )
}
