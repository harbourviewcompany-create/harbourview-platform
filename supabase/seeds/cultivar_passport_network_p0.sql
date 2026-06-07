-- Demo-safe Cultivar Passport Network P0 seed records.
-- All records are placeholders. They do not assert real-world genetics verification,
-- lab results, pathogen-free status, IP ownership, medical/GMP/export readiness, or deals.

insert into genetics_profiles (id, display_name, organization_name, primary_role, country_code, jurisdiction_label, verification_level, public_summary, contact_visibility, review_status)
values
('10000000-0000-4000-8000-000000000001','Demo Rights Holder Profile','Demo Rights Holder Organization','rights_holder','CA','Canada — demo jurisdiction','demo_not_verified','Demo-only rights holder profile for controlled passport workflows. Not a real-world claim.','request_only','submitted'),
('10000000-0000-4000-8000-000000000002','Demo Breeder Profile','Demo Breeding Organization','breeder','UY','Uruguay — demo jurisdiction','demo_not_verified','Demo-only breeder profile used to show public-safe cultivar provenance placeholders.','request_only','submitted'),
('10000000-0000-4000-8000-000000000003','Demo Genetics Lab Provider','Demo Genetics Lab Provider','lab_provider','DE','Germany — demo jurisdiction','demo_profile_review','Demo service provider profile for evidence review and verification request routing.','request_only','submitted'),
('10000000-0000-4000-8000-000000000004','Demo Tissue Culture Service','Demo Tissue Culture Service','tissue_culture_provider','NL','Netherlands — demo jurisdiction','demo_profile_review','Demo tissue-culture service listing for qualified collaboration requests only.','request_only','submitted')
on conflict (id) do nothing;

insert into genetics_profile_roles (profile_id, role)
values
('10000000-0000-4000-8000-000000000001','rights_holder'),
('10000000-0000-4000-8000-000000000002','breeder'),
('10000000-0000-4000-8000-000000000003','lab_provider'),
('10000000-0000-4000-8000-000000000004','tissue_culture_provider')
on conflict (profile_id, role) do nothing;

insert into cultivar_passports (id, display_name, slug, public_summary, breeder_profile_id, rights_holder_profile_id, origin_country_code, origin_jurisdiction_label, cultivar_category, cannabis_category, claim_status, claim_review_status, evidence_score_summary, verification_summary, public_disclaimer, is_public)
values
('20000000-0000-4000-8000-000000000001','Demo Cultivar Alpha','demo-cultivar-alpha','Demo-only cultivar passport for controlled evidence, access, trial, and licensing discussions. Public details are placeholders and not seed, clone, pollen, or plant-material offers.','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','UY','Uruguay — demo origin','cannabis','unknown','not_assessed','submitted','Demo evidence score: not assessed. Private materials require approved access.','No public verification claim. Evidence may be reviewed privately by qualified parties.','Demo passport only. Harbourview does not promise seed, clone, pollen, plant-material shipment, import clearance, export clearance, medical claims, pathogen-free status, or IP ownership.',true),
('20000000-0000-4000-8000-000000000002','Demo Cultivar Beta','demo-cultivar-beta','Demo-only research collaboration passport with evidence-needed status and country gates pending review.','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','CA','Canada — demo origin','research','cbd_dominant','claimed','needs_evidence','Claimed only; evidence is needed before any public verification statement.','Not assessed for public verification.','Demo passport only. Access requests are for discussion and evidence review, not plant-material purchase or shipment.',true)
on conflict (id) do nothing;

insert into cultivar_aliases (id, cultivar_id, alias, is_public)
values
('21000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Demo Alpha Public Alias',true),
('21000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','Internal Alpha Working Code',false)
on conflict (id) do nothing;

