
-- Performance-only rewrite of 9 RLS policies flagged by the Supabase advisor
-- (auth_rls_initplan): each called auth.uid()/auth.role() directly in its
-- USING/WITH CHECK clause, which Postgres re-evaluates per row instead of
-- once per query. Wrapping the call as (select auth.uid()) lets the planner
-- treat it as a stable subplan evaluated once. No change in semantics or
-- access control -- every condition is logically identical, just faster at
-- scale. Verified via pg_policies immediately before writing this migration.

alter policy "Public can report client errors" on public.client_error_reports
  with check (
    (length(trim(both from message)) > 0)
    and (length(message) <= 2000)
    and ((stack is null) or (length(stack) <= 4000))
    and ((route is null) or (length(route) <= 500))
    and ((digest is null) or (length(digest) <= 200))
    and ((user_agent is null) or (length(user_agent) <= 500))
    and ((viewport_width is null) or ((viewport_width > 0) and (viewport_width <= 20000)))
    and ((extra is null) or (pg_column_size(extra) <= 4000))
    and (not (user_id is distinct from (select auth.uid())))
  );

alter policy deal_capital_raises_service_write on public.deal_capital_raises
  using ((select auth.role()) = 'service_role'::text)
  with check ((select auth.role()) = 'service_role'::text);

alter policy deal_investors_service_write on public.deal_investors
  using ((select auth.role()) = 'service_role'::text)
  with check ((select auth.role()) = 'service_role'::text);

alter policy deal_ma_transactions_service_write on public.deal_ma_transactions
  using ((select auth.role()) = 'service_role'::text)
  with check ((select auth.role()) = 'service_role'::text);

alter policy deal_participants_service_write on public.deal_participants
  using ((select auth.role()) = 'service_role'::text)
  with check ((select auth.role()) = 'service_role'::text);

alter policy education_content_citations_service_write on public.education_content_citations
  using ((select auth.role()) = 'service_role'::text);

alter policy education_content_citations_staff_all on public.education_content_citations
  using (exists (
    select 1 from user_roles
    where user_roles.user_id = (select auth.uid())
      and user_roles.role = any (array['admin'::text, 'operator'::text, 'analyst'::text])
  ));

alter policy ia_source_embeddings_admin_operator_all on public.ia_source_embeddings
  using (exists (
    select 1 from user_roles
    where user_roles.user_id = (select auth.uid())
      and user_roles.role = any (array['admin'::text, 'operator'::text])
  ))
  with check (exists (
    select 1 from user_roles
    where user_roles.user_id = (select auth.uid())
      and user_roles.role = any (array['admin'::text, 'operator'::text])
  ));

alter policy "Authenticated users can apply to be listed" on public.professional_service_provider_listings
  with check (
    (not (submitted_by is distinct from (select auth.uid())))
    and (status = 'pending'::text)
    and (reviewed_at is null)
    and (reviewer_notes is null)
  );
