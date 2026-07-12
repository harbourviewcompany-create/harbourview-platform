INSERT INTO project_control_refs
  (id, system, external_type, external_id, external_url, canonical_entity_type, canonical_entity_id,
   canonical_key, authority, write_mode, title, status, metadata, first_seen_at, last_seen_at)
VALUES
  (gen_random_uuid(), 'manual', 'schema_change', 'numeric_to_double_optimization',
   'https://github.com/harbourviewcompany-create/harbourview-platform/blob/main/supabase/migrations/20260710190000_numeric_to_double_precision_optimization.sql',
   'schema_change', 'numeric_to_double_optimization',
   'schema_change:numeric_to_double_optimization', 'proposal', 'read_only',
   'Reclassified 25 score/confidence columns numeric -> double precision to eliminate PostgREST numeric-as-string bug class. Excluded 16 columns (signal_candidates x13, marketplace_candidates, hv_import_staging) due to dependent views (some in an api schema mirror not caught by a same-schema check) -- deliberately not touched given RLS-sensitivity history.',
   'pending_review',
   jsonb_build_object(
     'columns_converted', 25,
     'columns_excluded_view_dependency', jsonb_build_array('signal_candidates.*(13 cols)','marketplace_candidates.confidence','hv_import_staging.duplicate_confidence','listings.average_rating','cc_jurisdiction_briefings.confidence_score'),
     'app_layer_fixes', jsonb_build_array('lib/marketplace/publicProjection.ts:price_amount','lib/dashboard/dashboardLiveData.ts:confidence_score'),
     'note', 'cc_jurisdiction_briefings.confidence_score confirmed via existing code comment to be a uniform 0.72 seed value across all 203 countries -- casting fixed its type but the data itself is not meaningful. Recommend deciding whether to stop exposing it or re-seed real values. api schema view layer (hv_import_staging, marketplace_candidates, signal_candidates) needs inspection before those 14 remaining columns can be converted.',
     'rollback_available', true
   ),
   now(), now());
