-- Applied directly to production via Supabase MCP (Jul 3 2026 session).
--
-- THE FINDING: the admin review UI (app/admin/signals/review/page.tsx)
-- exists and looks complete, but traced listRegulatoryReviewQueue() to
-- lib/regulatory-signals/admin.ts -- it queries regulatory_signals.signals,
-- a completely separate schema confirmed empty (0 rows) earlier this
-- session. It is not reviewing the live pipeline at all.
--
-- Meanwhile signals_quality (what fetchDashboardSignals/the Intel tab
-- reads) required reviewed=true for any cat='SOURCE_ENGINE' row. 7,136
-- automated signals existed; reviewed=true on zero of them, ever, because
-- there is no interface anywhere in the app that can set that flag on the
-- correct table. Every URL fix this session had been feeding a bucket
-- with no path to daylight -- only 95 hand-entered signals across 10
-- small manual categories were visible in the entire product.
--
-- Per Tyler's decision (option 2 of 2 presented): relax the gate rather
-- than build a new review UI right now.
--
-- FIRST PASS: dropped the reviewed=true requirement, kept the existing
-- score>=50 threshold (already calibrated in the original view, not a new
-- arbitrary number). Surfaced 1,085 of 7,136.
--
-- REFINEMENT (this migration): spot-checking the newly-surfaced content
-- found score 90-99 dominated by site navigation/footer chrome, not real
-- content -- confirmed directly by comparing multiple articles on the same
-- source (Business of Cannabis): identical nav-menu text ("BofC Awards
-- 2026 Cannabis Europa... Recent Searches Popular Searches") scored 99 on
-- two unrelated articles, while the genuine substantive prose from those
-- same articles (Albania's cultivation law, Slovenia's JAZMP licensing
-- detail, specific fees/gazette numbers) scored 30-70. Likely cause: nav
-- menus densely repeat topic-taxonomy keywords in a way that games a
-- keyword-density-based score; natural prose doesn't. The existing
-- v_boilerplate filter in hv_extract_signals_from_captured_text catches
-- generic site-chrome (cookie policy, sign in, etc) but not a site's own
-- internal topic-navigation menu -- a source-specific pattern a generic
-- list can't anticipate.
--
-- Excluded score >= 90 (score < 90 AND >= 50 for SOURCE_ENGINE). Drops
-- only 64 of 1,085, keeps 1,021. Re-verified with a fresh random sample
-- post-fix: real, substantive, correctly-formed headlines across the
-- board, no nav-chrome pollution.
--
-- KNOWN RESIDUAL LIMITATION, smaller and different in kind, not fixed
-- here: a handful of signals have a country tag that reflects the
-- source's own registration rather than the specific article's actual
-- topic (e.g. a general "Cannabis Laws in Dubai and the UAE" article from
-- a source registered under Finland). Not fixable by a score threshold --
-- would need per-signal topic/entity extraction rather than inheriting
-- the source's registered country. Flagged for a future pass, much
-- smaller in scale than the reviewed-gate and nav-chrome issues.

CREATE OR REPLACE VIEW public.signals_quality AS
SELECT id, date, cat, pri, score, headline, summary, source, url,
       verification, tier, lang, company, country, in_network,
       lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
       reviewed, action, created_at, embedding_1024, embedding_model, embedded_at
FROM public.signals
WHERE cat <> 'SOURCE_ENGINE' OR (cat = 'SOURCE_ENGINE' AND score >= 50 AND score < 90);
