
do $$
declare v text;
begin
  foreach v in array array[
    'marketplace_public_listings_v1','public_country_profile_dto','signals_intelligence_feed',
    'genetics_public_profiles','genetics_public_claims','genetics_public_cultivar_passports',
    'genetics_public_cultivar_aliases','genetics_public_country_opportunities',
    'genetics_public_evidence_summaries','genetics_public_collaboration_projects',
    'genetics_public_service_providers'
  ]
  loop
    execute format(
      'comment on view public.%I is %L', v,
      'Intentional SECURITY DEFINER public DTO: exposes only whitelisted columns of public rows. '
      || 'Do NOT convert to security_invoker without granting anon base-table SELECT (column over-exposure). Reviewed exception.'
    );
  end loop;
end $$;
