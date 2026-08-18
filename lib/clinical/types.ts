/**
 * Harbourview Clinical — core types
 * Evidence Engine + Jurisdiction Briefing + Professional Pathway
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

export interface EvidenceRecord {
  id: string;
  title: string;
  domain: EvidenceDomain;
  condition: string; // e.g. "chronic neuropathic pain"
  cannabinoidFocus: string[]; // e.g. ["CBD", "THC:CBD 1:1"]
  route?: string; // oral, oromucosal, inhaled, topical
  population: Population[];
  strength: EvidenceStrength;
  summary: string;
  keyFindings: string[];
  limitations: string[];
  sourceCitation: string;
  sourceUrl?: string;
  sourceDate: string; // ISO date
  reviewedAt: string; // ISO date when Harbourview last reviewed
  jurisdictions: string[]; // ISO2 or "global"
  applicabilityNotes?: string;
}

export interface JurisdictionBriefing {
  country: string;
  iso2: string;
  flag: string;
  status: "loaded" | "partial" | "unavailable";
  legalPathway: string; // short label
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
  roles: string; // e.g. "All roles" or "Physicians only"
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
