/**
 * Phase B — gap analysis over FrameworkAlignment / claim map entries.
 * Pure helpers for admin Claim Map + gap dashboard. No clinical inference.
 */

import type {
  EvidenceClaimMapEntry,
  EvidenceRecord,
  FrameworkAlignment,
  FrameworkCoverageStatus,
  ImdrfPillar,
  DtaDomain,
} from "@/lib/clinical/types";

export type GapItem = {
  source: "claim" | "evidence";
  sourceId: string;
  label: string;
  dimension: string;
  status: FrameworkCoverageStatus | "unmapped";
  notes?: string;
  commercialPriority?: "high" | "medium" | "low";
  stageGate?: string;
  gapOwner?: string;
  targetDate?: string;
};

const IMDRF_PILLARS: ImdrfPillar[] = [
  "valid_clinical_association",
  "analytical_validation",
  "clinical_validation",
];

const DTA_DOMAINS: DtaDomain[] = [
  "safety",
  "benefit",
  "durability",
  "usability_accessibility",
  "user_engagement",
];

function collectFromAlignment(
  alignment: FrameworkAlignment | undefined,
  meta: {
    source: "claim" | "evidence";
    sourceId: string;
    label: string;
    gapOwner?: string;
    targetDate?: string;
  }
): GapItem[] {
  const items: GapItem[] = [];
  if (!alignment) {
    items.push({
      ...meta,
      dimension: "frameworkAlignment",
      status: "unmapped",
      notes: "No framework alignment mapped yet.",
    });
    return items;
  }

  for (const pillar of IMDRF_PILLARS) {
    const p = alignment.imdrfPillars?.[pillar];
    const status = p?.status ?? "missing";
    if (status !== "covered") {
      items.push({
        ...meta,
        dimension: `imdrf:${pillar}`,
        status,
        notes: p?.notes,
        commercialPriority: alignment.commercialPriority,
        stageGate: alignment.commercialStageGate,
      });
    }
  }

  const domains = alignment.dtaDomains ?? [];
  for (const domain of DTA_DOMAINS) {
    const matches = domains.filter((d) => d.domain === domain);
    if (matches.length === 0) {
      items.push({
        ...meta,
        dimension: `dta:${domain}`,
        status: "missing",
        notes: "Domain not assessed",
        commercialPriority: alignment.commercialPriority,
        stageGate: alignment.commercialStageGate,
      });
      continue;
    }
    for (const m of matches) {
      if (m.status !== "covered") {
        items.push({
          ...meta,
          dimension: `dta:${domain}/${m.ecosystem}`,
          status: m.status,
          notes: m.notes,
          commercialPriority: alignment.commercialPriority,
          stageGate: alignment.commercialStageGate,
        });
      }
    }
  }

  if (alignment.alcoaPlusComplete === false) {
    items.push({
      ...meta,
      dimension: "alcoaPlus",
      status: "partial",
      notes: "ALCOA+ / provenance incomplete",
      commercialPriority: alignment.commercialPriority,
      stageGate: alignment.commercialStageGate,
    });
  }

  const rr = alignment.relevanceReliability;
  if (rr) {
    const dims: Array<keyof typeof rr> = [
      "availability",
      "generalizability",
      "accuracy",
      "completeness",
      "provenance",
    ];
    for (const d of dims) {
      const v = rr[d];
      if (v === "not_assessed" || v === "partial") {
        items.push({
          ...meta,
          dimension: `fda_rwe:${d}`,
          status: v === "not_assessed" ? "missing" : "partial",
          notes: rr.overallNotes,
          commercialPriority: alignment.commercialPriority,
          stageGate: alignment.commercialStageGate,
        });
      }
    }
  }

  return items;
}

export function gapsFromClaimMap(entries: EvidenceClaimMapEntry[]): GapItem[] {
  return entries.flatMap((e) =>
    collectFromAlignment(e.frameworkAlignment, {
      source: "claim",
      sourceId: e.id,
      label: e.claimStatement.slice(0, 120),
      gapOwner: e.gapOwner,
      targetDate: e.targetDate,
    }).map((g) => ({
      ...g,
      // Claim-level status gap if entry itself is gap/partial
      status:
        e.status === "gap" && g.status === "covered"
          ? g.status
          : g.status,
    }))
  );
}

export function gapsFromEvidenceRecords(records: EvidenceRecord[]): GapItem[] {
  return records.flatMap((r) =>
    collectFromAlignment(r.frameworkAlignment, {
      source: "evidence",
      sourceId: r.id,
      label: r.title,
    })
  );
}

export type GapDashboardSummary = {
  totalGaps: number;
  byStatus: Record<string, number>;
  byDimensionPrefix: Record<string, number>;
  highPriority: number;
  unmappedEvidence: number;
};

export function summariseGaps(items: GapItem[]): GapDashboardSummary {
  const byStatus: Record<string, number> = {};
  const byDimensionPrefix: Record<string, number> = {};
  let highPriority = 0;
  let unmappedEvidence = 0;

  for (const i of items) {
    byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;
    const prefix = i.dimension.split(":")[0] ?? i.dimension;
    byDimensionPrefix[prefix] = (byDimensionPrefix[prefix] ?? 0) + 1;
    if (i.commercialPriority === "high") highPriority += 1;
    if (i.source === "evidence" && i.status === "unmapped") unmappedEvidence += 1;
  }

  return {
    totalGaps: items.length,
    byStatus,
    byDimensionPrefix,
    highPriority,
    unmappedEvidence,
  };
}

/** Rank gaps for operator triage: high priority + missing first */
export function sortGapsForTriage(items: GapItem[]): GapItem[] {
  const statusRank: Record<string, number> = {
    missing: 0,
    unmapped: 1,
    partial: 2,
    covered: 3,
  };
  const priRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return [...items].sort((a, b) => {
    const pa = priRank[a.commercialPriority ?? "low"] ?? 3;
    const pb = priRank[b.commercialPriority ?? "low"] ?? 3;
    if (pa !== pb) return pa - pb;
    const sa = statusRank[a.status] ?? 9;
    const sb = statusRank[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    return a.label.localeCompare(b.label);
  });
}
