/**
 * Harbourview Clinical — Evidence Claim Map fixtures (Phase B)
 * Living claim → framework map for operator / commercial readiness.
 * Not clinician-facing directives; commercial evidence strategy only.
 */

import type { EvidenceClaimMapEntry } from "@/lib/clinical/types";

export const CLAIM_MAP_FIXTURES: EvidenceClaimMapEntry[] = [
  {
    id: "claim-dravet-cbd-efficacy",
    claimStatement:
      "Pharmaceutical purified CBD as adjunctive therapy reduces convulsive seizure frequency in Dravet syndrome versus placebo.",
    claimKind: "efficacy",
    frameworkAlignment: {
      imdrfPillars: {
        valid_clinical_association: {
          status: "covered",
          notes: "Established association supported by pivotal programmes and labels.",
        },
        analytical_validation: {
          status: "partial",
          notes: "Pharmaceutical assay/manufacturing controls; not software validation.",
        },
        clinical_validation: {
          status: "covered",
          notes: "Pivotal RCTs showed clinically meaningful convulsive seizure reduction.",
        },
      },
      dtaDomains: [
        {
          domain: "safety",
          ecosystem: "regulatory",
          status: "covered",
          notes: "Labelled AEs and monitoring characterised.",
        },
        {
          domain: "benefit",
          ecosystem: "regulatory",
          status: "covered",
          notes: "Efficacy on convulsive seizure frequency established.",
        },
        {
          domain: "durability",
          ecosystem: "clinical_acceptance",
          status: "partial",
          notes: "Long-term developmental and durability data still accumulating.",
        },
        {
          domain: "usability_accessibility",
          ecosystem: "clinical_acceptance",
          status: "partial",
          notes: "Access depends on jurisdiction and product authorisation.",
        },
        {
          domain: "user_engagement",
          ecosystem: "payment",
          status: "missing",
          notes: "Not a DTx; engagement metrics N/A.",
        },
      ],
      dtxRwePhase: "monitor",
      relevanceReliability: {
        availability: "strong",
        generalizability: "adequate",
        accuracy: "strong",
        completeness: "adequate",
        provenance: "strong",
        overallNotes: "Pivotal RCTs and regulatory assessments with clear provenance.",
      },
      alcoaPlusComplete: true,
      commercialStageGate: "scale",
      commercialPriority: "high",
    },
    evidenceRecordIds: ["ev-dravet-cbd", "ev-br-epilepsy-001"],
    gapOwner: "clinical-evidence",
    targetDate: "2026-12-31",
    status: "partial",
  },
  {
    id: "claim-neuropathic-pain-modest",
    claimStatement:
      "Some THC-containing products produce small average reductions in chronic neuropathic pain intensity versus placebo, with higher adverse-event rates.",
    claimKind: "efficacy",
    frameworkAlignment: {
      imdrfPillars: {
        valid_clinical_association: {
          status: "partial",
          notes: "Association signalled in meta-analyses; product heterogeneity limits strength.",
        },
        analytical_validation: {
          status: "missing",
          notes: "Heterogeneous non-standardised products dominate evidence base.",
        },
        clinical_validation: {
          status: "partial",
          notes: "Small average effects; functional benefit uncertain.",
        },
      },
      dtaDomains: [
        {
          domain: "safety",
          ecosystem: "regulatory",
          status: "partial",
          notes: "AE-related withdrawal not uncommon; product variability high.",
        },
        {
          domain: "benefit",
          ecosystem: "clinical_acceptance",
          status: "partial",
          notes: "Modest intensity reductions in some analyses.",
        },
        {
          domain: "durability",
          ecosystem: "clinical_acceptance",
          status: "missing",
          notes: "Long-term comparative effectiveness limited.",
        },
      ],
      dtxRwePhase: "test",
      relevanceReliability: {
        availability: "adequate",
        generalizability: "partial",
        accuracy: "partial",
        completeness: "partial",
        provenance: "adequate",
        overallNotes: "Systematic reviews available; formulation heterogeneity weakens reliability.",
      },
      alcoaPlusComplete: false,
      commercialStageGate: "series_a",
      commercialPriority: "medium",
    },
    evidenceRecordIds: ["ev-neuropathic-pain", "ev-br-pain-001"],
    gapOwner: "clinical-evidence",
    targetDate: "2027-06-30",
    status: "gap",
  },
  {
    id: "claim-ms-spasticity-nabiximols",
    claimStatement:
      "Oromucosal THC:CBD can improve moderate-to-severe MS spasticity symptoms after inadequate response to other agents in selected responders.",
    claimKind: "efficacy",
    frameworkAlignment: {
      imdrfPillars: {
        valid_clinical_association: {
          status: "covered",
          notes: "Supported by nabiximols programme and product assessments.",
        },
        analytical_validation: {
          status: "partial",
          notes: "Regulated pharmaceutical product context.",
        },
        clinical_validation: {
          status: "partial",
          notes: "Enrichment designs limit generalisability; not first-line.",
        },
      },
      dtaDomains: [
        {
          domain: "benefit",
          ecosystem: "regulatory",
          status: "partial",
          notes: "NRS improvement in responder populations.",
        },
        {
          domain: "safety",
          ecosystem: "regulatory",
          status: "covered",
          notes: "Dizziness and fatigue common and labelled.",
        },
      ],
      dtxRwePhase: "monitor",
      relevanceReliability: {
        availability: "adequate",
        generalizability: "partial",
        accuracy: "adequate",
        completeness: "adequate",
        provenance: "strong",
      },
      alcoaPlusComplete: true,
      commercialStageGate: "pre_launch",
      commercialPriority: "high",
    },
    evidenceRecordIds: ["ev-ms-spasticity"],
    status: "partial",
  },
];
