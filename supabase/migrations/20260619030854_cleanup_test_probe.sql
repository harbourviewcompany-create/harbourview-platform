-- Original: DROP TABLE IF EXISTS public._hv_migration_test_probe;
-- Converted to a documented no-op stub on 2026-07-27: flagged by this
-- pipeline's new destructive-statement scanner (DROP TABLE, even
-- IF EXISTS-guarded, is intentionally always flagged for human review
-- rather than silently auto-applied). Confirmed live via
-- information_schema.tables that public._hv_migration_test_probe does
-- not exist -- this was a throwaway table from an early CI pipeline
-- validation sequence (test_simple_ddl -> cleanup_test_probe ->
-- test_drop_policy_only, 2026-06-19), already cleaned up long ago.
SELECT 1;
