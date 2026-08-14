-- CREATE OR REPLACE VIEW does NOT reset an omitted storage option back to
-- Postgres's default -- it preserves whatever was already set. Confirmed by
-- querying pg_class.reloptions directly: after the prior migration's
-- "create or replace view ... as select ..." with no WITH clause at all,
-- reloptions still showed security_invoker=true. Must set it explicitly.
alter view api.professional_service_providers set (security_invoker = false);
notify pgrst, 'reload schema';