insert into cultivar_country_opportunities (id, cultivar_id, country_code, jurisdiction_label, opportunity_type, status, material_transfer_status, jurisdiction_gate_status, public_note, private_note, requires_admin_review, review_status)
values
('22000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','DE','Germany','licensing_discussion','not_assessed','information_only','not_assessed','Demo Germany Licensing Discussion — Not Assessed. Discussion requires rights-holder and Harbourview review.','Demo private note: confirm counterparty licence before any evidence reveal.',true,'submitted'),
('22000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','NL','Netherlands','research_collaboration','open_to_discussion','discussion_only','review_required','Demo Research Collaboration — Evidence Needed. No public movement or regulatory clearance is implied.','Demo private note: route evidence request to admin queue.',true,'needs_evidence')
on conflict (id) do nothing;

insert into genetics_evidence_items (id, cultivar_id, profile_id, evidence_type, title, source_label, source_date, jurisdiction_label, visibility, claim_status, review_status, public_summary, private_notes, file_path, file_is_private)
values
('23000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','provenance_note','Demo provenance placeholder','Harbourview demo seed file','2026-06-07','Demo scope only','public_summary','evidence_provided','evidence_attached','Placeholder provenance note exists for workflow demonstration. It is not third-party verification.','Private demo note hidden from public DTO.','private/demo/provenance-placeholder.pdf',true),
('23000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','genotype_report','Demo private genotype placeholder',null,null,null,'owner_admin_only','not_assessed','needs_evidence',null,'Private genotype metadata placeholder hidden from public DTO.','private/demo/genotype-placeholder.vcf',true)
on conflict (id) do nothing;

insert into genetics_access_requests (id, cultivar_id, requester_profile_id, request_type, target_country_code, target_jurisdiction_label, declared_purpose, status, requires_nda, requires_licence_review, requires_admin_review, review_notes_private)
values ('24000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','verification_request','DE','Germany','Demo request for private evidence verification review.','submitted',true,true,true,'Demo private review note not exposed publicly.')
on conflict (id) do nothing;

insert into genetics_collaboration_projects (id, title, slug, project_type, visibility, status, linked_cultivar_id, owner_profile_id, country_code, jurisdiction_label, public_summary, private_notes, evidence_needed)
values ('25000000-0000-4000-8000-000000000001','Demo Research Collaboration — Evidence Needed','demo-research-collaboration-evidence-needed','research_collaboration','public_summary','evidence_needed','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','NL','Netherlands','Demo project seeking reviewed research collaboration discussion. No material movement is promised.','Demo private project note hidden from public pages.','Evidence needed before any verification or regulated-use claim can be displayed.')
on conflict (id) do nothing;

insert into genetics_project_members (project_id, profile_id, member_role, access_level)
values ('25000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','owner','admin')
on conflict (project_id, profile_id) do nothing;

insert into genetics_service_providers (id, profile_id, service_category, service_summary, country_code, jurisdiction_label, verification_level, is_public, review_status)
values
('26000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','genotyping','Demo genetics evidence review provider. Verification requests require admin review and scoped evidence.','DE','Germany','demo_profile_review',true,'submitted'),
('26000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004','tissue_culture','Demo tissue-culture service listing for collaboration intake. No clean-stock or pathogen-free claim is made.','NL','Netherlands','demo_profile_review',true,'submitted')
on conflict (id) do nothing;

insert into genetics_claim_reviews (id, cultivar_id, evidence_item_id, claim_label, claim_status, review_status, public_note, private_note)
values ('27000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','23000000-0000-4000-8000-000000000002','restricted verification claim requires evidence','not_assessed','needs_evidence','Claim remains not assessed publicly.','Demo admin note: do not publish verified/export-ready/pathogen-free language.')
on conflict (id) do nothing;

insert into genetics_audit_events (id, actor_profile_id, event_type, entity_type, entity_id, public_summary, private_metadata)
values
('28000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','passport_created','cultivar_passports','20000000-0000-4000-8000-000000000001','Demo passport created for P0 workflow.','{"demo":true,"redacted":true}'::jsonb),
('28000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','access_requested','genetics_access_requests','24000000-0000-4000-8000-000000000001','Demo access request submitted.','{"demo":true,"requesterScreen":"redacted"}'::jsonb)
on conflict (id) do nothing;
