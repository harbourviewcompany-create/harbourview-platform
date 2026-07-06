-- Applied directly to production via Supabase MCP (Jul 3 2026 session, batch 12).
--
-- Cannabis Science Technology (403) turned out to be a duplicate, not a
-- stale URL. Attempting the fix hit a unique-constraint violation on
-- normalized URL -- another row ("Cannabis Science and Technology RSS",
-- id cc81660b) already exists, is active, and already points at the
-- correct feed (https://www.cannabissciencetech.com/rss). Deactivated the
-- redundant row rather than create a duplicate crawl of the same feed.
SELECT 1;
