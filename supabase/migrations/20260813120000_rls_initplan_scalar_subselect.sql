-- Performance: evaluate auth.* once per query instead of once per row.
--
-- `get_advisors(type: performance)` reports 13 `auth_rls_initplan` findings.
-- A bare `auth.role()` / `auth.uid()` inside a policy expression is re-evaluated
-- for every candidate row. Wrapping the call in a scalar subselect lets Postgres
-- hoist it into an InitPlan that runs once per query. The value is identical --
-- both functions are STABLE -- so this is a planner change, not a policy change.
-- No policy's name, command, roles, or permissiveness is altered; only the
-- expression is rewritten, via ALTER POLICY.
--
-- Guarded on policy existence for two reasons:
--   1. `job_search` is not created by any migration in this repository. The
--      schema and its tables exist only in the live project (undocumented, and
--      separately flagged). An unguarded ALTER would therefore fail every clean
--      rebuild, every Supabase preview branch, and the Global Reg OS postgres
--      validation harness.
--   2. It keeps the migration a safe no-op wherever a policy is already absent.
--
-- Deliberately NOT touched: `job_search.gmail_tokens` also has a policy named
-- `service role full access`, but its qual is the constant `true` with roles
-- `{service_role}`. It calls no auth function, is not one of the 13 findings,
-- and needs no change.

-- 1. job_search: ten policies sharing one shape.
--    Audited before writing -- each is PERMISSIVE, cmd ALL, roles {public},
--    qual `(auth.role() = 'service_role'::text)`, with_check NULL.
DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'companies',
    'jobs',
    'applications',
    'resume_versions',
    'contacts',
    'outreach_messages',
    'settings_legacy_single_row',
    'settings',
    'opportunities',
    'prospects'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'job_search'
        AND tablename = target_table
        AND policyname = 'service role full access'
    ) THEN
      EXECUTE format(
        'ALTER POLICY %I ON job_search.%I USING ((SELECT auth.role()) = ''service_role''::text)',
        'service role full access',
        target_table
      );
    END IF;
  END LOOP;
END $$;

-- 2. public.ia_extraction_failures -- SELECT, roles {public}.
--    The IN (SELECT ...) subquery is preserved exactly; only the auth.uid()
--    call on the left-hand side is hoisted.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ia_extraction_failures'
      AND policyname = 'Admins can view extraction failures'
  ) THEN
    ALTER POLICY "Admins can view extraction failures"
      ON public.ia_extraction_failures
      USING (
        (SELECT auth.uid()) IN (
          SELECT users.id
          FROM auth.users
          WHERE ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)
        )
      );
  END IF;
END $$;

-- 3. public.signal_relevance_feedback -- roles {authenticated}.
--    The SELECT policy carries a USING expression; the INSERT policy carries
--    only WITH CHECK, so each is altered on the clause it actually has.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'signal_relevance_feedback'
      AND policyname = 'signal_relevance_feedback_select_own'
  ) THEN
    ALTER POLICY signal_relevance_feedback_select_own
      ON public.signal_relevance_feedback
      USING ((SELECT auth.uid()) = user_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'signal_relevance_feedback'
      AND policyname = 'signal_relevance_feedback_insert_own'
  ) THEN
    ALTER POLICY signal_relevance_feedback_insert_own
      ON public.signal_relevance_feedback
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;
