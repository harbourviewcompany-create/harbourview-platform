-- education_modules, education_module_sections, and education_tracks all have
-- correctly-scoped RLS policies restricting anon/authenticated to published
-- content only, but were missing the base-table GRANT that RLS depends on.
-- Without it, PostgREST returns "permission denied" for every anon/authenticated
-- request before RLS is ever evaluated, regardless of how permissive the policy
-- is. This is why the Command Centre Education tab (and likely /education/*
-- public routes) silently fell back to generic placeholder content for every
-- real visitor: getLiveEduTiles() caught the permission error and returned [].
-- Verified before this migration: zero rows in information_schema.role_table_grants
-- for these three tables + anon/authenticated. RLS itself is untouched by this
-- migration and continues to restrict rows to publication_state = 'published'.
grant select on public.education_modules to anon, authenticated;
grant select on public.education_module_sections to anon, authenticated;
grant select on public.education_tracks to anon, authenticated;
