/**
 * Claim-map fixtures — commercial / clinical claim statements linked to evidence IDs.
 * Additive operator tooling only. Does not alter clinical conclusions or public search.
 * Scope: cannabinoid / medical-cannabis clinical-reference; non-SaMD posture.
 */

import type { EvidenceClaimMapEntry } from "@/lib/clinical/types";

export const CLAIM_MAP_FIXTURES: EvidenceClaimMapEntry[] = [
  {
    id: "claim-dravet-cbd-seizure-reduction",
    claimStatement:
      "Pharmaceutical purified CBD as adjunctive therapy reduces convulsive seizure frequency in Dravet syndrome versus placebo (high-certainty trial evidence).",
    condition: "Dravet syndrome",
    cannabinoidFocus: ["CBD"],
    evidenceRecordIds: ["ev-dravet-cbd"],
    targetStageGates: ["label_support", "payer_dossier", "scale_corridor"],
    targetImdrfPillars: ["clinical_association", "clinical_validation"],
    targetDtaDomains: ["clinical_evidence"],
    status: "supported",
    updatedAt: "2026-08-20",
  },
  {
    id: "claim-lgs-cbd-drop-seizure",
    claimStatement:
      "Pharmaceutical purified CBD as adjunctive therapy reduces drop seizures in Lennox-Gastaut syndrome versus placebo.",
    condition: "Lennox-Gastaut syndrome",
    cannabinoidFocus: ["CBD"],
    evidenceRecordIds: ["ev-lgs-cbd"],
    targetStageGates: ["label_support", "payer_dossier", "scale_corridor"],
    targetImdrfPillars: ["clinical_association", "clinical_validation"],
    targetDtaDomains: ["clinical_evidence"],
    status: "supported",
    updatedAt: "2026-08-20",
  },
  {
    id: "claim-ms-spasticity-nabiximols",
    claimStatement:
      "Oromucosal THC:CBD (nabiximols-class) improves moderate-to-severe MS spasticity after inadequate response to other agents (moderate evidence).",
    condition: "multiple sclerosis spasticity",
    cannabinoidFocus: ["THC", "CBD"],
    evidenceRecordIds: ["ev-ms-spasticity"],
    targetStageGates: ["scale_corridor", "payer_dossier", "post_market_rwe"],
    targetImdrfPillars: ["clinical_association", "clinical_validation"],
    targetDtaDomains: ["clinical_evidence"],
    status: "partial",
    gapSummary:
      "Enrichment designs limit generalisability; not first-line. ALCOA+ contemporaneous dimension incomplete for some secondary sources.",
    updatedAt: "2026-08-20",
  },
  {
    id: "claim-neuropathic-pain-cannabinoids",
    claimStatement:
      "Cannabinoids (THC-containing products) produce small average reductions in chronic neuropathic pain intensity versus placebo.",
    condition: "chronic neuropathic pain",
    cannabinoidFocus: ["THC", "CBD", "THC:CBD combinations"],
    evidenceRecordIds: ["ev-neuropathic-pain"],
    targetStageGates: ["pre_clinical_ref", "pilot_corridor"],
    targetImdrfPillars: ["clinical_association"],
    targetDtaDomains: ["clinical_evidence"],
    status: "partial",
    gapSummary:
      "Low certainty; heterogeneous products; limited functional-outcome data. Not suitable for label-support or payer dossier without additional primary evidence.",
    updatedAt: "2026-08-20",
  },
];

export function getClaimMapByCondition(condition: string): EvidenceClaimMapEntry[] {
  const q = condition.trim().toLowerCase();
  if (!q) return [];
  return CLAIM_MAP_FIXTURES.filter(
    (c) =>
      c.condition.toLowerCase().includes(q) ||
      c.claimStatement.toLowerCase().includes(q),
  );
}

export function getClaimMapByEvidenceId(evidenceId: string): EvidenceClaimMapEntry[] {
  return CLAIM_MAP_FIXTURES.filter((c) => c.evidenceRecordIds.includes(evidenceId));
}
