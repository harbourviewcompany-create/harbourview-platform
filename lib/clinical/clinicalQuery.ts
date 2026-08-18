/**
 * Harbourview Clinical — query helpers
 * Fixture-backed for now. Replace bodies with Supabase / real sources later.
 * Keep the same function signatures so the UI does not need to change.
 */

import type {
  EvidenceRecord,
  JurisdictionBriefing,
  ProfessionalPathway,
  WhatChangedEvent,
  ClinicalAttentionItem,
  ClinicalNextAction,
} from "./types";
import { EVIDENCE_FIXTURES, searchEvidence } from "@/lib/fixtures/clinical/evidence";
import {
  JURISDICTION_BRIEFINGS,
  PROFESSIONAL_PATHWAYS,
  WHAT_CHANGED,
  getAttentionItems,
  getNextActions,
} from "@/lib/fixtures/clinical/jurisdictions";

export async function getJurisdictionBriefing(
  iso2: string
): Promise<JurisdictionBriefing | null> {
  return JURISDICTION_BRIEFINGS[iso2.toUpperCase()] ?? null;
}

export async function getProfessionalPathway(
  iso2: string
): Promise<ProfessionalPathway | null> {
  return PROFESSIONAL_PATHWAYS[iso2.toUpperCase()] ?? null;
}

export async function getEvidenceRecords(opts: {
  query?: string;
  domain?: string;
  jurisdiction?: string;
  limit?: number;
}): Promise<EvidenceRecord[]> {
  const { query = "", domain, jurisdiction, limit = 50 } = opts;

  if (query.trim()) {
    return searchEvidence(query, { domain, jurisdiction }).slice(0, limit);
  }

  // No query → return jurisdiction-relevant or global records
  let results = EVIDENCE_FIXTURES;
  if (jurisdiction) {
    results = results.filter(
      (r) =>
        r.jurisdictions.includes("global") ||
        r.jurisdictions.includes(jurisdiction.toUpperCase())
    );
  }
  if (domain) {
    results = results.filter((r) => r.domain === domain);
  }
  return results.slice(0, limit);
}

export async function getWhatChanged(
  iso2: string
): Promise<WhatChangedEvent[]> {
  return WHAT_CHANGED.filter((e) => e.country === iso2.toUpperCase());
}

export async function getClinicalAttention(
  iso2: string
): Promise<ClinicalAttentionItem[]> {
  return getAttentionItems(iso2.toUpperCase());
}

export async function getClinicalNextActions(
  iso2: string
): Promise<ClinicalNextAction[]> {
  return getNextActions(iso2.toUpperCase());
}

/** Convenience loader for the full Clinical page */
export async function loadClinicalPageData(iso2: string, roleLabel = "All roles") {
  const [
    briefing,
    pathway,
    evidence,
    whatChanged,
    attention,
    nextActions,
  ] = await Promise.all([
    getJurisdictionBriefing(iso2),
    getProfessionalPathway(iso2),
    getEvidenceRecords({ jurisdiction: iso2 }),
    getWhatChanged(iso2),
    getClinicalAttention(iso2),
    getClinicalNextActions(iso2),
  ]);

  return {
    iso2: iso2.toUpperCase(),
    roleLabel,
    briefing,
    pathway,
    evidence,
    whatChanged,
    attention,
    nextActions,
  };
}

/** Formulary — fixture-backed; migrate reads to clinical_formulary_products when live. */
export async function getFormularyProducts(iso2: string, q?: string) {
  const { searchFormulary } = await import("@/lib/fixtures/clinical/formulary");
  return searchFormulary({ countryIso2: iso2, q });
}
