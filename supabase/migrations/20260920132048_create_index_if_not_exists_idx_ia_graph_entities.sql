-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920132048
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create index if not exists idx_ia_graph_entities_lower_label on public.ia_graph_entities (lower(label));
