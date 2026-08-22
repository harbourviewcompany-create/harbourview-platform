/**
 * Harbourview Clinical — core types
 * Evidence Engine + Jurisdiction Briefing + Professional Pathway
 *
 * Framework alignment types (IMDRF / DTA / DTx RWE / FDA RWE) are additive and
 * optional. They support commercial evidence strategy without expanding product
 * scope beyond cannabinoid / medical-cannabis clinical reference.
 */

export type EvidenceStrength = "high" | "moderate" | "low" | "very_low" | "insufficient";

export type EvidenceDomain =
  | "efficacy"
  | "safety"
  | "interactions"
  | "formulations"
  | "guidelines"
  | "practice"
  | "monitoring";

export type Population =
  | "adult"
  | "elderly"
  | "paediatric"
  | "pregnancy"
  | "hepatic_impairment"
  | "renal_impairment"
  | "general";

// ---------------------------------------------------------------------------
// Evidence Framework Spine (Phase A — commercial evidence strategy alignment)
// ---------------------------------------------------------------------------

/** IMDRF SaMD Clinical Evaluation (N41) pillars */
export type ImdrfPillar =
  | "valid_clinical_association"
  | "analytical_validation"
  | "clinical_validation";

/** DTA Clinical Evidence Quality domains */
export type DtaDomain =
  | "safety"
  | "benefit"
  | "durability"
  | "usability_accessibility"
  | "user_engagement";

/** DTA ecosystems against which domains are assessed */
export type DtaEcosystem = "regulatory" | "payment" | "clinical_acceptance";

/** DTx Real-World Evidence Framework phases */
export type DtxRwePhase = "design" | "develop" | "test" | "monitor";

/** Commercial stage-gates for prioritisation */
export type CommercialStageGate =
  | "pre_seed"
  | "series_a"
  | "pivotal"
  | "pre_launch"
  | "scale";

/** FDA 2025 Device RWE relevance/reliability style status */
export type RelevanceReliabilityStatus =
  | "not_assessed"
  | "partial"
  | "adequate"
  | "strong";

export type FrameworkCoverageStatus = "covered" | "partial" | "missing";

export interface FrameworkPillarStatus {
  status: FrameworkCoverageStatus;
  notes?: string;
}

export interface FrameworkDomainStatus {
  domain: DtaDomain;
  ecosystem: DtaEcosystem;
  status: FrameworkCoverageStatus;
  notes?: string;
}

export interface RelevanceReliabilityAssessment {
  availability: RelevanceReliabilityStatus;
  generalizability: RelevanceReliabilityStatus;
  accuracy: RelevanceReliabilityStatus;
  completeness: RelevanceReliabilityStatus;
  provenance: RelevanceReliabilityStatus;
  overallNotes?: string;
}

/**
 * Optional alignment of a clinical evidence record (or claim package) to the
 * commercial evidence strategy frameworks. All fields optional; absence means
 * "not yet mapped". Does not change clinical conclusions or liability posture.
 */
export interface FrameworkAlignment {
  imdrfPillars?: Partial<Record<ImdrfPillar, FrameworkPillarStatus>>;
  dtaDomains?: FrameworkDomainStatus[];
  dtxRwePhase?: DtxRwePhase;
  relevanceReliability?: RelevanceReliabilityAssessment;
  /** Whether ALCOA+ style integrity / provenance is considered complete for this package */
  alcoaPlusComplete?: boolean;
  commercialStageGate?: CommercialStageGate;
  commercialPriority?: "high" | "medium" | "low";
}

/**
 * Living claim → framework map entry (for admin / operator use).
 * Not required on every EvidenceRecord; used when building dossiers.
 */
export interface EvidenceClaimMapEntry {
  id: string;
  claimStatement: string;
  claimKind:
    | "indication"
    | "efficacy"
    | "safety"
    | "durability"
    | "engagement"
    | "usability"
    | "other";
  frameworkAlignment: FrameworkAlignment;
  evidenceRecordIds: string[];
  gapOwner?: string;
  targetDate?: string;
  status: "complete" | "partial" | "gap";
}

export interface EvidenceRecord {
  id: string;
  title: string;
  domain: EvidenceDomain;
  condition: string;
  cannabinoidFocus: string[];
  route?: string;
  population: Population[];
  strength: EvidenceStrength;
  summary: string;
  keyFindings: string[];
  limitations: string[];
  sourceCitation: string;
  sourceUrl?: string;
  sourceDate: string;
  reviewedAt: string;
  jurisdictions: string[];
  applicabilityNotes?: string;
  /** Optional commercial / regulatory framework alignment (Phase A) */
  frameworkAlignment?: FrameworkAlignment;
}

