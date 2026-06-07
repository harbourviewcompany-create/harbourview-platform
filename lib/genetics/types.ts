export type GeneticsProfileRole =
  | 'breeder'
  | 'geneticist'
  | 'rights_holder'
  | 'lab_provider'
  | 'tissue_culture_provider'
  | 'nursery'
  | 'licensed_producer'
  | 'researcher'
  | 'importer_exporter'
  | 'advisor'
  | 'enterprise_buyer'
  | 'harbourview_reviewer'
  | 'harbourview_admin'

export type CultivarCategory =
  | 'cannabis'
  | 'hemp'
  | 'cbd'
  | 'medical'
  | 'adult_use'
  | 'research'
  | 'pharmaceutical'
  | 'industrial'
  | 'unknown'

export type CannabisCategory = 'cbd_dominant' | 'thc_dominant' | 'balanced' | 'minor_cannabinoid' | 'industrial_hemp' | 'unknown'

export type OpportunityType =
  | 'licensing_discussion'
  | 'trial_discussion'
  | 'research_collaboration'
  | 'verification_request'
  | 'tissue_culture_project'
  | 'nursery_partnership'
  | 'commercial_introduction'
  | 'ip_rights_review'
  | 'material_transfer_discussion'

export type CountryOpportunityStatus = 'open_to_discussion' | 'invite_only' | 'closed' | 'unavailable' | 'not_assessed' | 'blocked_pending_review'

export type EvidenceType =
  | 'genotype_report'
  | 'snp_panel'
  | 'whole_genome_report'
  | 'dna_fingerprint'
  | 'chemotype_profile'
  | 'coa'
  | 'terpene_panel'
  | 'cannabinoid_panel'
  | 'phenotype_record'
  | 'cultivation_trial'
  | 'stability_record'
  | 'pathogen_test'
  | 'tissue_culture_report'
  | 'clean_stock_report'
  | 'photo_record'
  | 'chain_of_custody'
  | 'licence_document'
  | 'ip_filing'
  | 'pbr_document'
  | 'plant_patent_document'
  | 'trademark_document'
  | 'material_transfer_agreement'
  | 'licensing_agreement'
  | 'provenance_note'
  | 'dispute_note'
  | 'other'

export type EvidenceVisibility = 'public_summary' | 'registered_members' | 'verified_members' | 'qualified_buyers' | 'nda_private' | 'invite_only' | 'owner_admin_only'
export type ClaimStatus = 'claimed' | 'evidence_provided' | 'externally_verified' | 'admin_reviewed' | 'disputed' | 'expired' | 'rejected' | 'not_assessed' | 'private_only'
export type ClaimReviewStatus = 'draft' | 'submitted' | 'needs_evidence' | 'evidence_attached' | 'approved_public' | 'approved_private_only' | 'downgraded' | 'rejected' | 'disputed' | 'expired'
export type AccessRequestStatus = 'draft' | 'submitted' | 'identity_review' | 'licence_review' | 'rights_holder_review' | 'nda_required' | 'approved_limited' | 'approved_full' | 'rejected' | 'expired' | 'revoked'
export type ProjectType = 'research_collaboration' | 'verification_project' | 'trial_project' | 'licensing_discussion' | 'tissue_culture_project' | 'commercial_introduction'
export type ProjectVisibility = 'public_summary' | 'registered_members' | 'invite_only' | 'owner_admin_only'
export type ServiceCategory = 'genotyping' | 'chemotype_testing' | 'pathogen_testing' | 'tissue_culture' | 'clean_stock' | 'nursery' | 'ip_advisory' | 'licensing_advisory' | 'regulatory_advisory' | 'other'
export type MaterialTransferStatus = 'none' | 'information_only' | 'discussion_only' | 'flagged_material_transfer' | 'licence_required' | 'permit_required' | 'admin_blocked' | 'externally_cleared'
export type JurisdictionGateStatus = 'not_assessed' | 'information_only' | 'review_required' | 'blocked' | 'externally_confirmed' | 'admin_approved_for_discussion'
export type AuditEventType = 'profile_created' | 'passport_created' | 'passport_updated' | 'evidence_attached' | 'access_requested' | 'access_status_changed' | 'claim_submitted' | 'claim_reviewed' | 'project_created' | 'service_listed' | 'material_transfer_flagged' | 'admin_note_added'

