-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260709212150.
--
-- Rewriting this file cannot affect production: 20260709212150 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Google News RSS article links (news.google.com/rss/articles/...) reliably
-- 403 on server-side fetch (confirmed by Codex's source-engine-fetch patch),
-- so every mainstream_media source using Google News RSS would only ever
-- capture a thin stub, never full article text. Replacing with direct
-- outlet RSS feeds. Reuters and AP discontinued public RSS years ago, so
-- the global-wire tier drops to 5 verified-working feeds instead of 8.
-- Country-level tier moves from Google News search-RSS to Guardian's
-- per-country tagged feeds (world/{country}/rss) — genuine mainstream
-- international press, not industry press, and not a Google redirect.
-- These feeds are topical (not cannabis-filtered), relying on the existing
-- keyword regex pre-filter in hv_extract_signals_from_captured_text() /
-- the editorial extraction step to find cannabis-relevant items within them.

-- Global wire tier: drop dead Reuters/AP, replace with verified feeds
DELETE FROM source_registry WHERE source_name IN ('Reuters – Cannabis', 'Associated Press – Cannabis', 'Bloomberg – Cannabis');

UPDATE source_registry SET source_url = 'https://feeds.bbci.co.uk/news/world/rss.xml', adapter = 'rss', notes = 'Direct BBC World RSS feed (verified). Cannabis relevance determined by keyword pre-filter, not feed-level search.' WHERE source_name = 'BBC News – Cannabis';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/rss', adapter = 'rss', notes = 'Direct Guardian World RSS feed (verified, actively monitored).' WHERE source_name = 'The Guardian – Cannabis';
UPDATE source_registry SET source_url = 'https://www.aljazeera.com/xml/rss/all.xml', adapter = 'rss', notes = 'Direct Al Jazeera RSS feed (verified live).' WHERE source_name = 'Al Jazeera – Cannabis';
UPDATE source_registry SET source_url = 'https://rss.dw.com/rdf/rss-en-top', adapter = 'rss', notes = 'Direct DW top-stories RSS feed (verified).' WHERE source_name = 'Deutsche Welle – Cannabis';

INSERT INTO source_registry (source_name, source_url, country, region, jurisdiction, language, requires_translation, source_type, tier, adapter, crawl_cadence, publish_cadence, signal_keywords, is_active, crawl_allowed, notes)
VALUES ('France 24 – Cannabis', 'https://www.france24.com/en/rss', 'Global', 'Global', 'Global', 'en', false, 'mainstream_media', 1, 'rss', 'daily', 'continuous', ARRAY['cannabis','marijuana'], true, true, 'Direct France 24 English RSS feed (verified).');

-- Country-level tier: replace Google News RSS with Guardian per-country feeds
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/usa/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – USA';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/canada/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Canada';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/brazil/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Brazil';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/mexico/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Mexico';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/argentina/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Argentina';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/colombia/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Colombia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/chile/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Chile';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/uruguay/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Uruguay';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/peru/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Peru';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/jamaica/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Jamaica';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/uk/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – UK';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/germany/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Germany';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/france/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – France';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/netherlands/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Netherlands';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/spain/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Spain';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/italy/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Italy';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/switzerland/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Switzerland';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/portugal/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Portugal';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/poland/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Poland';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/czech-republic/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Czech Republic';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/greece/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Greece';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/malta/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Malta';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/luxembourg/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Luxembourg';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/ireland/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Ireland';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/sweden/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Sweden';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/denmark/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Denmark';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/norway/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Norway';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/ukraine/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Ukraine';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/romania/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Romania';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/south-africa/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – South Africa';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/nigeria/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Nigeria';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/morocco/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Morocco';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/egypt/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Egypt';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/kenya/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Kenya';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/ghana/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Ghana';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/zimbabwe/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Zimbabwe';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/lesotho/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Lesotho';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/zambia/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Zambia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/rwanda/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Rwanda';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/thailand/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Thailand';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/israel/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Israel';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/india/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – India';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/japan/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Japan';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/south-korea/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – South Korea';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/philippines/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Philippines';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/indonesia/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Indonesia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/pakistan/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Pakistan';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/united-arab-emirates/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – UAE';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/saudi-arabia/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Saudi Arabia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/turkey/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Turkey';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/sri-lanka/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Sri Lanka';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/vietnam/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Vietnam';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/malaysia/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Malaysia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/australia-news/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Australia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/newzealand/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – New Zealand';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/fiji/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Fiji';

SELECT count(*) FILTER (WHERE adapter = 'rss') as now_direct_rss, count(*) FILTER (WHERE adapter = 'google_news_rss') as still_google_news, count(*) as total
FROM source_registry WHERE source_type = 'mainstream_media';
