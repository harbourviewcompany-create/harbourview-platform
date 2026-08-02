BEGIN;
CREATE SCHEMA IF NOT EXISTS public_api;
CREATE SCHEMA IF NOT EXISTS tenant_api;
CREATE SCHEMA IF NOT EXISTS internal_api;

CREATE VIEW public_api.jurisdictions WITH (security_barrier = true) AS
SELECT j.id, j.canonical_code, j.iso_alpha2, j.iso_alpha3, j.name, j.official_name,
       j.kind, j.parent_id, j.valid_from, j.valid_to,
       coalesce(jsonb_agg(jsonb_build_object(
         'domain_key', c.domain_key,
         'maturity_level', c.maturity_level,
         'coverage_status', c.coverage_status,
         'limitations', c.limitations,
         'last_verified_at', c.last_verified_at,
         'next_review_due_at', c.next_review_due_at
       )) FILTER (WHERE c.domain_key IS NOT NULL), '[]'::jsonb) AS coverage
FROM geo.jurisdictions j
LEFT JOIN geo.coverage_registry c ON c.jurisdiction_id = j.id
WHERE j.status = 'published'
GROUP BY j.id;

CREATE VIEW public_api.published_claims WITH (security_barrier = true) AS
SELECT c.id, c.truth_class, c.claim_text, c.structured_claim, c.jurisdiction_id,
       c.effective_from, c.effective_to, c.confidence, c.uncertainty_reason, c.created_at
FROM evidence.claims c
WHERE c.status = 'published' AND c.visibility = 'public' AND c.classification = 'public';

CREATE VIEW public_api.regulatory_changes WITH (security_barrier = true) AS
SELECT rc.id, rc.jurisdiction_id, rc.instrument_id, rc.from_version_id, rc.to_version_id,
       rc.change_kind, rc.title, rc.summary, rc.materiality,
       rc.published_at, rc.effective_at, rc.created_at AS detected_at, rc.status
FROM regulatory.regulatory_changes rc
WHERE rc.status = 'published';

CREATE VIEW public_api.licences WITH (security_barrier = true) AS
SELECT l.id, l.entity_id, l.facility_id, l.licence_class_id, l.authority_id, l.licence_number,
       l.status, l.issued_at, l.effective_from, l.expires_at, l.scope, l.record_status
FROM registry.licences l
JOIN registry.entities e ON e.id = l.entity_id
WHERE l.record_status = 'published' AND e.status = 'published'
  AND e.visibility = 'public' AND e.classification = 'public';

CREATE VIEW public_api.market_observations WITH (security_barrier = true) AS
SELECT o.id, o.metric_definition_id, o.jurisdiction_id, o.product_concept_id,
       o.channel_concept_id, o.period_start, o.period_end, o.state, o.value,
       o.unit, o.currency, o.confidence, o.methodology_version, o.created_at
FROM market.observations o
JOIN market.metric_definitions m ON m.id = o.metric_definition_id
JOIN market.datasets d ON d.id = o.dataset_id
WHERE o.status = 'published' AND m.status = 'published' AND d.classification = 'public';

-- Tenant/API projections are allowlisted. They use request context in app.* helpers.
CREATE VIEW tenant_api.current_obligations WITH (security_barrier = true) AS
SELECT o.id, o.jurisdiction_id, o.provision_id, o.obligation_key, o.version, o.modality,
       o.subject_concept_id, o.action_concept_id, o.object_concept_id, o.conditions,
       o.exceptions, o.trigger_definition, o.frequency_definition, o.deadline_definition,
       o.responsible_role_concept_id, o.evidence_requirement, o.filing_requirement,
       o.retention_requirement, o.consequence, o.risk_tier, o.effective_from, o.effective_to
FROM compliance.obligations o
WHERE o.status IN ('approved','published')
  AND (o.effective_to IS NULL OR o.effective_to > now());

CREATE VIEW tenant_api.visible_entities WITH (security_barrier = true) AS
SELECT e.id, e.jurisdiction_id, e.entity_kind, e.legal_name, e.normalized_name,
       e.registration_identifier, e.registration_authority_id, e.status,
       e.visibility, e.classification, e.valid_from, e.valid_to, e.metadata
