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
-- version 20260719231746.
--
-- Rewriting this file cannot affect production: 20260719231746 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Kenya update: the Rastafari Society of Kenya religious-exemption case, which I flagged in
-- batch 11 as pending with a judgment date that had already shifted three times, was decided
-- on schedule on 15 July 2026 -- dismissed, but with an appeal to the Court of Appeal already
-- announced. Corroborated across 7 independent Kenyan outlets (The Star, Tuko x2, Kenyans.co.ke,
-- People Daily, Nairobi Wire, Court Helicopter).
-- Also flagging, with explicit hedging, an unverified lead: both the signals pipeline and
-- cc_jurisdiction_briefings independently point to PPB-linked cannabis export-licensing activity
-- that four rounds of web search (general, targeted, site:parliament.go.ke, PPB-specific) could
-- not independently corroborate. PPB itself is real and does have a general controlled-substances
-- export-permitting mandate; no cannabis-specific initiative was confirmed. Surfaced, not asserted.

INSERT INTO public.source_registry
  (source_name, source_url, source_type, tier, country, iso, region, adapter, crawl_cadence, relevance_status, crawl_allowed, is_active, notes)
VALUES
  ('The Star (Kenya) -- Court upholds ban on bhang, urges future debate',
   'https://www.the-star.co.ke/news/2026-07-15-court-upholds-ban-on-bhang-urges-future-debate',
   'news', 1, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   '15-Jul-2026 High Court dismissal of the Rastafari Society of Kenya petition; judge''s obiter call for a national cannabis-policy conversation'),
  ('Tuko.co.ke -- Rastafarian Society Rejects Ruling on Bhang, Heads to Court of Appeal',
   'https://www.tuko.co.ke/kenya/632762-rastafarian-society-rejects-ruling-bhang-heads-court-appeal-fight/',
   'news', 2, 'Kenya', 'KE', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   'Confirms notice of appeal to the Court of Appeal filed by petitioners'' counsel Shadrach Wambui')
ON CONFLICT (source_url) DO NOTHING;

UPDATE public.jurisdiction_playbooks
SET
  legal_framework_summary = replace(
    legal_framework_summary,
    'The case has been repeatedly adjourned -- judgment dates were successively set for 12 March, then 27/28 May, and as of the most recent reporting located (early July 2026) had shifted again to 15 July 2026 -- with no ruling found as of this review; this is a live, closely watched, genuinely unresolved case, and even a favorable outcome would establish only a narrow religious-worship exemption, not broad legalization.',
    'The case was decided on 15 July 2026: Justice Bahati Mwamuye dismissed the petition, finding the evidence on the centrality of cannabis to Rastafarian worship "inconsistent" and insufficient to establish it as an essential element of the faith, and separately noting the petitioners had not exhausted available legal and administrative mechanisms before invoking the court''s constitutional jurisdiction. The Narcotic Drugs and Psychotropic Substances (Control) Act was upheld as constitutional, with no religious exemption created. Notably, while ruling against the petition, Mwamuye added that cannabis use "is not a question for the Rastafarian community only" -- observing that cannabinoid products are already sold openly in mainstream Kenyan shops and supermarkets and that Kenya needs a "full and frank conversation" on cannabis policy, while stressing that any such change is a matter for the legislature and executive, not the courts. The petitioners'' counsel announced a notice of appeal to the Court of Appeal within days of the ruling, so this is not yet fully final.'
  ),
  common_pitfalls = ARRAY[
    'Assuming the 1994 Act''s nominal medical/scientific use provision means a functioning medical cannabis program exists -- no operational licensing pathway for that carve-out was identified in available sources; treat Kenya as fully prohibited in practice',
    'Treating the Rastafari Society of Kenya case as resolved -- the High Court dismissed it on 15 July 2026, but petitioners have already filed notice of appeal to the Court of Appeal, so the litigation is ongoing at a higher level; even had it succeeded, it would only ever have established a narrow religious-worship exemption, not commercial or general recreational legality',
    'Citing pre-2022 penalty figures (minimum 10-year terms, life imprisonment for dealing) as current law -- the 2022 amendment introduced materially lower, quantity-tiered penalties specifically for personal-use possession; confirm which offense category and which version of the law applies before relying on any single penalty figure',
    'Treating unconfirmed leads on Kenyan cannabis export-licensing activity as settled fact -- both an internal signal and a separately-sourced briefing point to Pharmacy and Poisons Board (PPB, Kenya''s real drug regulatory authority)-linked export-framework discussion, but four rounds of web search found no independently verifiable, citable initiative; treat as an open item to verify directly with PPB or NACADA rather than as confirmed policy'
  ],
  confidence_label = 'high on the core prohibition status and the 2022 penalty-tier amendment (corroborated across Herb''s April 2026 reporting, Leafwell, Wikipedia, and NACADA''s own public statements); high on the Rastafari Society case outcome, corroborated across seven independent Kenyan outlets (The Star, Tuko, Kenyans.co.ke, People Daily, Nairobi Wire, Court Helicopter) reporting the same 15 July 2026 dismissal and the subsequent notice of appeal; low/unconfirmed on a possible PPB-linked cannabis export-licensing initiative, flagged via two independent internal sources but not independently verifiable as of this review',
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.the-star.co.ke/news/2026-07-15-court-upholds-ban-on-bhang-urges-future-debate'),
  last_reviewed = CURRENT_DATE,
  last_verified_at = now(),
  updated_at = now()
WHERE country_iso2 = 'KE';
