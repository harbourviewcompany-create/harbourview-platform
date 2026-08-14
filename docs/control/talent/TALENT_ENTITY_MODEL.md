# Talent Entity Model

Cross-links: TAL-001–TAL-078, TAL-085–TAL-100.

## Identity
`talent_people`, `talent_person_accounts`, `talent_person_aliases`, `talent_person_source_records`, `talent_person_identity_candidates`, `talent_person_merge_events`, `talent_organization_source_records`, `talent_organization_identity_candidates`, `talent_organization_link_events`, `talent_organization_relationships`, facility mappings.

## Taxonomy/evidence
`talent_taxonomy_versions`, `talent_taxonomy_terms`, aliases/edges/mappings/change events; `talent_assertions`, `talent_evidence_items`, assertion evidence/conflicts/supersessions, verification events.

## Employer
`talent_employer_profiles`, employer/domain verification, hiring-team members, recruiter authorizations, agency engagements, requisition members.

## Jobs
`talent_requisitions`, requisition versions, `talent_job_opportunities`, job versions, locations, compensation, requirements/requirement versions, application methods/change events; ingestion sources/rights/runs/source records/snapshots/observations/identity/freshness events.

## Passport
professional profiles, experiences/context, capabilities, credentials, credential authorities/verification, jurisdictions, languages, preferences, availability, work authorizations, mobility, contact points, profile claims, identity assurance.

## Privacy/search/match
profile visibility, disclosure grants, employer blocks, consents/events, DSR/legal holds/residency classification; job/person search documents, embeddings/projection state; match policy/runs/matches/factors/evidence/invalidations; eligibility rule versions/assessments/factors.

## Applications/trust
question sets/versions/questions/bindings; applications/identity snapshots/answers/status events; documents/access grants/events; audit, abuse/moderation, retention, notifications.

P1 keys reserved for candidate lists, threads/messages, interviews, assessments and offers. P2 graph/analytics reuse canonical identities and assertions rather than introducing duplicate masters.