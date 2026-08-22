/**
 * Lightweight frameworkAlignment lookup for client surfaces.
 * Avoids pulling full evidence fixture narratives into Command bundles.
 */
import type { FrameworkAlignment } from "@/lib/clinical/types";

export type AlignmentIndexEntry = {
  id: string;
  condition: string;
  alignment: FrameworkAlignment;
};

/** High-traffic annotated records only */
export const FRAMEWORK_ALIGNMENT_INDEX: AlignmentIndexEntry[] = [
  {
    id: "ev-dravet-cbd",
    condition: "Dravet syndrome",
    alignment: {
      imdrfPillars: ["clinical_association", "clinical_validation"],
      dtaDomains: ["clinical_evidence"],
      dtaEcosystem: "evidence_generation",
      dtxRwePhases: ["confirmatory", "lifecycle"],
      commercialStageGates: ["label_support", "payer_dossier", "scale_corridor"],
      fdaRweRelevance: "relevant_reliable",
      fdaRweReliability: "relevant_reliable",
      alcoaPlus: {
        attributable: true,
        legible: true,
        contemporaneous: true,
        original: true,
        accurate: true,
        complete: true,
        consistent: true,
        enduring: true,
        available: true,
      },
    },
  },
  {
    id: "ev-lgs-cbd",
    condition: "Lennox-Gastaut syndrome",
    alignment: {
      imdrfPillars: ["clinical_association", "clinical_validation"],
      dtaDomains: ["clinical_evidence"],
      dtaEcosystem: "evidence_generation",
      dtxRwePhases: ["confirmatory", "lifecycle"],
      commercialStageGates: ["label_support", "payer_dossier", "scale_corridor"],
      fdaRweRelevance: "relevant_reliable",
      fdaRweReliability: "relevant_reliable",
      alcoaPlus: {
        attributable: true,
        legible: true,
        contemporaneous: true,
        original: true,
        accurate: true,
        complete: true,
        consistent: true,
        enduring: true,
        available: true,
      },
    },
  },
  {
    id: "ev-ms-spasticity",
    condition: "multiple sclerosis spasticity",
    alignment: {
      imdrfPillars: ["clinical_association", "clinical_validation"],
      dtaDomains: ["clinical_evidence"],
      dtaEcosystem: "evidence_generation",
      dtxRwePhases: ["exploratory", "lifecycle"],
      commercialStageGates: ["scale_corridor", "payer_dossier", "post_market_rwe"],
      fdaRweRelevance: "relevant_limited",
      fdaRweReliability: "relevant_limited",
      alcoaPlus: {
        attributable: true,
        legible: true,
        contemporaneous: false,
        original: true,
        accurate: true,
        complete: true,
        consistent: true,
        enduring: true,
        available: true,
      },
    },
  },
  {
    id: "ev-neuropathic-pain",
    condition: "chronic neuropathic pain",
    alignment: {
      imdrfPillars: ["clinical_association"],
      dtaDomains: ["clinical_evidence"],
      dtaEcosystem: "evidence_generation",
      dtxRwePhases: ["exploratory"],
      commercialStageGates: ["pre_clinical_ref", "pilot_corridor"],
      fdaRweRelevance: "relevant_limited",
      fdaRweReliability: "insufficient",
      alcoaPlus: {
        attributable: true,
        legible: true,
        contemporaneous: false,
        original: true,
        accurate: true,
        complete: false,
        consistent: true,
        enduring: true,
        available: true,
      },
    },
  },
];

export function findAlignmentForCondition(condition: string | null | undefined) {
  if (!condition) return null;
  const q = condition.trim().toLowerCase();
  if (!q) return null;
  return (
    FRAMEWORK_ALIGNMENT_INDEX.find(
      (e) => e.condition.toLowerCase() === q || q.includes(e.condition.toLowerCase()) || e.condition.toLowerCase().includes(q),
    ) ?? null
  );
}
