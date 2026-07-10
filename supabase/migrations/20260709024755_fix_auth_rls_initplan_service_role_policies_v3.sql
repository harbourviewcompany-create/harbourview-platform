
-- Fix remaining 9 RLS policies with bare auth.role() in USING/WITH CHECK expressions.
-- Wraps auth.role() in a scalar subquery so it is evaluated once per query, not per row.

DROP POLICY IF EXISTS "service_write_deal_room_messages" ON public.deal_room_messages;
CREATE POLICY "service_write_deal_room_messages" ON public.deal_room_messages
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "service_write_deal_rooms" ON public.deal_rooms;
CREATE POLICY "service_write_deal_rooms" ON public.deal_rooms
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "service_write_professionals" ON public.hv_professionals;
CREATE POLICY "service_write_professionals" ON public.hv_professionals
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "hv_public_feed_service_write" ON public.hv_public_feed;
CREATE POLICY "hv_public_feed_service_write" ON public.hv_public_feed
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text)
  WITH CHECK ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "service_write_playbooks" ON public.jurisdiction_playbooks;
CREATE POLICY "service_write_playbooks" ON public.jurisdiction_playbooks
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "opportunities_service_write" ON public.opportunities;
CREATE POLICY "opportunities_service_write" ON public.opportunities
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text)
  WITH CHECK ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "service_role_only" ON public.scraper_source_state;
CREATE POLICY "service_role_only" ON public.scraper_source_state
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "Service role manages webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Service role manages webhook events" ON public.stripe_webhook_events
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "prefs_service_write" ON public.user_dashboard_preferences;
CREATE POLICY "prefs_service_write" ON public.user_dashboard_preferences
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text)
  WITH CHECK ((SELECT auth.role()) = 'service_role'::text);