export interface JurisdictionBriefing {
  country: string;
  iso2: string;
  flag: string;
  status: "loaded" | "partial" | "unavailable";
  legalPathway: string;
  adultUse: boolean;
  summary: string;
  primaryAuthority: {
    name: string;
    role: string;
    url?: string;
  };
  professionalRegulator?: {
    name: string;
    role: string;
    url?: string;
  };
  keyRules: string[];
  accessNotes: string;
  lastReviewed: string;
}

export interface ProfessionalPathway {
  country: string;
  iso2: string;
  roles: string;
  whoMayPrescribe: string;
  conditionsMentioned: string[];
  restrictions: string[];
  notes: string;
  lastReviewed: string;
}

export interface WhatChangedEvent {
  id: string;
  country: string;
  title: string;
  summary: string;
  effectiveDate?: string;
  sourceUrl?: string;
  reviewedAt: string;
}

export interface ClinicalAttentionItem {
  id: string;
  title: string;
  body: string;
  severity: "info" | "attention" | "critical";
}

export interface ClinicalNextAction {
  id: string;
  title: string;
  body: string;
  primaryActionLabel: string;
  primaryActionUrl?: string;
}

/**
 * Restricted clinical workflow contracts retained alongside the Evidence Engine.
 * These exports pre-date the Evidence Command rebuild and remain consumed by the
 * authenticated patient, professional, recommendation, calculation and
 * prescription surfaces. They are not public DTOs.
 */
export const CLINICAL_ROLES = [
  'doctor',
  'pharmacist',
  'nurse',
  'nurse_practitioner',
  'other',
] as const

export type ClinicalRole = (typeof CLINICAL_ROLES)[number]

export const APPROPRIATENESS_CLAIMS = [
  'appropriate',
  'appropriate_with_cautions',
  'not_appropriate',
  'insufficient_data',
] as const

export type AppropriatenessClaim = (typeof APPROPRIATENESS_CLAIMS)[number]

export type ClinicalPatient = {
  id: string
  created_at: string
  updated_at: string
  created_by: string
  jurisdiction: string
  status: 'active' | 'inactive' | 'archived'
  given_name: string
  family_name: string
  date_of_birth: string | null
  sex_at_birth: string | null
  external_mrn: string | null
}

export type ClinicalConsent = {
  id: string
  patient_id: string
  recorded_at: string
  recorded_by: string
  jurisdiction: string
  consent_type: string
  lawful_basis: string
  status: 'granted' | 'withdrawn' | 'expired'
  method: string | null
}

export type ClinicalEncounter = {
  id: string
  patient_id: string
  clinician_user_id: string
  started_at: string
  ended_at: string | null
  jurisdiction: string
  encounter_type: string
  status: 'open' | 'closed' | 'cancelled'
  chief_complaint: string | null
  clinical_notes: string | null
}

export type ClinicalCalculation = {
  id: string
  created_at: string
  patient_id: string
  encounter_id: string | null
  clinician_user_id: string
  jurisdiction: string
  calculator_key: string
  algorithm_version: string
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  unit: string | null
  status: string
}

export type ClinicalRecommendation = {
  id: string
  created_at: string
  patient_id: string
  clinician_user_id: string
  jurisdiction: string
  recommendation_key: string
  evidence_version: string
  summary: string
  detail: Record<string, unknown>
  appropriateness_claim: AppropriatenessClaim | null
  appropriateness_rationale: string | null
  status: string
}

export type ClinicalPrescription = {
  id: string
  created_at: string
  patient_id: string
  prescriber_user_id: string
  jurisdiction: string
  product_name: string
  dose_text: string
  quantity: string | null
  directions: string | null
  status: string
  signed_at: string | null
}

export type ClinicalMyProfessional = {
  id: string
  full_name: string
  title: string | null
  credential_type: string | null
  verification_status: string | null
  status: string | null
  licence_number: string | null
  licence_jurisdiction: string | null
  clinical_role: ClinicalRole | null
  user_id: string | null
}

export const CLINICAL_DISCLAIMER =
  'Clinical decision support only. Does not replace professional judgment. ' +
  'Prescribing and treatment remain the responsibility of the licensed clinician. ' +
  'Harbourview is the data controller for clinical records stored on this platform.'