FROM registry.entities e
WHERE (e.tenant_id IS NULL AND e.visibility IN ('public','registered')
       AND e.classification IN ('public','registered_user') AND e.status IN ('approved','published'))
   OR app.can_read_visibility(e.tenant_id, e.visibility)
   OR app.has_platform_role('data_governance_lead');

CREATE VIEW tenant_api.visible_entity_names WITH (security_barrier = true) AS
SELECT n.id, n.entity_id, n.name, n.name_type, n.language, n.valid_from, n.valid_to
FROM registry.entity_names n
JOIN registry.entities e ON e.id = n.entity_id
WHERE (e.tenant_id IS NULL AND e.visibility IN ('public','registered')
       AND e.classification IN ('public','registered_user') AND e.status IN ('approved','published'))
   OR app.can_read_visibility(e.tenant_id, e.visibility)
   OR app.has_platform_role('data_governance_lead');

CREATE VIEW tenant_api.visible_licences WITH (security_barrier = true) AS
SELECT l.id, l.entity_id, l.facility_id, l.licence_class_id, l.authority_id, l.licence_number,
       l.status, l.issued_at, l.effective_from, l.expires_at, l.status_changed_at,
       l.scope, l.conditions, l.record_status
FROM registry.licences l
JOIN registry.entities e ON e.id = l.entity_id
WHERE ((e.tenant_id IS NULL AND e.visibility IN ('public','registered')
       AND e.classification IN ('public','registered_user') AND e.status IN ('approved','published'))
   OR app.can_read_visibility(e.tenant_id, e.visibility)
   OR app.has_platform_role('data_governance_lead'));


CREATE VIEW tenant_api.active_gate_definitions WITH (security_barrier = true) AS
SELECT g.id, g.gate_key, g.version, g.name, g.category, g.description,
       g.required_evidence_schema, g.reviewer_role, g.risk_tier, g.status
FROM trade.gate_definitions g
WHERE g.status IN ('approved','published');

CREATE VIEW tenant_api.visible_products WITH (security_barrier = true) AS
SELECT p.id, p.tenant_id, p.canonical_name, p.product_concept_id, p.intended_use_concept_id,
       p.dosage_form_concept_id, p.substance_composition, p.strength, p.packaging,
       p.classification, p.status
FROM trade.products p
WHERE app.is_tenant_member(p.tenant_id)
   OR (p.tenant_id IS NULL AND p.classification IN ('public','registered_user') AND p.status IN ('approved','published'))
   OR app.has_platform_role('data_governance_lead');

CREATE VIEW internal_api.claim_lineage WITH (security_invoker = true) AS
SELECT c.id AS claim_id, c.tenant_id, c.truth_class, c.claim_text, c.status, c.visibility,
       ce.relationship, ce.citation_confidence, p.id AS passage_id, p.stable_anchor,
       p.page_number, p.section_identifier, p.original_text,
       dv.id AS document_version_id, d.id AS document_id, d.canonical_title,
       s.id AS snapshot_id, s.content_hash, s.retrieved_at, s.storage_uri
FROM evidence.claims c
JOIN evidence.claim_evidence ce ON ce.claim_id = c.id
JOIN evidence.passages p ON p.id = ce.passage_id
JOIN evidence.document_versions dv ON dv.id = p.document_version_id
JOIN evidence.documents d ON d.id = dv.document_id
JOIN evidence.snapshots s ON s.id = dv.snapshot_id;

REVOKE ALL ON SCHEMA public_api,tenant_api,internal_api FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public_api,tenant_api,internal_api FROM PUBLIC;
COMMENT ON SCHEMA public_api IS 'Allowlisted public projections only. Never add a column without leakage review.';
COMMENT ON SCHEMA tenant_api IS 'Allowlisted authenticated projections. Request context is mandatory.';
COMMENT ON SCHEMA internal_api IS 'Privileged projections retaining evidence and review lineage.';
COMMIT;
