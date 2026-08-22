/**
 * Lightweight frameworkAlignment lookup for client surfaces.
 * Avoids pulling full evidence fixture narratives into Command bundles.
 * Shape must match FrameworkAlignment in lib/clinical/types.ts.
 */
import type { FrameworkAlignment } from "@/lib/clinical/types";

export type AlignmentIndexEntry = {
  id: string;
  condition: string;
  alignment: FrameworkAlignment;
};

const ALCOA_FULL = [
  "attributable",
  "legible",
  "contemporaneous",
  "original",
  "accurate",
  "complete",
  "consistent",
  "enduring",
  "available",
] as const;

/** High-traffic annotated records only */
export const FRAMEWORK_ALIGNMENT_INDEX: AlignmentIndexEntry[] = [
  {
    id: "ev-dravet-cbd",
    condition: "Dravet syndrome",
    alignment: {
      imdrfPillars: ["clinical_association", "clinical_validation"],
      dtaDomains: ["clinical_evidence", "product_design"],
      dtaEcosystem: ["clinician_facing", "regulator_facing"],
      dtxRwePhases: ["development", "launch", "post_market"],
      commercialStageGates: ["label_support", "payer_dossier", "scale_corridor"],
      fdaRweRelevanceReliability: "relevant_reliable",
      alcoaPlus: [...ALCOA_FULL],
      operatorNotes: "High-certainty pivotal CBD Dravet programme mapping.",
      frameworkMappedAt: "2026-08-20",
    },
  },
  {
    id: "ev-lgs-cbd",
    condition: "Lennox-Gastaut syndrome",
    alignment: {
      imdrfPillars: ["clinical_association", "clinical_validation"],
      dtaDomains: ["clinical_evidence", "product_design"],
      dtaEcosystem: ["clinician_facing", "regulator_facing"],
      dtxRwePhases: ["development", "launch", "post_market"],
      commercialStageGates: ["label_support", "payer_dossier", "scale_corridor"],
      fdaRweRelevanceReliability: "relevant_reliable",
      alcoaPlus: [...ALCOA_FULL],
      frameworkMappedAt: "2026-08-20",
    },
  },
  {
    id: "ev-ms-spasticity",
    condition: "multiple sclerosis spasticity",
    alignment: {
      imdrfPillars: ["clinical_association", "clinical_validation"],
      dtaDomains: ["clinical_evidence"],
      dtaEcosystem: ["clinician_facing", "payer_facing"],
      dtxRwePhases: ["launch", "post_market", "lifecycle"],
      commercialStageGates: ["scale_corridor", "payer_dossier", "post_market_rwe"],
      fdaRweRelevanceReliability: "relevant_limited",
      alcoaPlus: [
        "attributable",
        "legible",
        "original",
        "accurate",
        "complete",
        "consistent",
        "enduring",
        "available",
      ],
      operatorNotes: "Enrichment designs limit generalisability; not first-line.",
      frameworkMappedAt: "2026-08-20",
    },
  },
  {
    id: "ev-neuropathic-pain",
    condition: "chronic neuropathic pain",
    alignment: {
      imdrfPillars: ["clinical_association"],
      dtaDomains: ["clinical_evidence"],
      dtaEcosystem: ["clinician_facing", "operator_internal"],
      dtxRwePhases: ["discovery", "development"],
      commercialStageGates: ["pre_clinical_ref", "pilot_corridor"],
      fdaRweRelevanceReliability: "relevant_limited",
      alcoaPlus: [
        "attributable",
        "legible",
        "original",
        "accurate",
        "consistent",
        "enduring",
        "available",
      ],
      operatorNotes: "Low certainty; not for label-support without additional primary evidence.",
      frameworkMappedAt: "2026-08-20",
    },
  },
];

export function findAlignmentForCondition(condition: string | null | undefined) {
  if (!condition) return null;
  const q = condition.trim().toLowerCase();
  if (!q) return null;
  return (
    FRAMEWORK_ALIGNMENT_INDEX.find(
      (e) =>
        e.condition.toLowerCase() === q ||
        q.includes(e.condition.toLowerCase()) ||
        e.condition.toLowerCase().includes(q),
    ) ?? null
  );
}
