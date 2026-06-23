-- The advisor flags these views as security_definer_view (ERROR), but for this codebase
-- that is a reviewed, intentional exception: they are curated PUBLIC projections that
-- expose only whitelisted columns of already-public rows. SECURITY DEFINER is what lets
-- anon read that projection WITHOUT a base-table grant. Converting them to security_invoker
-- would require granting anon direct SELECT on the underlying tables, exposing every column
-- of qualifying rows to direct queries -- a regression. Documented in-DB so future audits
-- do not re-litigate. (Internal-ops definer views were handled separately by revoking anon.)

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
