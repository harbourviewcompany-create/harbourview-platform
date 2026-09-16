-- get_corridor_stats is consumed by the authenticated server route with the service-role client.
-- It must not be callable directly through PostgREST by anon/authenticated callers.
REVOKE EXECUTE ON FUNCTION api.get_corridor_stats(text) FROM anon, authenticated;
