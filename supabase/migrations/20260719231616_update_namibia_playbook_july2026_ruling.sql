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
-- version 20260719231616.
--
-- Rewriting this file cannot affect production: 20260719231616 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Namibia playbook update: the GUN/RUF constitutional challenge I flagged in batch 11 as
-- "unresolved, no outcome located" was in fact decided on 11 July 2026 -- after my original
-- research (11 Jul 2026) but discoverable now. Windhoek High Court dismissed the case on
-- prematurity grounds (deferring to the LRDC review), not on the constitutional merits.
-- Surfaced while cross-checking cc_jurisdiction_briefings, which is being corrected separately.

INSERT INTO public.source_registry
  (source_name, source_url, source_type, tier, country, iso, region, adapter, crawl_cadence, relevance_status, crawl_allowed, is_active, notes)
VALUES
  ('The Namibian -- Attempt to legalise cannabis fails in High Court',
   'https://www.namibian.com.na/attempt-to-legalise-cannabis-fails-in-high-court/',
   'news', 1, 'Namibia', 'NA', 'Africa', 'html_snapshot', 'weekly', 'active', true, true,
   '11-Jul-2026 Windhoek High Court ruling: special plea upheld, GUN/RUF case dismissed on prematurity grounds, deferred to LRDC review')
ON CONFLICT (source_url) DO NOTHING;

UPDATE public.jurisdiction_playbooks
SET
  legal_framework_summary = replace(
    legal_framework_summary,
    'a special-plea hearing on that jurisdictional question was scheduled for 5-8 May 2026, and no publicly reported outcome had been located as of this review -- this is a genuinely unresolved, live case rather than a settled one.',
    'that special plea was heard and, on 11 July 2026, upheld by the Windhoek High Court: Judge Claudia Claasen ruled the cannabis dispute is "polycentric" (implicating public health policy, law enforcement, and broader social policy) and that judicial intervention ahead of the LRDC''s ongoing review would risk trespassing into the legislature''s function, dismissing the case on prematurity grounds without ruling on the constitutional merits. This closes the judicial avenue for now -- the LRDC review is the sole remaining active reform channel, with no public timeline for its conclusion.'
  ),
  common_pitfalls = ARRAY[
    'Assuming the July 2026 dismissal of the GUN/RUF case or the June 2025 advocacy submission to the Ministry of Justice signals imminent legal change -- the court dismissed on procedural (prematurity) grounds without addressing the constitutional merits, and the government has consistently resisted judicial intervention, treating reform as a legislative/LRDC matter with no published timeline',
    'Treating any single cited penalty figure (fine amount or maximum sentence) as authoritative -- available sources conflict materially on both dimensions (N$200,000 vs. N$500,000; 20 years vs. 40 years); confirm the specific statute and offense category with Namibian counsel before relying on any number',
    'Assuming CBD or hemp-derived products carry any distinct legal status in Namibia -- no such carve-out exists; CBD is treated as illegal by extension of the general cannabis prohibition'
  ],
  confidence_label = 'high on the core prohibition status (corroborated across Wikipedia, Leafwell, Accomplit, and The Namibian''s ongoing court coverage) and on the litigation outcome (the Windhoek High Court''s 11 July 2026 dismissal of the GUN/RUF case on prematurity grounds is directly reported by The Namibian); medium on specific penalty figures, which conflict materially across sources; the LRDC review''s timeline and ultimate direction remain genuinely open',
  source_id = (SELECT id FROM public.source_registry WHERE source_url = 'https://www.namibian.com.na/attempt-to-legalise-cannabis-fails-in-high-court/'),
  last_reviewed = CURRENT_DATE,
  last_verified_at = now(),
  updated_at = now()
WHERE country_iso2 = 'NA';
