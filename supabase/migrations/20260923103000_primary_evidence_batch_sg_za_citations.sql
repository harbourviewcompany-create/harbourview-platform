-- Recovery replay only.
-- The reconstructed regulatory_market_access_evidence relation is keyed by
-- evidence_key and has no UUID id column, while regulatory_citations.entity_id
-- requires UUID. The preceding evidence rows retain authority_url and rationale
-- provenance; do not fabricate incompatible citation identities.
select 1;
