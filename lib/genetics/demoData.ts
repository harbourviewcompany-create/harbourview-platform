import { toAdminGeneticsReviewDTO, toInternalCultivarPassportDTO, toPublicCultivarPassportDTO } from './dto'
import type {
  CultivarAliasRow,
  CultivarCountryOpportunityRow,
  CultivarPassportRow,
  GeneticsAccessRequestRow,
  GeneticsAuditEventRow,
  GeneticsClaimReviewRow,
  GeneticsCollaborationProjectRow,
  GeneticsEvidenceItemRow,
  GeneticsProfileRow,
  GeneticsServiceProviderRow,
} from './types'

const now = '2026-06-07T00:00:00.000Z'

export const demoGeneticsProfiles: GeneticsProfileRow[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    display_name: 'Demo Rights Holder Profile',
    organization_name: 'Demo Rights Holder Organization',
    primary_role: 'rights_holder',
    country_code: 'CA',
    jurisdiction_label: 'Canada — demo jurisdiction',
    verification_level: 'demo_not_verified',
    public_summary: 'Demo-only rights holder profile for controlled passport workflows. Not a real-world claim.',
    website_url: null,
    contact_visibility: 'request_only',
    owner_user_id: null,
    review_status: 'submitted',
    created_at: now,
    updated_at: now,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    display_name: 'Demo Breeder Profile',
    organization_name: 'Demo Breeding Organization',
    primary_role: 'breeder',
    country_code: 'UY',
    jurisdiction_label: 'Uruguay — demo jurisdiction',
    verification_level: 'demo_not_verified',
    public_summary: 'Demo-only breeder profile used to show public-safe cultivar provenance placeholders.',
    website_url: null,
    contact_visibility: 'request_only',
    owner_user_id: null,
    review_status: 'submitted',
    created_at: now,
    updated_at: now,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    display_name: 'Demo Genetics Lab Provider',
    organization_name: 'Demo Genetics Lab Provider',
    primary_role: 'lab_provider',
    country_code: 'DE',
    jurisdiction_label: 'Germany — demo jurisdiction',
    verification_level: 'demo_profile_review',
    public_summary: 'Demo service provider profile for evidence review and verification request routing.',
    website_url: null,
    contact_visibility: 'request_only',
    owner_user_id: null,
    review_status: 'submitted',
    created_at: now,
    updated_at: now,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    display_name: 'Demo Tissue Culture Service',
    organization_name: 'Demo Tissue Culture Service',
    primary_role: 'tissue_culture_provider',
    country_code: 'NL',
    jurisdiction_label: 'Netherlands — demo jurisdiction',
    verification_level: 'demo_profile_review',
    public_summary: 'Demo tissue-culture service listing for qualified collaboration requests only.',
    website_url: null,
    contact_visibility: 'request_only',
    owner_user_id: null,
    review_status: 'submitted',
    created_at: now,
    updated_at: now,
  },
]

export const demoCultivarPassports: CultivarPassportRow[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    display_name: 'Demo Cultivar Alpha',
    slug: 'demo-cultivar-alpha',
    public_summary: 'Demo-only cultivar passport for controlled evidence, access, trial, and licensing discussions. Public details are placeholders and not seed, clone, pollen, or plant-material offers.',
    breeder_profile_id: demoGeneticsProfiles[1].id,
    rights_holder_profile_id: demoGeneticsProfiles[0].id,
    origin_country_code: 'UY',
    origin_jurisdiction_label: 'Uruguay — demo origin',
    cultivar_category: 'cannabis',
    cannabis_category: 'unknown',
    claim_status: 'not_assessed',
    claim_review_status: 'submitted',
    evidence_score_summary: 'Demo evidence score: not assessed. Private materials require approved access.',
    verification_summary: 'No public verification claim. Evidence may be reviewed privately by qualified parties.',
    public_disclaimer: 'Demo passport only. Harbourview does not promise seed, clone, pollen, plant-material shipment, import clearance, export clearance, medical claims, pathogen-free status, or IP ownership.',
    owner_user_id: null,
    is_public: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    display_name: 'Demo Cultivar Beta',
    slug: 'demo-cultivar-beta',
    public_summary: 'Demo-only research collaboration passport with evidence-needed status and country gates pending review.',
    breeder_profile_id: demoGeneticsProfiles[1].id,
    rights_holder_profile_id: demoGeneticsProfiles[0].id,
    origin_country_code: 'CA',
    origin_jurisdiction_label: 'Canada — demo origin',
    cultivar_category: 'research',
    cannabis_category: 'cbd_dominant',
    claim_status: 'claimed',
    claim_review_status: 'needs_evidence',
    evidence_score_summary: 'Claimed only; evidence is needed before any public verification statement.',
    verification_summary: 'Not assessed for public verification.',
    public_disclaimer: 'Demo passport only. Access requests are for discussion and evidence review, not plant-material purchase or shipment.',
    owner_user_id: null,
    is_public: true,
    created_at: now,
    updated_at: now,
  },
]

