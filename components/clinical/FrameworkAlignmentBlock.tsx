/**
 * Read-only framework alignment block for operator / clinical workspace.
 * Displays IMDRF pillars, DTA domains, RWE phases, stage-gates, ALCOA+, FDA RWE.
 * Never presents as clinical advice.
 */

import type { ReactNode } from "react";
import type { EvidenceRecord, FrameworkAlignment } from "@/lib/clinical/types";
import { alignmentQuickScore } from "@/lib/clinical/framework-gap";

function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
      : tone === "warn"
        ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800"
        : "bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{title}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

export function FrameworkAlignmentBlock({
  alignment,
  evidenceId,
  compact = false,
}: {
  alignment?: FrameworkAlignment | null;
  evidenceId?: string;
  compact?: boolean;
}) {
  if (!alignment) {
    return (
      <div className="rounded border border-dashed border-neutral-300 p-3 text-xs text-neutral-500 dark:border-neutral-600">
        No framework alignment mapped{evidenceId ? ` for ${evidenceId}` : ""}. Operator mapping optional.
      </div>
    );
  }

  const score = alignmentQuickScore(alignment);
  const rwe = alignment.fdaRweRelevanceReliability ?? "not_assessed";

  return (
    <div className="space-y-3 rounded border border-neutral-200 bg-neutral-50/50 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-900/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-neutral-800 dark:text-neutral-100">
          Framework alignment
          {evidenceId ? (
            <span className="ml-1 font-normal text-neutral-500">· {evidenceId}</span>
          ) : null}
        </span>
        <Pill tone={score >= 70 ? "ok" : score >= 40 ? "warn" : "neutral"}>Score {score}/100</Pill>
      </div>

      {!compact && (
        <>
          {alignment.imdrfPillars?.length ? (
            <Section title="IMDRF N41 pillars">
              {alignment.imdrfPillars.map((p) => (
                <Pill key={p}>{p.replace(/_/g, " ")}</Pill>
              ))}
            </Section>
          ) : null}

          {alignment.dtaDomains?.length ? (
            <Section title="DTA domains">
              {alignment.dtaDomains.map((d) => (
                <Pill key={d}>{d.replace(/_/g, " ")}</Pill>
              ))}
            </Section>
          ) : null}

          {alignment.dtxRwePhases?.length ? (
            <Section title="DTx RWE phases">
              {alignment.dtxRwePhases.map((p) => (
                <Pill key={p}>{p.replace(/_/g, " ")}</Pill>
              ))}
            </Section>
          ) : null}

          {alignment.commercialStageGates?.length ? (
            <Section title="Commercial stage-gates">
              {alignment.commercialStageGates.map((g) => (
                <Pill key={g} tone="ok">
                  {g.replace(/_/g, " ")}
                </Pill>
              ))}
            </Section>
          ) : null}

          <Section title="FDA RWE relevance/reliability">
            <Pill tone={rwe === "relevant_reliable" ? "ok" : rwe === "relevant_limited" ? "warn" : "neutral"}>
              {rwe.replace(/_/g, " ")}
            </Pill>
          </Section>

          {alignment.alcoaPlus?.length ? (
            <Section title="ALCOA+">
              {alignment.alcoaPlus.map((a) => (
                <Pill key={a}>{a}</Pill>
              ))}
            </Section>
          ) : null}

          {alignment.operatorNotes ? (
            <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              {alignment.operatorNotes}
            </p>
          ) : null}

          {alignment.frameworkMappedAt ? (
            <p className="text-[10px] text-neutral-400">Mapped {alignment.frameworkMappedAt}</p>
          ) : null}
        </>
      )}

      {compact && (
        <div className="flex flex-wrap gap-1">
          {(alignment.commercialStageGates ?? []).slice(0, 4).map((g) => (
            <Pill key={g}>{g.replace(/_/g, " ")}</Pill>
          ))}
          <Pill tone={rwe === "relevant_reliable" ? "ok" : "neutral"}>{rwe.replace(/_/g, " ")}</Pill>
        </div>
      )}
    </div>
  );
}

/** Resolve alignment from an EvidenceRecord (fixture or live). */
export function FrameworkAlignmentFromRecord({ record }: { record: EvidenceRecord }) {
  return (
    <FrameworkAlignmentBlock alignment={record.frameworkAlignment} evidenceId={record.id} />
  );
}
