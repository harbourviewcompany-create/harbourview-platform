'use client'

/**
 * Corridor evidence readiness flags — operator / corridor-plan awareness.
 * Read-only; does not alter clinical conclusions or disclaimer.
 */
import { useMemo } from 'react'
import type { CorridorEvidenceFlag } from '@/lib/clinical/evidence-readiness'
import { corridorEvidenceFlags } from '@/lib/clinical/evidence-readiness'
import { CLAIM_MAP_FIXTURES } from '@/lib/fixtures/clinical/claim-map'
import { EVIDENCE_FIXTURES } from '@/lib/fixtures/clinical/evidence'

const levelClass: Record<CorridorEvidenceFlag['level'], string> = {
  ready: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  caution: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  blocked: 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200',
  unknown: 'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300',
}

export function CorridorEvidenceFlagsPanel({
  flags,
  title = 'Corridor evidence readiness',
  compact = false,
}: {
  flags: CorridorEvidenceFlag[]
  title?: string
  compact?: boolean
}) {
  if (!flags.length) return null

  return (
    <section className={compact ? 'space-y-1.5' : 'space-y-2'} style={{ marginTop: compact ? 8 : 12 }}>
      {!compact && (
        <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{title}</h3>
      )}
      <ul className={`grid gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
        {flags.map((f) => (
          <li
            key={f.key}
            className={`rounded border px-2.5 py-2 text-xs ${levelClass[f.level]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium capitalize">{f.label}</span>
              <span className="uppercase tracking-wide opacity-80">{f.level}</span>
            </div>
            <p className="mt-0.5 opacity-90">{f.detail}</p>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-neutral-500">
        Operator mapping only. Not clinical advice. Framework alignment does not change published
        evidence strength or conclusions.
      </p>
    </section>
  )
}

/** Fixture-backed panel for Command Centre / Access Pathway corridor tab. */
export function CorridorEvidenceFlagsFromFixtures({
  title = 'Clinical evidence readiness (claim-map)',
  compact = true,
}: {
  title?: string
  compact?: boolean
}) {
  const flags = useMemo(
    () => corridorEvidenceFlags(CLAIM_MAP_FIXTURES, EVIDENCE_FIXTURES),
    [],
  )
  return <CorridorEvidenceFlagsPanel flags={flags} title={title} compact={compact} />
}
