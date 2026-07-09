-- api.client_error_reports (created in 20260710160000_client_error_reports.sql)
-- silently bypassed the base table's RLS: Postgres views default to
-- security_invoker = false, meaning permission/RLS checks run as the VIEW
-- OWNER (postgres, which owns the table and is exempt from RLS with no
-- FORCE ROW LEVEL SECURITY set), not as the actual calling role. Verified
-- live: an anon insert with a 2500-char message (policy caps at 2000) was
-- silently accepted through api.client_error_reports, while the identical
-- insert against public.client_error_reports directly was correctly
-- rejected. This also meant the user_id = auth.uid() anti-spoofing check
-- was bypassed via the view. security_invoker = true makes the view
-- evaluate RLS as the actual invoking role, closing both holes.

alter view api.client_error_reports set (security_invoker = true);

notify pgrst, 'reload schema';
