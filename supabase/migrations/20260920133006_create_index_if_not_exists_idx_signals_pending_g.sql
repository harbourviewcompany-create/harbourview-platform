-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920133006
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create index if not exists idx_signals_pending_gemini_embedding
on public.signals (created_at asc)
where quality_label = 'signal' and embedding_gemini_1024 is null;