export type GeneticsProfileRow = {
  id: string
  display_name: string
  organization_name: string | null
  primary_role: GeneticsProfileRole
  country_code: string | null
  jurisdiction_label: string | null
  verification_level: string
  public_summary: string | null
  website_url: string | null
  contact_visibility: string
  owner_user_id: string | null
  review_status: ClaimReviewStatus
  created_at: string
  updated_at: string
}

export type CultivarPassportRow = {
  id: string
  display_name: string
  slug: string
  public_summary: string
  breeder_profile_id: string | null
  rights_holder_profile_id: string | null
  origin_country_code: string | null
  origin_jurisdiction_label: string | null
  cultivar_category: CultivarCategory
  cannabis_category: CannabisCategory | null
  claim_status: ClaimStatus
  claim_review_status: ClaimReviewStatus
  evidence_score_summary: string | null
  verification_summary: string | null
  public_disclaimer: string
  owner_user_id: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export type CultivarAliasRow = { id: string; cultivar_id: string; alias: string; is_public: boolean; created_at: string }
export type CultivarCountryOpportunityRow = { id: string; cultivar_id: string; country_code: string; jurisdiction_label: string | null; opportunity_type: OpportunityType; status: CountryOpportunityStatus; material_transfer_status: MaterialTransferStatus; jurisdiction_gate_status: JurisdictionGateStatus; public_note: string | null; private_note: string | null; requires_admin_review: boolean; review_status: ClaimReviewStatus; created_at: string; updated_at: string }
export type GeneticsEvidenceItemRow = { id: string; cultivar_id: string | null; profile_id: string | null; evidence_type: EvidenceType; title: string; source_label: string | null; source_date: string | null; jurisdiction_label: string | null; visibility: EvidenceVisibility; claim_status: ClaimStatus; review_status: ClaimReviewStatus; public_summary: string | null; private_notes: string | null; file_path: string | null; file_is_private: boolean; expires_at: string | null; created_by: string | null; created_at: string; updated_at: string }
export type GeneticsAccessRequestRow = { id: string; cultivar_id: string; requester_profile_id: string | null; request_type: OpportunityType; target_country_code: string | null; target_jurisdiction_label: string | null; declared_purpose: string; status: AccessRequestStatus; requires_nda: boolean; requires_licence_review: boolean; requires_admin_review: boolean; review_notes_private: string | null; created_at: string; updated_at: string }
export type GeneticsCollaborationProjectRow = { id: string; title: string; slug: string; project_type: ProjectType; visibility: ProjectVisibility; status: string; linked_cultivar_id: string | null; owner_profile_id: string | null; country_code: string | null; jurisdiction_label: string | null; public_summary: string; private_notes: string | null; evidence_needed: string | null; created_at: string; updated_at: string }
export type GeneticsServiceProviderRow = { id: string; profile_id: string; service_category: ServiceCategory; service_summary: string; country_code: string | null; jurisdiction_label: string | null; verification_level: string; is_public: boolean; review_status: ClaimReviewStatus; created_at: string; updated_at: string }
export type GeneticsClaimReviewRow = { id: string; cultivar_id: string; evidence_item_id: string | null; claim_label: string; claim_status: ClaimStatus; review_status: ClaimReviewStatus; reviewer_user_id: string | null; public_note: string | null; private_note: string | null; created_at: string; updated_at: string }
export type GeneticsAuditEventRow = { id: string; actor_user_id: string | null; actor_profile_id: string | null; event_type: AuditEventType; entity_type: string; entity_id: string; public_summary: string; private_metadata: Record<string, unknown> | null; created_at: string }
