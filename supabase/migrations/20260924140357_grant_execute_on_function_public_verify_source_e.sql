-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260924140357
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

grant execute on function public.verify_source_engine_cron_secret(text) to service_role;
