-- Flagged during the security_definer_view audit (20260710190000): these 3
-- base tables grant full CRUD (DELETE, INSERT, REFERENCES, SELECT, TRIGGER,
-- TRUNCATE, UPDATE) directly to anon/authenticated, almost certainly from a
-- stray broad GRANT rather than a deliberate decision -- confirmed by
-- checking pg_policies: none of the three has a permissive INSERT/UPDATE/
-- DELETE policy for anon/authenticated, so RLS already blocks every write
-- via PostgREST today. Not an active breach (RLS is the real enforcing
-- control and it's intact), but dead, overly-broad grants are still worth
-- closing:
--   - Least privilege: no code path needs these, so there's nothing to
--     preserve by keeping them.
--   - TRUNCATE is the one command Postgres never subjects to RLS at all --
--     currently inert only because anon/authenticated aren't reachable via
--     a direct Postgres connection in this architecture (PostgREST-only),
--     but that's an operational fact to keep true, not something this
--     grant should depend on.

-- country_education_overlay / editorial_items: each has exactly one
-- permissive policy, and it's SELECT-only (content-gated: review_status /
-- stage). Keep that read path; drop everything else.
revoke insert, update, delete, truncate, trigger, references
  on public.country_education_overlay from anon, authenticated;
revoke insert, update, delete, truncate, trigger, references
  on public.editorial_items from anon, authenticated;

-- stripe_webhook_events: its one policy is `ALL ... USING (auth.role() =
-- 'service_role')` -- anon/authenticated are blocked from every command,
-- including SELECT. No read path to preserve here at all.
revoke all on public.stripe_webhook_events from anon, authenticated;
