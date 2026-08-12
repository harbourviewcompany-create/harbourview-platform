BEGIN;

CREATE OR REPLACE FUNCTION app.is_tenant_member(target_tenant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, iam, app AS $$
  SELECT target_tenant IS NOT NULL AND EXISTS (
    SELECT 1 FROM iam.memberships m
    WHERE m.tenant_id = target_tenant
      AND m.subject_id = app.current_subject_id()
      AND m.valid_from <= now()
      AND (m.valid_to IS NULL OR m.valid_to > now())
  );
$$;
CREATE OR REPLACE FUNCTION app.has_tenant_role(target_tenant uuid, required_roles text[]) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, iam, app AS $$
  SELECT target_tenant IS NOT NULL AND EXISTS (
    SELECT 1 FROM iam.memberships m
    WHERE m.tenant_id = target_tenant
      AND m.subject_id = app.current_subject_id()
      AND m.role_key = ANY(required_roles)
      AND m.valid_from <= now()
      AND (m.valid_to IS NULL OR m.valid_to > now())
  );
$$;
CREATE OR REPLACE FUNCTION app.can_read_visibility(target_tenant uuid, target_visibility visibility_class) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT CASE target_visibility
    WHEN 'public' THEN true
    WHEN 'registered' THEN app.current_subject_id() IS NOT NULL
    WHEN 'tenant' THEN app.is_tenant_member(target_tenant)
    WHEN 'restricted' THEN app.has_tenant_role(target_tenant, ARRAY['organization_owner','organization_administrator','general_counsel','compliance_lead','quality_lead','internal_auditor'])
    WHEN 'privileged' THEN app.has_tenant_role(target_tenant, ARRAY['organization_owner','general_counsel'])
    ELSE false END;
$$;
CREATE OR REPLACE FUNCTION app.can_write_tenant(target_tenant uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app.has_tenant_role(target_tenant, ARRAY[
    'organization_owner','organization_administrator','regulatory_affairs_lead',
    'compliance_lead','quality_lead','market_access_lead','operations_lead',
    'supply_chain_lead','commercial_lead'
  ]) OR app.has_platform_role('platform_super_administrator');
$$;

-- Identity and membership.
ALTER TABLE iam.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.subjects FORCE ROW LEVEL SECURITY;
CREATE POLICY subject_self_read ON iam.subjects FOR SELECT USING (id = app.current_subject_id() OR app.has_platform_role('platform_super_administrator') OR app.has_platform_role('security_administrator'));
CREATE POLICY subject_admin_write ON iam.subjects FOR ALL USING (app.has_platform_role('platform_super_administrator') OR app.has_platform_role('security_administrator')) WITH CHECK (app.has_platform_role('platform_super_administrator') OR app.has_platform_role('security_administrator'));

ALTER TABLE iam.platform_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.platform_role_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY platform_role_self_read ON iam.platform_role_assignments
  FOR SELECT USING (subject_id = app.current_subject_id());

ALTER TABLE iam.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam.memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY membership_read ON iam.memberships FOR SELECT USING (
  subject_id = app.current_subject_id() OR
  app.has_tenant_role(tenant_id, ARRAY['organization_owner','organization_administrator','internal_auditor']) OR
  app.has_platform_role('security_administrator') OR app.has_platform_role('platform_super_administrator'));
CREATE POLICY membership_write ON iam.memberships FOR ALL USING (
  app.has_tenant_role(tenant_id, ARRAY['organization_owner','organization_administrator']) OR app.has_platform_role('security_administrator') OR app.has_platform_role('platform_super_administrator'))
WITH CHECK (app.has_tenant_role(tenant_id, ARRAY['organization_owner','organization_administrator']) OR app.has_platform_role('security_administrator') OR app.has_platform_role('platform_super_administrator'));

-- Direct tenant-owned tables.
DO $rls$
DECLARE t regclass;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'billing.entitlements'::regclass,
    'compliance.organization_profiles'::regclass,'compliance.applicability_evaluations'::regclass,
    'compliance.assessments'::regclass,'compliance.findings'::regclass,
    'registry.counterparty_profiles'::regclass,'trade.corridors'::regclass,
    'trade.market_entry_projects'::regclass,'workflow.cases'::regclass,
    'workflow.tasks'::regclass,'workflow.watchlists'::regclass,
    'workflow.alert_rules'::regclass,'workflow.alert_events'::regclass
  ] LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY tenant_read ON %s FOR SELECT USING (app.is_tenant_member(tenant_id) OR app.has_platform_role(''platform_super_administrator'') OR app.has_platform_role(''security_administrator''))', t);
    EXECUTE format('CREATE POLICY tenant_insert ON %s FOR INSERT WITH CHECK (app.can_write_tenant(tenant_id))', t);
    EXECUTE format('CREATE POLICY tenant_update ON %s FOR UPDATE USING (app.can_write_tenant(tenant_id)) WITH CHECK (app.can_write_tenant(tenant_id))', t);
    EXECUTE format('CREATE POLICY tenant_delete ON %s FOR DELETE USING (app.has_tenant_role(tenant_id, ARRAY[''organization_owner'',''organization_administrator'']) OR app.has_platform_role(''platform_super_administrator''))', t);
  END LOOP;
END $rls$;

-- Visibility-bearing records.
ALTER TABLE evidence.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence.claims FORCE ROW LEVEL SECURITY;
CREATE POLICY claim_read ON evidence.claims FOR SELECT USING (app.can_read_visibility(tenant_id, visibility) OR app.has_platform_role('data_governance_lead'));
CREATE POLICY claim_write ON evidence.claims FOR ALL USING ((tenant_id IS NULL AND app.has_platform_role('data_governance_lead')) OR app.can_write_tenant(tenant_id)) WITH CHECK ((tenant_id IS NULL AND app.has_platform_role('data_governance_lead')) OR app.can_write_tenant(tenant_id));

ALTER TABLE regulatory.interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory.interpretations FORCE ROW LEVEL SECURITY;
CREATE POLICY interpretation_read ON regulatory.interpretations FOR SELECT USING (app.can_read_visibility(tenant_id, visibility) OR app.has_platform_role('data_governance_lead'));
CREATE POLICY interpretation_write ON regulatory.interpretations FOR ALL USING ((tenant_id IS NULL AND app.has_platform_role('data_governance_lead')) OR app.can_write_tenant(tenant_id)) WITH CHECK ((tenant_id IS NULL AND app.has_platform_role('data_governance_lead')) OR app.can_write_tenant(tenant_id));

ALTER TABLE registry.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.entities FORCE ROW LEVEL SECURITY;
CREATE POLICY entity_read ON registry.entities FOR SELECT USING (
  (tenant_id IS NULL AND visibility IN ('public','registered') AND classification IN ('public','registered_user')) OR
  app.can_read_visibility(tenant_id, visibility) OR app.has_platform_role('data_governance_lead'));
CREATE POLICY entity_write ON registry.entities FOR ALL USING ((tenant_id IS NULL AND app.has_platform_role('data_governance_lead')) OR app.can_write_tenant(tenant_id)) WITH CHECK ((tenant_id IS NULL AND app.has_platform_role('data_governance_lead')) OR app.can_write_tenant(tenant_id));

ALTER TABLE publication.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication.releases FORCE ROW LEVEL SECURITY;
CREATE POLICY release_read ON publication.releases FOR SELECT USING (app.can_read_visibility(tenant_id, visibility) OR app.has_platform_role('data_governance_lead'));
CREATE POLICY release_write ON publication.releases FOR ALL USING ((tenant_id IS NULL AND app.has_platform_role('data_governance_lead')) OR app.can_write_tenant(tenant_id)) WITH CHECK ((tenant_id IS NULL AND app.has_platform_role('data_governance_lead')) OR app.can_write_tenant(tenant_id));

-- Nullable tenant records without a visibility field.
ALTER TABLE evidence.evidence_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence.evidence_bundles FORCE ROW LEVEL SECURITY;
CREATE POLICY bundle_read ON evidence.evidence_bundles FOR SELECT USING (app.has_tenant_role(tenant_id, ARRAY['organization_owner','organization_administrator','general_counsel','compliance_lead','quality_lead','internal_auditor']) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead')));
CREATE POLICY bundle_write ON evidence.evidence_bundles FOR ALL USING (app.can_write_tenant(tenant_id) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead'))) WITH CHECK (app.can_write_tenant(tenant_id) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead')));

