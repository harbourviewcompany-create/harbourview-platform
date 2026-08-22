/**
 * Harbourview Clinical — Evidence fixtures
 * Graded, reviewed records. Expand over time from primary sources.
 * Boundaries: not patient-specific advice; always show strength + limitations.
 *
 * frameworkAlignment is optional (Phase A). Absence means not yet mapped to the
 * commercial evidence strategy frameworks.
 */

import type { EvidenceRecord } from "@/lib/clinical/types";

export const EVIDENCE_FIXTURES: EvidenceRecord[] = [
  {
    id: "ev-dravet-cbd",
    title: "Purified CBD adjunctive therapy in Dravet syndrome — graded snapshot",
    domain: "efficacy",
    condition: "Dravet syndrome",
    cannabinoidFocus: ["CBD"],
    route: "oral",
    population: ["paediatric", "adult"],
    strength: "high",
    summary:
      "High-certainty trial evidence supports pharmaceutical purified CBD as adjunctive therapy reducing convulsive seizure frequency in Dravet syndrome versus placebo. Monitor sedation and clobazam interaction.",
    keyFindings: [
      "Significant reduction in convulsive seizures vs placebo in pivotal trials",
      "Somnolence, decreased appetite and diarrhoea are common",
      "Clobazam interaction is clinically relevant",
    ],
    limitations: [
      "Most robust data are for purified CBD, not broad-spectrum extracts",
      "Long-term developmental outcomes still accumulating",
    ],
    sourceCitation: "Pivotal RCTs and regulatory assessments",
    sourceDate: "2017-05-01",
    reviewedAt: "2026-08-15",
    jurisdictions: ["global", "US", "CA", "GB", "BR", "AU"],
    frameworkAlignment: {
      imdrfPillars: {
        valid_clinical_association: {
          status: "covered",
          notes: "Established association between purified CBD and convulsive seizure reduction in Dravet; supported by pivotal programmes and labels.",
        },
        analytical_validation: {
          status: "partial",
          notes: "Pharmaceutical product manufacturing and assay controls apply; not a software/algorithm validation context.",
        },
        clinical_validation: {
          status: "covered",
          notes: "Pivotal RCTs demonstrated clinically meaningful reduction in convulsive seizure frequency vs placebo in target population.",
        },
      },
      dtaDomains: [
        {
          domain: "safety",
          ecosystem: "regulatory",
          status: "covered",
          notes: "Labelled AEs and monitoring (sedation, clobazam interaction) well characterised.",
        },
        {
          domain: "benefit",
          ecosystem: "regulatory",
          status: "covered",
          notes: "Efficacy on convulsive seizure frequency established in pivotal trials.",
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
          notes: "Oral pharmaceutical formulation; access depends on jurisdiction and product authorisation.",
        },
        {
          domain: "user_engagement",
          ecosystem: "payment",
          status: "missing",
          notes: "Not a digital therapeutic; engagement metrics not applicable in the DTx sense.",
        },
      ],
      dtxRwePhase: "monitor",
      relevanceReliability: {
        availability: "strong",
        generalizability: "adequate",
        accuracy: "strong",
        completeness: "adequate",
        provenance: "strong",
        overallNotes:
          "Evidence package rests on pivotal RCTs and regulatory assessments with clear provenance to primary sources.",
      },
      alcoaPlusComplete: true,
      commercialStageGate: "scale",
      commercialPriority: "high",
    },
  },
  {
    id: "ev-lgs-cbd",
    title: "Purified CBD adjunctive therapy in Lennox-Gastaut syndrome — graded snapshot",
    domain: "efficacy",
    condition: "Lennox-Gastaut syndrome",
    cannabinoidFocus: ["CBD"],
    route: "oral",
    population: ["paediatric", "adult"],
    strength: "high",
    summary:
      "High-certainty evidence supports pharmaceutical purified CBD as adjunctive therapy reducing drop seizures in Lennox-Gastaut syndrome versus placebo. Monitor LFTs especially with valproate.",
    keyFindings: [
      "Drop-seizure reduction vs placebo in pivotal programmes",
      "Hepatic enzyme elevation risk higher with valproate",
    ],
    limitations: ["Do not extrapolate freely to non-purified cannabis extracts"],
    sourceCitation: "Pivotal RCTs and regulatory assessments",
    sourceDate: "2018-01-01",
    reviewedAt: "2026-08-15",
    jurisdictions: ["global", "US", "CA", "GB", "BR", "AU"],
  },
  {
    id: "ev-ms-spasticity",
    title: "Nabiximols-class THC:CBD for MS spasticity — graded snapshot",
    domain: "efficacy",
    condition: "multiple sclerosis spasticity",
    cannabinoidFocus: ["THC", "CBD"],
    route: "oromucosal",
    population: ["adult"],
    strength: "moderate",
    summary:
      "Moderate evidence supports oromucosal THC:CBD for symptomatic improvement of moderate-to-severe MS spasticity after inadequate response to other agents.",
    keyFindings: [
      "NRS spasticity improvement in responder populations",
      "Dizziness and fatigue common",
    ],
    limitations: ["Not first-line; enrichment designs limit generalisability"],
    sourceCitation: "Nabiximols MS trials and product assessments",
    sourceDate: "2011-01-01",
    reviewedAt: "2026-08-15",
    jurisdictions: ["global", "CA", "GB", "EU", "AU"],
  },
  {
    id: "ev-cinv-thc",
    title: "THC / nabilone-class agents for chemotherapy-induced nausea — graded snapshot",
    domain: "efficacy",
    condition: "chemotherapy-induced nausea and vomiting",
    cannabinoidFocus: ["THC"],
    route: "oral",
    population: ["adult"],
    strength: "moderate",
    summary:
      "Moderate evidence supports certain THC or analogues for refractory CINV in selected contexts; psychoactive effects limit use versus modern antiemetic regimens.",
    keyFindings: ["Benefit mainly in refractory settings", "CNS and cardiovascular AEs relevant"],
    limitations: ["Comparative relevance vs current multi-agent antiemetics is limited"],
    sourceCitation: "CINV cannabinoid systematic reviews",
    sourceDate: "2020-01-01",
    reviewedAt: "2026-08-10",
    jurisdictions: ["global", "US", "CA", "GB"],
  },
  {
    id: "ev-neuropathic-pain",
    title: "Cannabinoids for chronic neuropathic pain — graded snapshot",
    domain: "efficacy",
    condition: "chronic neuropathic pain",
    cannabinoidFocus: ["THC", "CBD", "THC:CBD combinations"],
    route: "oral / oromucosal",
    population: ["adult"],
    strength: "low",
    summary:
      "Low-to-moderate evidence suggests small average reductions in neuropathic pain intensity with some THC-containing products versus placebo, with higher adverse-event rates.",
    keyFindings: [
      "Small average pain reductions in some meta-analyses",
      "AE-related withdrawal not uncommon",
    ],
    limitations: ["Heterogeneous products; uncertain long-term functional benefit"],
    sourceCitation: "Neuropathic pain cannabinoid systematic reviews",
    sourceDate: "2023-01-01",
    reviewedAt: "2026-08-10",
    jurisdictions: ["global", "CA", "AU", "GB", "DE", "BR"],
  },
  {
    id: "ev-cbd-hepatic",
    title: "CBD and hepatic enzyme elevation — safety graded snapshot",
    domain: "safety",
    condition: "hepatic safety with CBD",
    cannabinoidFocus: ["CBD"],
    route: "oral",
    population: ["paediatric", "adult"],
    strength: "moderate",
    summary:
      "Moderate evidence from pharmaceutical CBD programmes shows dose-related transaminase elevations, especially with concomitant valproate.",
    keyFindings: ["Dose-related ALT/AST rises", "Higher risk with valproate"],
    limitations: ["Non-pharmaceutical CBD risk less precisely quantified"],
    sourceCitation: "CBD labels and safety analyses",
    sourceDate: "2020-01-01",
    reviewedAt: "2026-08-15",
    jurisdictions: ["global", "US", "CA", "GB", "BR", "AU"],
  },
  {
    id: "ev-br-pain-001",
    title: "Cannabinoids for chronic neuropathic pain — overview of controlled evidence",
    domain: "efficacy",
    condition: "chronic neuropathic pain",
    cannabinoidFocus: ["THC", "CBD", "THC:CBD combinations"],
    route: "oral / oromucosal",
    population: ["adult"],
    strength: "moderate",
    summary:
      "Multiple RCTs and systematic reviews support a modest analgesic effect of THC-containing products in neuropathic pain, with higher rates of adverse events than placebo.",
    keyFindings: [
      "Small-to-moderate pain intensity reductions in several trials",
      "Sedation and dizziness are common dose-limiting factors",
    ],
    limitations: [
      "Heterogeneous formulations limit generalisability",
      "Long-term comparative effectiveness remains limited",
    ],
    sourceCitation: "Systematic reviews of RCTs (2018–2025)",
    sourceDate: "2025-11-01",
    reviewedAt: "2026-07-15",
    jurisdictions: ["BR", "global"],
    applicabilityNotes:
      "Confirm authorised products under ANVISA before applying findings to Brazilian practice.",
  },
  {
    id: "ev-br-epilepsy-001",
    title: "CBD in treatment-resistant epilepsy (Dravet / Lennox-Gastaut context)",
    domain: "efficacy",
    condition: "treatment-resistant epilepsy",
    cannabinoidFocus: ["CBD"],
    route: "oral",
    population: ["paediatric", "adult"],
    strength: "high",
    summary:
      "High-quality evidence supports purified CBD as adjunctive therapy for seizures in Dravet and Lennox-Gastaut syndromes. Evidence for other syndromes and non-purified extracts is weaker.",
    keyFindings: [
      "Seizure frequency reduction vs placebo in pivotal trials",
      "Drug–drug interactions (notably clobazam) require monitoring",
    ],
    limitations: ["Most robust data are for purified pharmaceutical CBD"],
    sourceCitation: "Pivotal RCTs and regulatory assessments",
    sourceDate: "2024-06-01",
    reviewedAt: "2026-06-20",
    jurisdictions: ["BR", "global"],
  },
  {
    id: "ev-safety-001",
    title: "Common adverse effects and monitoring considerations",
    domain: "safety",
    condition: "general medical cannabis use",
    cannabinoidFocus: ["THC", "CBD"],
    population: ["adult", "elderly"],
    strength: "moderate",
    summary:
      "THC-related psychoactive and cardiovascular effects and CBD-related somnolence, GI effects and potential hepatic enzyme elevation dominate safety themes.",
    keyFindings: [
      "Start low, go slow remains practical consensus",
      "Driving and occupational impairment matter",
    ],
    limitations: ["Real-world reporting incomplete; product variability high"],
    sourceCitation: "Guideline consensus and pharmacovigilance summaries",
    sourceDate: "2025-09-01",
    reviewedAt: "2026-07-01",
    jurisdictions: ["global"],
  },
  {
    id: "ev-interactions-001",
    title: "Cannabinoid–drug interaction overview (CYP focus)",
    domain: "interactions",
    condition: "polypharmacy / concomitant medication",
    cannabinoidFocus: ["CBD", "THC"],
    population: ["adult", "elderly"],
    strength: "moderate",
    summary:
      "CBD is a more significant CYP inhibitor (notably CYP3A4, CYP2C19, CYP2C9) than THC in most clinical contexts. Clinically relevant interactions include clobazam and some narrow-therapeutic-index drugs.",
    keyFindings: [
      "Monitor when adding CBD to clobazam or sensitive CYP substrates",
      "THC adds caution with CNS depressants",
    ],
    limitations: ["Much data are PK, in-vitro or case-based"],
    sourceCitation: "Pharmacokinetic studies and interaction databases",
    sourceDate: "2025-08-01",
    reviewedAt: "2026-06-15",
    jurisdictions: ["global"],
  },
  {
    id: "ev-sleep-001",
    title: "Cannabinoids for insomnia / sleep disturbance — graded snapshot",
    domain: "efficacy",
    condition: "insomnia / sleep disturbance",
    cannabinoidFocus: ["THC", "CBD"],
    route: "oral / inhaled",
    population: ["adult"],
    strength: "very_low",
    summary:
      "Evidence for durable insomnia benefit is limited and mixed; short-term sedation may occur.",
    keyFindings: ["Short-term sedation possible", "Durable benefit uncertain"],
    limitations: ["Few high-quality insomnia-primary RCTs"],
    sourceCitation: "Sleep and cannabinoid systematic reviews",
    sourceDate: "2024-01-01",
    reviewedAt: "2026-08-01",
    jurisdictions: ["global", "CA", "AU", "US"],
  },
  {
    id: "ev-anxiety-cbd",
    title: "CBD for anxiety symptoms — graded snapshot",
    domain: "efficacy",
    condition: "anxiety symptoms",
    cannabinoidFocus: ["CBD"],
    route: "oral",
    population: ["adult"],
    strength: "low",
    summary:
      "Evidence that CBD reduces anxiety is limited; certainty is low and product/dose standards vary. THC may worsen anxiety.",
    keyFindings: ["Some experimental and small clinical signals", "Not a substitute for standard anxiety care"],
    limitations: ["Heterogeneous products and methods"],
    sourceCitation: "CBD anxiety evidence reviews",
    sourceDate: "2024-06-01",
    reviewedAt: "2026-08-01",
    jurisdictions: ["global", "CA", "AU", "GB", "BR"],
  },
];

/** Simple search helper for fixtures (replace with real query later) */
export function searchEvidence(
  query: string,
  opts?: { domain?: string; jurisdiction?: string }
): EvidenceRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return EVIDENCE_FIXTURES.filter((r) => {
    const matchesQuery =
      r.title.toLowerCase().includes(q) ||
      r.condition.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      r.cannabinoidFocus.some((c) => c.toLowerCase().includes(q));

    const matchesDomain = !opts?.domain || r.domain === opts.domain;
    const matchesJuris =
      !opts?.jurisdiction ||
      r.jurisdictions.includes("global") ||
      r.jurisdictions.includes(opts.jurisdiction);

    return matchesQuery && matchesDomain && matchesJuris;
  });
}
