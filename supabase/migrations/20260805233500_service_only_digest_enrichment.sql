-- Keep external-network digest and enrichment routines behind trusted server
-- execution. The production hardening migration closes every SECURITY DEFINER
-- routine first; this follow-on migration restores only these two exact
-- signatures to service_role and explicitly keeps browser roles denied.
do $service_only_digest_enrichment$
begin
  if to_regprocedure('public.run_editorial_digest()') is not null then
    revoke all privileges on function public.run_editorial_digest()
      from public, anon, authenticated;
    grant execute on function public.run_editorial_digest() to service_role;
  end if;

  if to_regprocedure('public.run_country_intel_enrichment()') is not null then
    revoke all privileges on function public.run_country_intel_enrichment()
      from public, anon, authenticated;
    grant execute on function public.run_country_intel_enrichment() to service_role;
  end if;
end
$service_only_digest_enrichment$;
