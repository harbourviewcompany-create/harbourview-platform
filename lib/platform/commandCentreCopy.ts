/**
 * Canonical customer-facing Command Centre control copy.
 * Controlling document: docs/control/PRODUCTION_COMMAND_CENTRE_ARCHITECTURE.md
 */
export const COMMAND_CENTRE_COPY = {
  dataBoundary: {
    live: 'All requested Command Centre sources loaded successfully.',
    partial: 'Some requested sources are temporarily degraded. Available verified data remains accessible.',
    fallback: 'A controlled fallback is being shown while a requested live source is unavailable.',
    empty: 'No records match the current jurisdiction and role context.',
    error: 'Requested Command Centre data is temporarily unavailable. Retry without changing submitted information.',
    stale: 'Some requested records are older than their configured freshness window and are labelled accordingly.',
  },
  errorBoundary: {
    eyebrow: 'Harbourview Command Centre',
    title: 'The command surface could not finish loading',
    detail: 'The platform stopped before presenting incomplete or unreliable operating information. Retry the request. If the issue persists, the failure digest can be used for controlled support review.',
    retry: 'Retry command centre',
  },
  mobile: {
    marketplaceDescription: 'Review approved records, search the active category, post demand and move qualified opportunities into controlled Harbourview workflows.',
    marketplaceEmptyDetail: 'The category remains available. Adjust the search or post a wanted requirement for Harbourview review.',
    listingFallback: 'Commercial detail is available through a controlled Harbourview workflow.',
    listingChannel: 'Harbourview mediated',
    reviewedIntroduction: 'Request reviewed introduction',
    supplyReview: 'Start controlled supply review',
    supplyDescription: 'The complete loaded supply universe remains visible across cannabis, equipment, consumables, services and new products.',
    searchDescription: 'Search covers only record types already loaded into the authenticated Command Centre session; existing authorization and access boundaries remain unchanged.',
    supplyEmptyDetail: 'Post a supply submission or wanted requirement for Harbourview review.',
    wantedIntakeDescription: 'Create a buyer-led requirement without leaving Mobile Command. The submission remains review-gated before publication or counterparty routing.',
    supplyIntakeDescription: 'Add product, equipment, consumable, service or opportunity supply directly inside Mobile Command.',
    introductionDescription: 'Harbourview reviews authorization, evidence, commercial fit and disclosure boundaries before any counterparty introduction.',
    financingInquiryDescription: 'Complete the reviewed financing inquiry without leaving Mobile Command. This creates an inquiry only; it does not approve credit.',
    transactionPipeline: 'Harbourview remains the mediated layer between demand, proof review, qualified matches and controlled deal-room access.',
    reviewDescription: 'Commercial visibility, introductions and sensitive detail remain controlled by evidence, authorization and operator review.',
    evidenceDocumentsTitle: 'Organization evidence documents',
    evidenceDocumentsEmpty: 'No evidence documents recorded',
    evidenceDocumentsEmptyDetail: 'Licences, certificates of analysis, insurance and registration records appear here once submitted and accepted through controlled review. Nothing has been recorded for this organization yet.',
    controlTitle: 'Controlled by default',
    controlDetail: 'No supplier identity, private source evidence, internal review notes or counterparty detail is released from this mobile surface.',
    directoryDescription: 'Directory records remain evidence-aware and mediated rather than exposing an open supplier or counterparty directory.',
    directoryEmptyDetail: 'Professionals, providers and operators appear only after projection and review requirements are satisfied.',
    talentDescription: 'Talent opportunities remain separated from counterparty records and are filtered to the active jurisdiction or role where possible.',
    talentEmptyDetail: 'The talent section remains active and populates only from the approved jobs dataset.',
    geneticsDescription: 'Reviewed cultivar passports and genetics records remain tied to evidence and controlled requests.',
    geneticsEmptyDetail: 'Genetics remains available through controlled program and evidence requests.',
    clinicalDescription: 'Country-specific patient, prescriber and pharmacy context is kept separate from commercial claims.',
    clinicalPatientFallback: 'Patient-access detail is available when supported by reviewed jurisdiction evidence.',
    clinicalProfessionalFallback: 'Prescribing, dispensing and professional obligations remain jurisdiction-specific and evidence-gated.',
    complianceDescription: 'Import/export, licensing, quality and evidence requirements are consolidated for the active market-role combination.',
    complianceOutlookFallback: 'Regulatory outlook requires reviewed source support.',
    compliancePathwayFallback: 'Licence, permit, customs and quality gates remain jurisdiction-specific.',
    // `jurisdiction_playbooks.confidence_label` is sourcing prose (averaging ~310
    // characters), not a badge — it records how the playbook was corroborated.
    playbookSourcingTitle: 'Playbook sourcing',
    playbookSourcingAbsent: 'No sourcing note has been recorded for this jurisdiction playbook. The note states how the guidance was corroborated and is written during playbook review.',
    networkDescription: 'Professionals, service providers, licensed operators and collaboration projects remain available through controlled Harbourview access paths.',
    financingDescription: 'Financing is reviewed alongside jurisdiction, evidence, counterparty and transaction readiness—not as an instant checkout product.',
    jurisdictionDescription: 'Country status, regulator, access posture and commercial pathway remain tied to the selected role.',
    jurisdictionFallback: 'Regulatory and commercial pathway detail remains subject to controlled evidence review.',
    pathwayStepsTitle: 'Access pathway',
    pathwayCuratedNote: 'Country-specific pathway, authored for this jurisdiction and role against reviewed sources.',
    // cc_pathway_templates holds hand-authored country pathways for 34 of 203
    // countries. Everywhere else getPublicPathwayTemplate substitutes a generic
    // role pathway, which must be labelled as such rather than presented as
    // jurisdiction-specific guidance.
    pathwayGenericNote: 'Generic role pathway. No country-specific pathway has been authored for this jurisdiction and role, so the steps below are role-level and name no local authority.',
    pathwayEmpty: 'No access pathway is available for this context',
    pathwayEmptyDetail: 'A pathway is produced from a jurisdiction and role together. Select a role to load one, or await a reviewed pathway for this jurisdiction.',
    financingWorkflowEyebrow: 'Trade finance command / structured inquiry',
    financingWorkflowTitle: 'Request financing support',
    marketplaceWorkflowClose: 'Close marketplace workflow',
    financingWorkflowClose: 'Close financing workflow',
  },
} as const

export const MOBILE_COMMAND_COPY = COMMAND_CENTRE_COPY.mobile
