/**
 * Evidence readiness checker — claim-map + corridor flags for operators.
 * Additive; does not change clinical search, conclusions, or disclaimer.
 */

import type {
  CommercialStageGate,
  EvidenceClaimMapEntry,
  EvidenceRecord,
} from "@/lib/clinical/types";
import {
  alignmentQuickScore,
  collectGapsForClaimMap,
  collectGapsForRecord,
  summariseGaps,
  triageSort,
  type GapItem,
} from "@/lib/clinical/framework-gap";

export interface ClaimMapReadinessResult {
  claimId: string;
  status: EvidenceClaimMapEntry["status"];
  score: number;
  gaps: GapItem[];
  summary: ReturnType<typeof summariseGaps>;
  supportingRecordIds: string[];
  stageGatesReady: CommercialStageGate[];
  stageGatesBlocked: CommercialStageGate[];
}

export function assessClaimMapReadiness(
  entry: EvidenceClaimMapEntry,
  records: EvidenceRecord[],
): ClaimMapReadinessResult {
  const byId = new Map(records.map((r) => [r.id, r]));
  const gaps = triageSort(collectGapsForClaimMap(entry, byId));
  const summary = summariseGaps(gaps);

  let score = 0;
  if (entry.status === "supported") score = 80;
  else if (entry.status === "partial") score = 45;
  else if (entry.status === "gap") score = 10;
  else score = 0;

  for (const eid of entry.evidenceRecordIds) {
    const rec = byId.get(eid);
    if (rec?.frameworkAlignment) {
      score = Math.min(100, score + Math.floor(alignmentQuickScore(rec.frameworkAlignment) / 10));
    }
  }
  score = Math.max(0, score - summary.bySeverity.critical * 15 - summary.bySeverity.high * 5);

  const stageGatesReady: CommercialStageGate[] = [];
  const stageGatesBlocked: CommercialStageGate[] = [];
  for (const gate of entry.targetStageGates) {
    const blocked =
      entry.status === "gap" ||
      (entry.status === "partial" &&
        (gate === "label_support" || gate === "payer_dossier")) ||
      summary.bySeverity.critical > 0;
    if (blocked) stageGatesBlocked.push(gate);
    else stageGatesReady.push(gate);
  }

  return {
    claimId: entry.id,
    status: entry.status,
    score,
    gaps,
    summary,
    supportingRecordIds: entry.evidenceRecordIds,
    stageGatesReady,
    stageGatesBlocked,
  };
}

export interface CorridorEvidenceFlag {
  key: string;
  label: string;
  level: "ready" | "caution" | "blocked" | "unknown";
  detail: string;
}

/**
 * Corridor-plan evidence flags for operator workspace.
 * Maps claim-map + fixture readiness into coarse flags for corridor product awareness.
 */
export function corridorEvidenceFlags(
  claimEntries: EvidenceClaimMapEntry[],
  records: EvidenceRecord[],
  opts?: { targetGates?: CommercialStageGate[] },
): CorridorEvidenceFlag[] {
  const flags: CorridorEvidenceFlag[] = [];
  const targetGates = opts?.targetGates ?? ([
    "pilot_corridor",
    "scale_corridor",
    "label_support",
    "payer_dossier",
  ] as CommercialStageGate[]);

  if (!claimEntries.length) {
    flags.push({
      key: "no_claim_map",
      label: "Claim map",
      level: "unknown",
      detail: "No claim-map entries for this corridor context.",
    });
    return flags;
  }

  const assessments = claimEntries.map((e) => assessClaimMapReadiness(e, records));
  const avgScore =
    assessments.reduce((s, a) => s + a.score, 0) / Math.max(1, assessments.length);
  const anyCritical = assessments.some((a) => a.summary.bySeverity.critical > 0);
  const anySupported = assessments.some((a) => a.status === "supported");
  const anyGap = assessments.some((a) => a.status === "gap");

  flags.push({
    key: "claim_support",
    label: "Claim support",
    level: anyGap ? "blocked" : anySupported && avgScore >= 60 ? "ready" : "caution",
    detail: `Avg readiness ${Math.round(avgScore)}; ${assessments.filter((a) => a.status === "supported").length}/${assessments.length} supported.`,
  });

  for (const gate of targetGates) {
    const blockedCount = assessments.filter((a) => a.stageGatesBlocked.includes(gate)).length;
    const readyCount = assessments.filter((a) => a.stageGatesReady.includes(gate)).length;
    let level: CorridorEvidenceFlag["level"] = "unknown";
    if (blockedCount > 0 && readyCount === 0) level = "blocked";
    else if (readyCount > 0 && blockedCount === 0) level = "ready";
    else if (readyCount > 0) level = "caution";
    else level = "caution";
    flags.push({
      key: `gate_${gate}`,
      label: gate.replace(/_/g, " "),
      level,
      detail: `${readyCount} ready / ${blockedCount} blocked across claim-map entries.`,
    });
  }

  const recordsWithAlignment = records.filter((r) => r.frameworkAlignment);
  flags.push({
    key: "framework_coverage",
    label: "Framework coverage",
    level:
      recordsWithAlignment.length === 0
        ? "unknown"
        : recordsWithAlignment.length === records.length
          ? "ready"
          : "caution",
    detail: `${recordsWithAlignment.length}/${records.length} evidence records have frameworkAlignment.`,
  });

  if (anyCritical) {
    flags.push({
      key: "critical_gaps",
      label: "Critical gaps",
      level: "blocked",
      detail: "One or more critical framework or claim-map gaps present.",
    });
  }

  return flags;
}

export function assessRecordReadiness(record: EvidenceRecord): {
  score: number;
  gaps: GapItem[];
  summary: ReturnType<typeof summariseGaps>;
} {
  const gaps = triageSort(collectGapsForRecord(record));
  const summary = summariseGaps(gaps);
  let score = alignmentQuickScore(record.frameworkAlignment);
  score = Math.max(0, score - summary.bySeverity.critical * 20 - summary.bySeverity.high * 8);
  return { score, gaps, summary };
}

export { alignmentQuickScore };
