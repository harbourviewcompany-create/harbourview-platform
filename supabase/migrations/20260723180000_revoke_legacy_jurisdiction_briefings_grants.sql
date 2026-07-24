-- Retire anon/authenticated public read access to the legacy jurisdiction_briefings
-- table and its api-schema view. Confirmed superseded by cc_jurisdiction_briefings:
--   - jurisdiction_briefings: 20 rows, stale (no writes since migration)
--   - cc_jurisdiction_briefings: 302 rows, actively written and read
-- Confirmed no application code reads the legacy table/view: both consumers of
-- jurisdiction data (app/actions/getJurisdictionBriefing.ts and
-- lib/command-centre/jurisdictionBriefingData.ts) query cc_jurisdiction_briefings
-- exclusively. The legacy api.jurisdiction_briefings view was still granted SELECT
-- to anon and authenticated, meaning stale country-briefing data was reachable by
-- anyone via PostgREST at GET /rest/v1/jurisdiction_briefings with no product
-- surface pointing at it -- dead, unnecessarily-exposed API surface.
--
-- This migration only revokes read grants; it does not drop the table or view,
-- so it's fully reversible (re-grant) and touches no data.

revoke select on api.jurisdiction_briefings from anon, authenticated;