export const demoCultivarAliases: CultivarAliasRow[] = [
  { id: '21000000-0000-4000-8000-000000000001', cultivar_id: demoCultivarPassports[0].id, alias: 'Demo Alpha Public Alias', is_public: true, created_at: now },
  { id: '21000000-0000-4000-8000-000000000002', cultivar_id: demoCultivarPassports[0].id, alias: 'Internal Alpha Working Code', is_public: false, created_at: now },
]

export const demoCountryOpportunities: CultivarCountryOpportunityRow[] = [
  {
    id: '22000000-0000-4000-8000-000000000001',
    cultivar_id: demoCultivarPassports[0].id,
    country_code: 'DE',
    jurisdiction_label: 'Germany',
    opportunity_type: 'licensing_discussion',
    status: 'not_assessed',
    material_transfer_status: 'information_only',
    jurisdiction_gate_status: 'not_assessed',
    public_note: 'Demo Germany Licensing Discussion — Not Assessed. Discussion requires rights-holder and Harbourview review.',
    private_note: 'Demo private note: confirm counterparty licence before any evidence reveal.',
    requires_admin_review: true,
    review_status: 'submitted',
    created_at: now,
    updated_at: now,
  },
  {
    id: '22000000-0000-4000-8000-000000000002',
    cultivar_id: demoCultivarPassports[1].id,
    country_code: 'NL',
    jurisdiction_label: 'Netherlands',
    opportunity_type: 'research_collaboration',
    status: 'open_to_discussion',
    material_transfer_status: 'discussion_only',
    jurisdiction_gate_status: 'review_required',
    public_note: 'Demo Research Collaboration — Evidence Needed. No public movement or regulatory clearance is implied.',
    private_note: 'Demo private note: route evidence request to admin queue.',
    requires_admin_review: true,
    review_status: 'needs_evidence',
    created_at: now,
    updated_at: now,
  },
]

export const demoEvidenceItems: GeneticsEvidenceItemRow[] = [
  {
    id: '23000000-0000-4000-8000-000000000001',
    cultivar_id: demoCultivarPassports[0].id,
    profile_id: demoGeneticsProfiles[0].id,
    evidence_type: 'provenance_note',
    title: 'Demo provenance placeholder',
    source_label: 'Harbourview demo seed file',
    source_date: '2026-06-07',
    jurisdiction_label: 'Demo scope only',
    visibility: 'public_summary',
    claim_status: 'evidence_provided',
    review_status: 'evidence_attached',
    public_summary: 'Placeholder provenance note exists for workflow demonstration. It is not third-party verification.',
    private_notes: 'Private demo note hidden from public DTO.',
    file_path: 'private/demo/provenance-placeholder.pdf',
    file_is_private: true,
    expires_at: null,
    created_by: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: '23000000-0000-4000-8000-000000000002',
    cultivar_id: demoCultivarPassports[1].id,
    profile_id: demoGeneticsProfiles[2].id,
    evidence_type: 'genotype_report',
    title: 'Demo private genotype placeholder',
    source_label: null,
    source_date: null,
    jurisdiction_label: null,
    visibility: 'owner_admin_only',
    claim_status: 'not_assessed',
    review_status: 'needs_evidence',
    public_summary: null,
    private_notes: 'Private genotype metadata placeholder hidden from public DTO.',
    file_path: 'private/demo/genotype-placeholder.vcf',
    file_is_private: true,
    expires_at: null,
    created_by: null,
    created_at: now,
    updated_at: now,
  },
]

export const demoAccessRequests: GeneticsAccessRequestRow[] = [
  {
    id: '24000000-0000-4000-8000-000000000001',
    cultivar_id: demoCultivarPassports[0].id,
    requester_profile_id: demoGeneticsProfiles[2].id,
    request_type: 'verification_request',
    target_country_code: 'DE',
    target_jurisdiction_label: 'Germany',
    declared_purpose: 'Demo request for private evidence verification review.',
    status: 'submitted',
    requires_nda: true,
    requires_licence_review: true,
    requires_admin_review: true,
    review_notes_private: 'Demo private review note not exposed publicly.',
    created_at: now,
    updated_at: now,
  },
]

export const demoCollaborationProjects: GeneticsCollaborationProjectRow[] = [
  {
    id: '25000000-0000-4000-8000-000000000001',
    title: 'Demo Research Collaboration — Evidence Needed',
    slug: 'demo-research-collaboration-evidence-needed',
    project_type: 'research_collaboration',
    visibility: 'public_summary',
    status: 'evidence_needed',
    linked_cultivar_id: demoCultivarPassports[1].id,
    owner_profile_id: demoGeneticsProfiles[0].id,
    country_code: 'NL',
    jurisdiction_label: 'Netherlands',
    public_summary: 'Demo project seeking reviewed research collaboration discussion. No material movement is promised.',
    private_notes: 'Demo private project note hidden from public pages.',
    evidence_needed: 'Evidence needed before any verification or regulated-use claim can be displayed.',
    created_at: now,
    updated_at: now,
  },
]

