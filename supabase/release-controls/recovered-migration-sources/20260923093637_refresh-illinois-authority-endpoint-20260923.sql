-- HISTORICAL RECOVERY ARTIFACT
-- Production migration version: 20260923093637
-- Recovered verbatim from production supabase_migrations.schema_migrations.statements.
-- DO NOT REPLAY: archival source only.

update public.source_registry set source_url='https://idfpr.illinois.gov/profs/adultusecan.html',updated_at=now() where id='91403b9c-8369-4add-8614-a4f5b4570b34';
