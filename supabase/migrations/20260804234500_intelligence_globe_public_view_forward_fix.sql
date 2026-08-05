-- Forward-only repair for the intelligence globe public projection.
-- The original 20260302000000 migration is restored to its applied checksum;
-- this migration carries the intended idempotent policy/view correction.

do $$
begin
  if to_regclass('intelligence.country_intelligence_profiles') is null then
    return;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'intelligence'
      and tablename = 'country_intelligence_profiles'
      and policyname = 'intelligence_country_public_read'
  ) then
    create policy intelligence_country_public_read
      on intelligence.country_intelligence_profiles
      for select
      using (public_safe = true and publish_to_public = true);
  end if;
end
$$;

do $$
begin
  if to_regclass('intelligence.country_intelligence_profiles') is not null then
    execute $view$
      create or replace view intelligence.public_country_intelligence
      with (security_invoker = true)
      as
      select
        id,
        country_code,
        country_name,
        region,
        public_summary,
        commercial_pathway_summary,
        last_reviewed_at
      from intelligence.country_intelligence_profiles
      where public_safe = true
        and publish_to_public = true
    $view$;

    revoke all privileges on table intelligence.public_country_intelligence
      from public, anon, authenticated;
    grant select on table intelligence.public_country_intelligence
      to anon, authenticated, service_role;
  end if;
end
$$;
