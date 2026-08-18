/**
 * Harbourview Clinical — Evidence fixtures
 * Graded, reviewed records. Expand over time from primary sources.
 * Boundaries: not patient-specific advice; always show strength + limitations.
 */

import type { EvidenceRecord } from "@/lib/clinical/types";

export const EVIDENCE_FIXTURES: EvidenceRecord[] = [
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
      "Multiple RCTs and systematic reviews support a modest analgesic effect of THC-containing products in neuropathic pain, with higher rates of adverse events than placebo. CBD-dominant products have weaker and more heterogeneous evidence.",
    keyFindings: [
      "THC or balanced products show small-to-moderate reductions in pain intensity in several trials",
      "Number needed to treat is relatively high; clinical significance varies by patient",
      "Sedation, dizziness and cognitive effects are common dose-limiting factors",
    ],
    limitations: [
      "Heterogeneous formulations and dosing protocols limit generalisability",
      "Long-term data and comparative effectiveness vs standard care remain limited",
      "Most trials exclude significant psychiatric or substance-use comorbidity",
    ],
    sourceCitation: "Systematic reviews of RCTs (various, 2018–2025); local formulary context applies",
    sourceDate: "2025-11-01",
    reviewedAt: "2026-07-15",
    jurisdictions: ["BR", "global"],
    applicabilityNotes:
      "Confirm authorised products and routes under ANVISA before applying any finding to Brazilian practice.",
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
      "High-quality evidence supports purified CBD (e.g. Epidiolex-class) as adjunctive therapy for seizures in Dravet syndrome and Lennox-Gastaut syndrome. Evidence for other epilepsy syndromes and for non-purified cannabis extracts is weaker.",
    keyFindings: [
      "Significant reduction in seizure frequency vs placebo in pivotal trials",
      "Somnolence, decreased appetite and diarrhoea are the most frequent adverse events",
      "Drug–drug interactions (notably with clobazam) require monitoring",
    ],
    limitations: [
      "Most robust data are for purified CBD pharmaceutical products, not broad-spectrum extracts",
      "Long-term developmental outcomes data still accumulating",
    ],
    sourceCitation: "Pivotal RCTs and regulatory assessments (FDA/EMA/ANVISA-related)",
    sourceDate: "2024-06-01",
    reviewedAt: "2026-06-20",
    jurisdictions: ["BR", "global"],
    applicabilityNotes:
      "In Brazil, only authorised cannabis products may be prescribed; verify current ANVISA list and approved indications.",
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
      "THC-related effects (psychoactivity, sedation, tachycardia, orthostatic hypotension) and CBD-related effects (somnolence, GI disturbance, potential hepatic enzyme elevation) are the dominant safety themes. Elderly and polypharmacy patients require particular caution.",
    keyFindings: [
      "Start low, go slow remains the dominant practical recommendation across guidelines",
      "Cognitive and psychomotor impairment relevant to driving and occupational safety",
      "Potential for CYP-mediated interactions (especially CBD with certain AEDs and other substrates)",
    ],
    limitations: [
      "Real-world adverse event reporting remains incomplete in many jurisdictions",
      "Product variability (especially non-pharmaceutical grade) complicates risk assessment",
    ],
    sourceCitation: "Guideline consensus statements and pharmacovigilance summaries",
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
      "CBD is a more significant CYP inhibitor (notably CYP3A4, CYP2C19, CYP2C9) than THC in most clinical contexts. Clinically relevant interactions have been documented with clobazam, certain anticoagulants, and other narrow-therapeutic-index drugs.",
    keyFindings: [
      "Monitor levels / clinical effect when adding CBD to clobazam or sensitive CYP substrates",
      "THC has fewer documented high-severity interactions but still warrants caution with CNS depressants",
      "Always cross-check current medications against a dedicated interaction resource",
    ],
    limitations: [
      "Most data are from in-vitro, PK studies or case series rather than large RCTs",
      "Product composition and dose strongly influence interaction risk",
    ],
    sourceCitation: "Pharmacokinetic studies and interaction databases (e.g. CANN-DIR class resources)",
    sourceDate: "2025-08-01",
    reviewedAt: "2026-06-15",
    jurisdictions: ["global"],
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
