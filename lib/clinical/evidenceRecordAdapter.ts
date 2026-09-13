/**
 * Adapts the real clinical evidence API's DTO shape
 * (ClinicalEvidenceRecordDTO, from lib/clinical/evidence.ts / the
 * /api/clinical/evidence route) into the EvidenceRecord shape that
 * lib/clinical/evidence-readiness.ts's scoring functions expect.
 *
 * That scoring code predates the real evidence API and was built against
 * the EvidenceRecord fixture type, which has a couple of fields
 * (frameworkAlignment, keyFindings, limitations) the real schema doesn't
 * carry. Left undefined/empty below rather than invented -- the scoring
 * functions already treat their absence as "no bonus, not a fabrication."
 */
import type { ClinicalEvidenceRecordDTO } from "@/lib/clinical/evidence";
import type { EvidenceRecord, EvidenceDomain, EvidenceStrength, Population } from "@/lib/clinical/types";

const EVIDENCE_TYPE_TO_DOMAIN: Record<string, EvidenceDomain> = {
  "randomized-trial": "efficacy",
  "systematic-review": "efficacy",
  "meta-analysis": "efficacy",
  "observational-study": "efficacy",
  "pharmacovigilance-signal": "safety",
  "clinical-guideline": "guidelines",
  "regulatory-guidance": "guidelines",
  regulation: "guidelines",
  "product-monograph": "formulations",
};

const STRENGTH_MAP: Record<string, EvidenceStrength> = {
  high: "high",
  moderate: "moderate",
  low: "low",
  "very-low": "very_low",
  ungraded: "insufficient",
  conflicted: "insufficient",
};

function parsePopulation(raw: string | null): Population[] {
  if (!raw) return ["general"];
  const known: Population[] = [
    "adult", "elderly", "paediatric", "pregnancy",
    "hepatic_impairment", "renal_impairment", "general",
  ];
  const lower = raw.toLowerCase();
  const found = known.filter((p) => lower.includes(p.replace("_", " ")) || lower.includes(p));
  return found.length ? found : ["general"];
}

export function adaptEvidenceDto(dto: ClinicalEvidenceRecordDTO): EvidenceRecord {
  return {
    id: dto.id,
    title: dto.title,
    domain: EVIDENCE_TYPE_TO_DOMAIN[dto.evidenceType] ?? "practice",
    condition: dto.condition ?? "",
    cannabinoidFocus: dto.cannabinoid ?? [],
    population: parsePopulation(dto.population),
    strength: STRENGTH_MAP[dto.evidenceStrength] ?? "insufficient",
    summary: dto.summary,
    keyFindings: [],
    limitations: [],
    sourceCitation: [dto.primarySource.title, dto.primarySource.publisher].filter(Boolean).join(" — "),
    sourceUrl: dto.primarySource.url || undefined,
    sourceDate: dto.publicationDate ?? "",
    reviewedAt: dto.verifiedAt,
    jurisdictions: dto.jurisdiction.length ? dto.jurisdiction : ["global"],
    frameworkAlignment: undefined,
  };
}
