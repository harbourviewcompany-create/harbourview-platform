/**
 * Framework gap helpers — IMDRF / DTA / ALCOA+ / FDA RWE / commercial stage-gates.
 * Operator triage only. Never mutates clinical conclusions or public search.
 */

import type {
  AlcoaPlusDimension,
  CommercialStageGate,
  DtaDomain,
  EvidenceClaimMapEntry,
  EvidenceRecord,
  FrameworkAlignment,
  ImdrfPillar,
  RelevanceReliabilityStatus,
} from "@/lib/clinical/types";

export type GapSeverity = "critical" | "high" | "medium" | "low" | "info";

export type GapCategory =
  | "imdrf"
  | "dta"
  | "alcoa_plus"
  | "fda_rwe"
  | "stage_gate"
  | "claim_map"
  | "provenance";

export interface GapItem {
  id: string;
  category: GapCategory;
  severity: GapSeverity;
  title: string;
  detail: string;
  evidenceRecordId?: string;
  claimMapId?: string;
  recommendedAction?: string;
}

const ALL_IMDRF: ImdrfPillar[] = [
  "clinical_association",
  "analytical_validation",
  "clinical_validation",
];

const ALL_DTA: DtaDomain[] = [
  "product_design",
  "clinical_evidence",
  "cybersecurity_privacy",
  "usability_accessibility",
  "interoperability_data",
];

const ALL_ALCOA: AlcoaPlusDimension[] = [
  "attributable",
  "legible",
  "contemporaneous",
  "original",
  "accurate",
  "complete",
  "consistent",
  "enduring",
  "available",
];

const SEVERITY_ORDER: Record<GapSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function collectGapsForRecord(record: EvidenceRecord): GapItem[] {
  const gaps: GapItem[] = [];
  const fa = record.frameworkAlignment;

  if (!fa) {
    gaps.push({
      id: `${record.id}-no-alignment`,
      category: "provenance",
      severity: "medium",
      title: "No framework alignment metadata",
      detail: `Record ${record.id} has no frameworkAlignment. Optional for clinical search; required for commercial stage-gate scoring.`,
      evidenceRecordId: record.id,
      recommendedAction: "Map IMDRF / DTA / stage-gates / ALCOA+ on this record.",
    });
    return gaps;
  }

  // IMDRF
  const pillars = fa.imdrfPillars ?? [];
  for (const p of ALL_IMDRF) {
    if (!pillars.includes(p)) {
      const severity: GapSeverity =
        p === "clinical_validation" ? "high" : p === "clinical_association" ? "medium" : "low";
      gaps.push({
        id: `${record.id}-imdrf-${p}`,
        category: "imdrf",
        severity,
        title: `IMDRF pillar missing: ${p}`,
        detail: `Record does not declare contribution to IMDRF N41 pillar "${p}".`,
        evidenceRecordId: record.id,
        recommendedAction: "Confirm whether this record can support the pillar or mark not applicable.",
      });
    }
  }

  // DTA clinical_evidence is expected for efficacy domain
  const dta = fa.dtaDomains ?? [];
  if (record.domain === "efficacy" && !dta.includes("clinical_evidence")) {
    gaps.push({
      id: `${record.id}-dta-clinical`,
      category: "dta",
      severity: "high",
      title: "DTA clinical_evidence domain missing",
      detail: "Efficacy record should map to DTA clinical_evidence domain.",
      evidenceRecordId: record.id,
    });
  }
  for (const d of ALL_DTA) {
    if (!dta.includes(d) && d !== "clinical_evidence") {
      gaps.push({
        id: `${record.id}-dta-${d}`,
        category: "dta",
        severity: "info",
        title: `DTA domain not mapped: ${d}`,
        detail: `Optional DTA domain "${d}" not declared on this record.`,
        evidenceRecordId: record.id,
      });
    }
  }

  // ALCOA+
  const alcoa = fa.alcoaPlus ?? [];
  for (const dim of ALL_ALCOA) {
    if (!alcoa.includes(dim)) {
      const severity: GapSeverity =
        dim === "attributable" || dim === "accurate" || dim === "original" ? "high" : "medium";
      gaps.push({
        id: `${record.id}-alcoa-${dim}`,
        category: "alcoa_plus",
        severity,
        title: `ALCOA+ dimension missing: ${dim}`,
        detail: `Provenance does not demonstrate ALCOA+ "${dim}".`,
        evidenceRecordId: record.id,
        recommendedAction: "Strengthen source provenance or document limitation.",
      });
    }
  }

  // FDA RWE
  const rwe = fa.fdaRweRelevanceReliability ?? "not_assessed";
  if (rwe === "not_assessed" || rwe === "insufficient") {
    gaps.push({
      id: `${record.id}-fda-rwe`,
      category: "fda_rwe",
      severity: rwe === "insufficient" ? "high" : "medium",
      title: `FDA RWE relevance/reliability: ${rwe}`,
      detail: "Device RWE mapping incomplete or insufficient for commercial dossier use.",
      evidenceRecordId: record.id,
    });
  }

  // Stage-gates empty
  if (!fa.commercialStageGates?.length) {
    gaps.push({
      id: `${record.id}-no-stage-gates`,
      category: "stage_gate",
      severity: "medium",
      title: "No commercial stage-gates declared",
      detail: "Record cannot contribute to corridor evidence readiness scores until stage-gates are set.",
      evidenceRecordId: record.id,
    });
  }

  return gaps;
}

