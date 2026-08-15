-- Reconstructed from production on 2026-08-14.
--
-- This file previously contained no DDL at all. It carried a short comment
-- saying it had been applied directly to production via Supabase MCP and
-- existed only to satisfy local/remote migration history parity, followed by
-- a single `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing
-- nothing, so `supabase db reset --local` could not rebuild the schema this
-- migration is supposed to create. The statements below are the verbatim text
-- production actually ran, read back from
-- supabase_migrations.schema_migrations.statements for version 20260720093647.
--
-- Rewriting this file cannot affect production: 20260720093647 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.

create view api.education_content_citations as
select id, module_id, section_id, claim, source_type, source_title, source_url, confidence_tier, open_question, notes, created_at
from public.education_content_citations;

grant select, insert, update, delete on api.education_content_citations to authenticated, service_role;
