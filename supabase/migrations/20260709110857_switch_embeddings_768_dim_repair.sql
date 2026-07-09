-- Repair stub: this migration's content (switch ia_signal_embeddings to
-- 768-dim for text-embedding-004) was already committed as
-- 20260708100000_switch_embeddings_768_dim.sql, but Supabase's apply
-- tooling recorded it under this timestamp (20260709110857) in the remote
-- supabase_migrations.schema_migrations ledger when it was actually
-- executed, rather than the version already present in the filename.
-- Same migration, two ledger-adjacent version numbers. This stub reconciles
-- the local migration directory with the remote ledger for this specific
-- version; the actual DDL is not repeated here since it already ran.
SELECT 1; -- no-op