ALTER TABLE compliance.controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.controls FORCE ROW LEVEL SECURITY;
CREATE POLICY control_read ON compliance.controls FOR SELECT USING (app.is_tenant_member(tenant_id) OR (tenant_id IS NULL AND status IN ('approved','published')) OR app.has_platform_role('data_governance_lead'));
CREATE POLICY control_write ON compliance.controls FOR ALL USING (app.can_write_tenant(tenant_id) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead'))) WITH CHECK (app.can_write_tenant(tenant_id) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead')));

ALTER TABLE registry.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry.people FORCE ROW LEVEL SECURITY;
CREATE POLICY people_read ON registry.people FOR SELECT USING (app.is_tenant_member(tenant_id) OR app.has_platform_role('data_governance_lead') OR app.has_platform_role('security_administrator'));
CREATE POLICY people_write ON registry.people FOR ALL USING (app.can_write_tenant(tenant_id) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead'))) WITH CHECK (app.can_write_tenant(tenant_id) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead')));

ALTER TABLE trade.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade.products FORCE ROW LEVEL SECURITY;
CREATE POLICY product_read ON trade.products FOR SELECT USING (app.is_tenant_member(tenant_id) OR (tenant_id IS NULL AND classification IN ('public','registered_user') AND status IN ('approved','published')) OR app.has_platform_role('data_governance_lead'));
CREATE POLICY product_write ON trade.products FOR ALL USING (app.can_write_tenant(tenant_id) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead'))) WITH CHECK (app.can_write_tenant(tenant_id) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead')));

