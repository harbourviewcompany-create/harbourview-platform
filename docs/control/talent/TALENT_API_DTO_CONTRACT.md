# Talent API and DTO Contract

Anchors: TAL-050–078, TAL-079–083; CTL-018; TAC-029,031,032,047.

Required P0 public/candidate endpoints include job search/detail/save, own Passport/visibility/blocks/consents, profile claim, canonical applications and controlled document upload/access. Employer P0 endpoints include permissioned people search/detail/disclosure and employer context. Ingestion/identity/indexing/matching/verification/moderation/retention endpoints are internal/server-only.

Required DTO families: `PublicJobOpportunityDTO`, `AuthenticatedJobOpportunityDTO`, `CandidateOwnedPassportDTO`, `PublicProfessionalDTO`, `TalentCandidateSearchDTO`, `TalentCandidateDetailDTO`, `TalentEmployerDTO`, candidate/employer application DTOs, match/eligibility/disclosure/document metadata DTOs, safe audit DTO and internal evidence DTO.

Base tables are not client contracts. DTOs are allowlisted and versioned. Adding a DB column cannot enlarge a public/private response automatically.

Breaking change = field removal/semantic change/type change/visibility expansion/authorization change. New versions require compatibility tests and explicit deprecation path; old clients never receive silently broadened private data.