export const demoServiceProviders: GeneticsServiceProviderRow[] = [
  { id: '26000000-0000-4000-8000-000000000001', profile_id: demoGeneticsProfiles[2].id, service_category: 'genotyping', service_summary: 'Demo genetics evidence review provider. Verification requests require admin review and scoped evidence.', country_code: 'DE', jurisdiction_label: 'Germany', verification_level: 'demo_profile_review', is_public: true, review_status: 'submitted', created_at: now, updated_at: now },
  { id: '26000000-0000-4000-8000-000000000002', profile_id: demoGeneticsProfiles[3].id, service_category: 'tissue_culture', service_summary: 'Demo tissue-culture service listing for collaboration intake. No clean-stock or pathogen-free claim is made.', country_code: 'NL', jurisdiction_label: 'Netherlands', verification_level: 'demo_profile_review', is_public: true, review_status: 'submitted', created_at: now, updated_at: now },
]

export const demoClaimReviews: GeneticsClaimReviewRow[] = [
  { id: '27000000-0000-4000-8000-000000000001', cultivar_id: demoCultivarPassports[1].id, evidence_item_id: demoEvidenceItems[1].id, claim_label: 'restricted verification claim requires evidence', claim_status: 'not_assessed', review_status: 'needs_evidence', reviewer_user_id: null, public_note: 'Claim remains not assessed publicly.', private_note: 'Demo admin note: do not publish verified/export-ready/pathogen-free language.', created_at: now, updated_at: now },
]

export const demoAuditEvents: GeneticsAuditEventRow[] = [
  { id: '28000000-0000-4000-8000-000000000001', actor_user_id: null, actor_profile_id: demoGeneticsProfiles[0].id, event_type: 'passport_created', entity_type: 'cultivar_passports', entity_id: demoCultivarPassports[0].id, public_summary: 'Demo passport created for P0 workflow.', private_metadata: { demo: true, redacted: true }, created_at: now },
  { id: '28000000-0000-4000-8000-000000000002', actor_user_id: null, actor_profile_id: demoGeneticsProfiles[2].id, event_type: 'access_requested', entity_type: 'genetics_access_requests', entity_id: demoAccessRequests[0].id, public_summary: 'Demo access request submitted.', private_metadata: { demo: true, requesterScreen: 'redacted' }, created_at: now },
]

function profileById(id: string | null) {
  return demoGeneticsProfiles.find((profile) => profile.id === id) ?? null
}

export function getPublicCultivarPassports() {
  return demoCultivarPassports.filter((cultivar) => cultivar.is_public).map((cultivar) => getPublicCultivarPassportBySlug(cultivar.slug)).filter((dto) => dto !== null)
}

export function getPublicCultivarPassportBySlug(slug: string) {
  const cultivar = demoCultivarPassports.find((item) => item.slug === slug && item.is_public)
  if (!cultivar) return null
  return toPublicCultivarPassportDTO({
    cultivar,
    aliases: demoCultivarAliases.filter((alias) => alias.cultivar_id === cultivar.id),
    breeder: profileById(cultivar.breeder_profile_id),
    rightsHolder: profileById(cultivar.rights_holder_profile_id),
    opportunities: demoCountryOpportunities.filter((opportunity) => opportunity.cultivar_id === cultivar.id),
    evidence: demoEvidenceItems.filter((evidence) => evidence.cultivar_id === cultivar.id),
    collaborations: demoCollaborationProjects.filter((project) => project.linked_cultivar_id === cultivar.id),
  })
}

export function getInternalCultivarPassports() {
  return demoCultivarPassports.map((cultivar) => {
    const publicDto = getPublicCultivarPassportBySlug(cultivar.slug)
    if (!publicDto) throw new Error(`Missing public DTO for demo cultivar ${cultivar.slug}`)
    return toInternalCultivarPassportDTO(publicDto, {
      cultivar,
      evidence: demoEvidenceItems.filter((item) => item.cultivar_id === cultivar.id),
      accessRequests: demoAccessRequests.filter((request) => request.cultivar_id === cultivar.id),
      opportunities: demoCountryOpportunities.filter((opportunity) => opportunity.cultivar_id === cultivar.id),
    })
  })
}

export function getAdminGeneticsReviewQueue() {
  return toAdminGeneticsReviewDTO({ cultivars: demoCultivarPassports, opportunities: demoCountryOpportunities, evidence: demoEvidenceItems, accessRequests: demoAccessRequests, claimReviews: demoClaimReviews, auditEvents: demoAuditEvents })
}

export function getPublicServiceProviders() {
  return demoServiceProviders.filter((provider) => provider.is_public).map((provider) => ({
    id: provider.id,
    displayName: profileById(provider.profile_id)?.display_name ?? 'Demo service provider',
    service_category: provider.service_category,
    service_summary: provider.service_summary,
    country_code: provider.country_code,
    jurisdiction_label: provider.jurisdiction_label,
    verification_level: provider.verification_level,
  }))
}

export function getPublicCollaborationProjects() {
  return demoCollaborationProjects.filter((project) => project.visibility === 'public_summary').map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    projectType: project.project_type,
    status: project.status,
    countryCode: project.country_code,
    jurisdictionLabel: project.jurisdiction_label,
    publicSummary: project.public_summary,
    evidenceNeeded: project.evidence_needed,
    cta: 'Start collaboration' as const,
  }))
}