ALTER TABLE market.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE market.forecasts FORCE ROW LEVEL SECURITY;
CREATE POLICY forecast_read ON market.forecasts FOR SELECT USING (app.is_tenant_member(tenant_id) OR (tenant_id IS NULL AND status = 'published') OR app.has_platform_role('data_governance_lead'));
CREATE POLICY forecast_write ON market.forecasts FOR ALL USING (app.can_write_tenant(tenant_id) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead'))) WITH CHECK (app.can_write_tenant(tenant_id) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead')));

ALTER TABLE ai.model_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai.model_runs FORCE ROW LEVEL SECURITY;
CREATE POLICY model_run_read ON ai.model_runs FOR SELECT USING (app.has_tenant_role(tenant_id, ARRAY['organization_owner','organization_administrator','general_counsel','internal_auditor']) OR (tenant_id IS NULL AND app.has_platform_role('model_risk_reviewer')));
CREATE POLICY model_run_write ON ai.model_runs FOR ALL USING (app.can_write_tenant(tenant_id) OR app.has_platform_role('model_risk_reviewer')) WITH CHECK (app.can_write_tenant(tenant_id) OR app.has_platform_role('model_risk_reviewer'));

ALTER TABLE governance.corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance.corrections FORCE ROW LEVEL SECURITY;
CREATE POLICY correction_read ON governance.corrections FOR SELECT USING (app.has_tenant_role(tenant_id, ARRAY['organization_owner','organization_administrator','general_counsel','internal_auditor']) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead')));
CREATE POLICY correction_write ON governance.corrections FOR ALL USING (app.can_write_tenant(tenant_id) OR app.has_platform_role('data_governance_lead')) WITH CHECK (app.can_write_tenant(tenant_id) OR app.has_platform_role('data_governance_lead'));

ALTER TABLE workflow.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow.reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY review_read ON workflow.reviews FOR SELECT USING (app.is_tenant_member(tenant_id) OR (tenant_id IS NULL AND app.has_platform_role('data_governance_lead')));
CREATE POLICY review_write ON workflow.reviews FOR ALL USING (app.can_write_tenant(tenant_id) OR app.has_platform_role('data_governance_lead')) WITH CHECK (app.can_write_tenant(tenant_id) OR app.has_platform_role('data_governance_lead'));

-- Child records inherit tenancy through their canonical parent.
ALTER TABLE workflow.alert_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow.alert_deliveries FORCE ROW LEVEL SECURITY;
CREATE POLICY alert_delivery_read ON workflow.alert_deliveries FOR SELECT USING (EXISTS (SELECT 1 FROM workflow.alert_events e WHERE e.id = alert_event_id AND app.is_tenant_member(e.tenant_id)));
CREATE POLICY alert_delivery_write ON workflow.alert_deliveries FOR ALL USING (EXISTS (SELECT 1 FROM workflow.alert_events e WHERE e.id = alert_event_id AND app.can_write_tenant(e.tenant_id))) WITH CHECK (EXISTS (SELECT 1 FROM workflow.alert_events e WHERE e.id = alert_event_id AND app.can_write_tenant(e.tenant_id)));

ALTER TABLE trade.corridor_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade.corridor_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY corridor_version_read ON trade.corridor_versions FOR SELECT USING (EXISTS (SELECT 1 FROM trade.corridors c WHERE c.id = corridor_id AND app.is_tenant_member(c.tenant_id)));
CREATE POLICY corridor_version_write ON trade.corridor_versions FOR ALL USING (EXISTS (SELECT 1 FROM trade.corridors c WHERE c.id = corridor_id AND app.can_write_tenant(c.tenant_id))) WITH CHECK (EXISTS (SELECT 1 FROM trade.corridors c WHERE c.id = corridor_id AND app.can_write_tenant(c.tenant_id)));

ALTER TABLE trade.corridor_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade.corridor_gates FORCE ROW LEVEL SECURITY;
CREATE POLICY corridor_gate_read ON trade.corridor_gates FOR SELECT USING (EXISTS (SELECT 1 FROM trade.corridor_versions cv JOIN trade.corridors c ON c.id=cv.corridor_id WHERE cv.id=corridor_version_id AND app.is_tenant_member(c.tenant_id)));
CREATE POLICY corridor_gate_write ON trade.corridor_gates FOR ALL USING (EXISTS (SELECT 1 FROM trade.corridor_versions cv JOIN trade.corridors c ON c.id=cv.corridor_id WHERE cv.id=corridor_version_id AND app.can_write_tenant(c.tenant_id))) WITH CHECK (EXISTS (SELECT 1 FROM trade.corridor_versions cv JOIN trade.corridors c ON c.id=cv.corridor_id WHERE cv.id=corridor_version_id AND app.can_write_tenant(c.tenant_id)));

ALTER TABLE trade.corridor_determinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade.corridor_determinations FORCE ROW LEVEL SECURITY;
CREATE POLICY corridor_determination_read ON trade.corridor_determinations FOR SELECT USING (EXISTS (SELECT 1 FROM trade.corridor_versions cv JOIN trade.corridors c ON c.id=cv.corridor_id WHERE cv.id=corridor_version_id AND app.is_tenant_member(c.tenant_id)));
CREATE POLICY corridor_determination_write ON trade.corridor_determinations FOR ALL USING (EXISTS (SELECT 1 FROM trade.corridor_versions cv JOIN trade.corridors c ON c.id=cv.corridor_id WHERE cv.id=corridor_version_id AND app.can_write_tenant(c.tenant_id))) WITH CHECK (EXISTS (SELECT 1 FROM trade.corridor_versions cv JOIN trade.corridors c ON c.id=cv.corridor_id WHERE cv.id=corridor_version_id AND app.can_write_tenant(c.tenant_id)));

ALTER TABLE trade.required_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade.required_documents FORCE ROW LEVEL SECURITY;
CREATE POLICY required_document_read ON trade.required_documents FOR SELECT USING (EXISTS (SELECT 1 FROM trade.corridor_gates cg JOIN trade.corridor_versions cv ON cv.id=cg.corridor_version_id JOIN trade.corridors c ON c.id=cv.corridor_id WHERE cg.id=corridor_gate_id AND app.is_tenant_member(c.tenant_id)));
CREATE POLICY required_document_write ON trade.required_documents FOR ALL USING (EXISTS (SELECT 1 FROM trade.corridor_gates cg JOIN trade.corridor_versions cv ON cv.id=cg.corridor_version_id JOIN trade.corridors c ON c.id=cv.corridor_id WHERE cg.id=corridor_gate_id AND app.can_write_tenant(c.tenant_id))) WITH CHECK (EXISTS (SELECT 1 FROM trade.corridor_gates cg JOIN trade.corridor_versions cv ON cv.id=cg.corridor_version_id JOIN trade.corridors c ON c.id=cv.corridor_id WHERE cg.id=corridor_gate_id AND app.can_write_tenant(c.tenant_id)));

ALTER TABLE trade.product_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade.product_classifications FORCE ROW LEVEL SECURITY;
CREATE POLICY product_classification_read ON trade.product_classifications FOR SELECT USING (EXISTS (SELECT 1 FROM trade.products p WHERE p.id=product_id AND (app.is_tenant_member(p.tenant_id) OR (p.tenant_id IS NULL AND p.classification IN ('public','registered_user') AND p.status IN ('approved','published')))));
CREATE POLICY product_classification_write ON trade.product_classifications FOR ALL USING (EXISTS (SELECT 1 FROM trade.products p WHERE p.id=product_id AND app.can_write_tenant(p.tenant_id)) OR app.has_platform_role('data_governance_lead')) WITH CHECK (EXISTS (SELECT 1 FROM trade.products p WHERE p.id=product_id AND app.can_write_tenant(p.tenant_id)) OR app.has_platform_role('data_governance_lead'));

-- Raw evidence and audit records are restricted and append-only from request roles.
ALTER TABLE evidence.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence.snapshots FORCE ROW LEVEL SECURITY;
CREATE POLICY snapshots_privileged_read ON evidence.snapshots FOR SELECT USING (app.has_platform_role('source_operations_analyst') OR app.has_platform_role('ingestion_engineer') OR app.has_platform_role('data_governance_lead') OR app.has_platform_role('security_administrator'));
CREATE POLICY snapshots_ingest_insert ON evidence.snapshots FOR INSERT WITH CHECK (app.has_platform_role('ingestion_engineer') OR app.has_platform_role('source_operations_analyst'));

ALTER TABLE governance.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance.audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_read ON governance.audit_events FOR SELECT USING (app.has_tenant_role(tenant_id, ARRAY['organization_owner','organization_administrator','general_counsel','internal_auditor']) OR app.has_platform_role('security_administrator') OR app.has_platform_role('data_governance_lead'));
CREATE POLICY audit_insert ON governance.audit_events FOR INSERT WITH CHECK (tenant_id IS NULL OR app.is_tenant_member(tenant_id) OR app.has_platform_role('security_administrator'));

REVOKE UPDATE, DELETE ON governance.audit_events FROM PUBLIC;
REVOKE UPDATE, DELETE ON evidence.snapshots FROM PUBLIC;
REVOKE UPDATE, DELETE ON evidence.document_versions FROM PUBLIC;
COMMIT;
