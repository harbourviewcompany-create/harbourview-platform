export const EDUCATION_SOURCE_HIERARCHY = [
  { tier: 1, key: 'primary_authority', label: 'Primary law, regulator, health ministry, customs authority, medicines agency, professional college or official standards source' },
  { tier: 2, key: 'official_guidance', label: 'Official implementation guidance, regulator FAQ, official forms, professional guidance or pharmacovigilance material' },
  { tier: 3, key: 'clinical_literature', label: 'Peer-reviewed literature, systematic review, clinical guideline or academic medical reference' },
  { tier: 4, key: 'quality_standard', label: 'Recognized GMP, GACP, GDP, QMS, pharmacopeial, accreditation or standards source' },
  { tier: 5, key: 'industry_context', label: 'Company, industry association, consultant, media or marketplace source for discovery/context only' },
  { tier: 6, key: 'unverified_context', label: 'Aggregator, blog, AI summary or unverified dataset; not publishable for high-risk claims without independent verification' },
] as const

export const EDUCATION_EVIDENCE_GRADE_LABELS = {
  A_primary_binding: 'Binding primary authority',
  B_primary_guidance: 'Official guidance',
  C_professional_guideline: 'Professional or clinical guideline',
  D_peer_reviewed: 'Peer-reviewed scientific evidence',
  E_quality_standard: 'Recognized quality standard',
  F_secondary_context: 'Secondary context only',
  G_discovery_only: 'Discovery only',
  X_conflict_or_unverified: 'Conflict or unverified',
} as const

export const EDUCATION_FRESHNESS_WINDOWS_DAYS = {
  jurisdiction_legal_status: 60,
  import_export_customs_licensing: 30,
  prescribing_dispensing_rules: 90,
  approved_medicines: 90,
  clinical_evidence_summary: 180,
  dosage_reference: 90,
  quality_standards: 180,
  glossary_basic_concepts: 365,
  marketplace_workflow: 30,
  country_page: 60,
} as const