export function collectGapsForClaimMap(
  entry: EvidenceClaimMapEntry,
  recordsById: Map<string, EvidenceRecord>,
): GapItem[] {
  const gaps: GapItem[] = [];

  if (entry.status === "gap") {
    gaps.push({
      id: `${entry.id}-status-gap`,
      category: "claim_map",
      severity: "critical",
      title: `Claim map gap: ${entry.claimStatement.slice(0, 80)}…`,
      detail: entry.gapSummary ?? "No supporting evidence linked.",
      claimMapId: entry.id,
      recommendedAction: "Commission primary evidence or narrow claim.",
    });
  } else if (entry.status === "partial") {
    gaps.push({
      id: `${entry.id}-status-partial`,
      category: "claim_map",
      severity: "high",
      title: `Partial claim support: ${entry.condition}`,
      detail: entry.gapSummary ?? "Supporting evidence incomplete for target stage-gates.",
      claimMapId: entry.id,
    });
  }

  for (const eid of entry.evidenceRecordIds) {
    const rec = recordsById.get(eid);
    if (!rec) {
      gaps.push({
        id: `${entry.id}-missing-${eid}`,
        category: "claim_map",
        severity: "critical",
        title: `Linked evidence missing: ${eid}`,
        detail: "Claim map references an evidence ID not present in fixtures/spine.",
        claimMapId: entry.id,
        evidenceRecordId: eid,
      });
      continue;
    }
    gaps.push(...collectGapsForRecord(rec));
  }

  return gaps;
}

export function triageSort(gaps: GapItem[]): GapItem[] {
  return [...gaps].sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    return a.title.localeCompare(b.title);
  });
}

export function summariseGaps(gaps: GapItem[]): {
  total: number;
  bySeverity: Record<GapSeverity, number>;
  byCategory: Record<string, number>;
  topCritical: GapItem[];
} {
  const bySeverity: Record<GapSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  const byCategory: Record<string, number> = {};
  for (const g of gaps) {
    bySeverity[g.severity] += 1;
    byCategory[g.category] = (byCategory[g.category] ?? 0) + 1;
  }
  const sorted = triageSort(gaps);
  return {
    total: gaps.length,
    bySeverity,
    byCategory,
    topCritical: sorted.filter((g) => g.severity === "critical" || g.severity === "high").slice(0, 10),
  };
}

export function alignmentQuickScore(fa: FrameworkAlignment | undefined): number {
  if (!fa) return 0;
  let score = 0;
  if (fa.imdrfPillars?.length) score += Math.min(30, fa.imdrfPillars.length * 10);
  if (fa.dtaDomains?.includes("clinical_evidence")) score += 20;
  if (fa.commercialStageGates?.length) score += Math.min(20, fa.commercialStageGates.length * 5);
  if (fa.alcoaPlus?.length) score += Math.min(20, fa.alcoaPlus.length * 2);
  const rwe = fa.fdaRweRelevanceReliability;
  if (rwe === "relevant_reliable") score += 10;
  else if (rwe === "relevant_limited") score += 5;
  return Math.min(100, score);
}

export type { FrameworkAlignment, CommercialStageGate, RelevanceReliabilityStatus };
