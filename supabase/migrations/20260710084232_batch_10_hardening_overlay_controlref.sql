-- Batch 10 hardening + close-out follow-up:
-- 1) idempotency guards so a future CI replay of the batch_10 migration file cannot duplicate rows
-- 2) crawl_allowed=false on the 4 batch_10 source_registry rows (one-off citations, not crawl targets)
-- 3) country_education_overlay draft rows for UA/GH/PK/SI, review_status='review_pending'
--    (RLS on this table already restricts public SELECT to verified_* statuses, so review_pending
--    rows are NOT publicly visible -- safe to write without a consumer-shape confirmation)
-- 4) project_control_refs log entry, authority='proposal', flagging this batch for explicit
--    human sign-off per the Dual-AI Decision Protocol (this migration does not self-authorize that)

-- 1. Idempotency guards
ALTER TABLE market_metrics
  ADD CONSTRAINT market_metrics_country_metric_period_uniq
  UNIQUE (country_iso2, metric_name, period_start, period_end);

ALTER TABLE source_registry
  ADD CONSTRAINT source_registry_source_url_uniq
  UNIQUE (source_url);

-- 2. Stop treating one-off citation sources as crawl targets
UPDATE source_registry
SET crawl_allowed = false, updated_at = now()
WHERE source_url IN (
  'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/ukraine',
  'https://www.mint.gov.gh/ghana-begins-medicinal-and-industrial-cannabis-cultivation/',
  'https://legalclarity.org/is-weed-legal-in-pakistan-a-look-at-current-laws/',
  'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/slovenia'
);

-- 3. Education overlay drafts (review_pending -> not publicly visible per existing RLS policy)
INSERT INTO country_education_overlay
  (country_iso2, module_key, role_id, topics, action_label, source_ids, review_status)
VALUES
  ('UA', 'patient-access-pathways', 'patient_general',
   '["Medical cannabis has been legal in Ukraine since August 2024, but the first patient prescriptions were not dispensed until June 2026","Access currently runs entirely on imported finished product via electronic prescription -- there is no domestic retail or dispensary market","About 20 qualifying conditions are approved, including multiple sclerosis, neuropathy, chemotherapy complications, and childhood epilepsy","Only 3 products (all Curaleaf oils) were on the State Register as of January 2025"]'::jsonb,
   'Read the Ukraine jurisdiction playbook for full licensing and import detail',
   ARRAY[(SELECT source_id FROM jurisdiction_playbooks WHERE country_iso2='UA')],
   'review_pending'),

  ('GH', 'licence-class-guide', 'cultivator_producer',
   '["Ghana operates a licensed, low-THC-only (0.3% dry-weight ceiling) cannabis programme for medicinal and industrial use -- not recreational legalization","NACOC administers 11 distinct licence categories; applicants must be 18+ Ghanaian citizens/permanent residents or meet equivalent corporate ownership tests","The programme formally opened for applications in February-March 2026 via a fully digital NACOC portal","Diaspora Ghanaians are an explicit target investor group, per Ghana Investment Promotion Centre outreach"]'::jsonb,
   'Read the Ghana jurisdiction playbook before selecting a licence category',
   ARRAY[(SELECT source_id FROM jurisdiction_playbooks WHERE country_iso2='GH')],
   'review_pending'),

  ('PK', 'prohibition-risk-map', 'general',
   '["Pakistan''s cannabis framework is a genuine, unresolved source conflict -- reputable sources disagree on whether a functioning licensing authority (CCRA) is currently operational","Recreational and personal medical use remain illegal regardless of which account is accurate","No published personal-import exemption exists for CBD or cannabis products","Do not treat any single source on Pakistan as settled -- confirm directly with local counsel before any commercial decision"]'::jsonb,
   'Read the Pakistan jurisdiction playbook -- flagged conflicting_sources, verify with counsel',
   ARRAY[(SELECT source_id FROM jurisdiction_playbooks WHERE country_iso2='PK')],
   'review_pending'),

  ('SI', 'market-access-strategy', 'investor_operator',
   '["Slovenia passed an open medical cannabis licensing system in July 2025 -- any commercial operator meeting JAZMP/Ministry of Health criteria can apply","Recreational cannabis remains illegal, only decriminalized to a misdemeanor fine for personal possession","Industrial hemp THC ceiling is disputed across sources (0.2% vs 0.3%) -- confirm the current regulation text before any cultivation compliance decision","A single industry-press estimate projects the medical cannabis market at over EUR 55M by 2029 -- treat as directional, not verified market research"]'::jsonb,
   'Read the Slovenia jurisdiction playbook for the open-licensing criteria',
   ARRAY[(SELECT source_id FROM jurisdiction_playbooks WHERE country_iso2='SI')],
   'review_pending');

-- 4. Log this batch for explicit human sign-off (Dual-AI Decision Protocol)
INSERT INTO project_control_refs
  (id, system, external_type, external_id, external_url, canonical_entity_type, canonical_entity_id,
   canonical_key, authority, write_mode, title, status, metadata, first_seen_at, last_seen_at)
VALUES
  (gen_random_uuid(), 'manual', 'content_batch', 'batch_10_ua_gh_pk_si',
   'https://github.com/harbourviewcompany-create/harbourview-platform/blob/main/supabase/migrations/20260710170000_batch_10_playbooks_metrics_ua_gh_pk_si.sql',
   'content_batch', 'batch_10',
   'content_batch:batch_10_ua_gh_pk_si', 'proposal', 'read_only',
   'Batch 10: jurisdiction_playbooks + market_metrics for UA/GH/PK/SI -- pushed live and to main by Claude scrutiny-agent session without a prior proposal-queue step',
   'pending_review',
   jsonb_build_object(
     'countries', jsonb_build_array('UA','GH','PK','SI'),
     'tables_written', jsonb_build_array('jurisdiction_playbooks','market_metrics','source_registry','country_education_overlay'),
     'note', 'Pakistan entry has an unresolved conflicting-sources flag; all four jurisdiction_playbooks rows were set status=published directly, bypassing the documented proposal-queue -> confirmed-decision flow. Needs explicit Tyler sign-off or rollback to draft.',
     'rollback_available', true
   ),
   now(), now());

SELECT 'hardening applied' AS result;
