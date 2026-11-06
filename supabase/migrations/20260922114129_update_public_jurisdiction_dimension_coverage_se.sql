-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260922114129
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

update public.jurisdiction_dimension_coverage set status='verified_populated',applicability='applicable',evidence_basis='Primary Vatican City State legal source registered 2026-09-22; cannabis-specific regulatory evidence remains blocked separately.',last_evaluated_at=now(),notes='Primary legal provenance exists; evidence cell remains fail-closed.' where jurisdiction_key='VA' and dimension_key='source_registry';
