-- Reconstructed from the exact statement stored in production
-- supabase_migrations.schema_migrations for version 20260720093647.
-- Repository-only history repair: production already records this version as applied.

create view api.education_content_citations as
select id, module_id, section_id, claim, source_type, source_title, source_url, confidence_tier, open_question, notes, created_at
from public.education_content_citations;

grant select, insert, update, delete on api.education_content_citations to authenticated, service_role;
