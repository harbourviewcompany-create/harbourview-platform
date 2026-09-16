alter function public._backfill_strip_site_suffix(text, text) set search_path = pg_catalog, public;
revoke all on schema security from public, anon, authenticated;
comment on schema security is 'Security boundary metadata. No direct client access; service/definer control-plane only.';
