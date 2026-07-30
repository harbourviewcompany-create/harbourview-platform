-- Reconciliation: migration applied live via Supabase MCP on 20260726121827 but never committed to supabase/migrations/. Caught by .github/workflows/migration-drift-check.yml. Committing verbatim (exact SQL from supabase_migrations.schema_migrations.statements) to close the drift. Not re-applying anything -- this file documents SQL that is already live.

-- Third deal-data tranche: all 3 Australian operators now covered. The LGP/Cannatrek merger is
-- the standout -- extremely current (implemented 1-Jun-2026, weeks before this review) and
-- corroborated across 8+ independent sources including Federal Court approval confirmation.
-- Cann Group's follow-on offering is logged at lower confidence ('reported') from a single
-- aggregator source with imprecise dating -- flagged honestly rather than presented as precise.

INSERT INTO public.deal_ma_transactions
  (acquirer_operator_id, acquirer_name, target_operator_id, target_name, transaction_type,
   country_iso2, deal_value_usd, consideration_type, announced_date, closed_date, deal_status,
   source_name, source_url, confidence, notes)
VALUES (
  'a2000002-0000-0000-0000-000000000002', 'Little Green Pharma Ltd',
  'a2000002-0000-0000-0000-000000000001', 'Cannatrek Limited',
  'reverse_merger', 'AU', NULL, 'stock',
  '2026-01-14', '2026-06-01', 'closed',
  'Business News Australia; Federal Court of Australia scheme approval (25-May-2026)',
  'https://www.businessnewsaustralia.com/articles/cannatrek-in-reverse-takeover-of-little-green-pharma-to-tackle-surging-european-medicinal-cannabis-market.html',
  'confirmed',
  'Legally structured as LGP acquiring 100% of Cannatrek via scheme of arrangement (1.84 LGP shares per Cannatrek share, plus contingent value shares), but substantively a reverse takeover: Cannatrek shareholders ended up with 60.5% of the combined group (up to 68.2% under contingent terms) versus 39.5% for existing LGP holders. Federal Court approved the scheme 25 May 2026; implementation completed 1 June 2026. Creates one of the largest vertically integrated medicinal cannabis groups globally -- combined pro-forma 2025 revenue ~$112M, EBITDA ~$13M, net assets >$136.7M. No clean single USD deal-value figure exists since this was a nil-cash share exchange; left null rather than estimated from a specific-date market cap.'
);

INSERT INTO public.deal_capital_raises
  (company_operator_id, company_name, country_iso2, round_type, amount_usd, amount_currency,
   announced_date, closed_date, deal_status, use_of_proceeds, source_name, source_url, confidence, notes)
VALUES
(
  'a2000002-0000-0000-0000-000000000001', 'Cannatrek Limited', 'AU',
  'private_placement', 9000000, 'AUD',
  '2022-06-01', '2022-06-01', 'closed',
  'Growth capital ahead of a planned (later shelved in favor of the 2026 LGP merger) ASX listing',
  'Business News Australia; CB Insights company profile',
  'https://www.businessnewsaustralia.com/articles/cannatrek-in-reverse-takeover-of-little-green-pharma-to-tackle-surging-european-medicinal-cannabis-market.html',
  'reported',
  'Original reported figure is AUD 13 million, led by River Capital; USD amount is an approximate conversion at a representative 2022 AUD/USD rate (~0.69), not a directly reported USD figure. Only the year (2022) was confirmed in sourcing -- the specific date shown is a placeholder, not a sourced announcement date.'
),
(
  'a2000002-0000-0000-0000-000000000003', 'Cann Group Limited', 'AU',
  'public_offering', 1600000, 'AUD',
  '2026-06-01', NULL, 'closed',
  'General working capital (ASX follow-on ordinary equity offering)',
  'Simply Wall St (ASX:CAN stock analysis page)',
  'https://simplywall.st/stocks/au/pharmaceuticals-biotech/asx-can/cann-group-shares',
  'reported',
  'Original reported figure is AUD 2.5 million (217,391,304 ordinary shares at AUD 0.0115, with an AUD 0.00069 per-security discount). Sourced from a single financial-data aggregator rather than a company filing or press release; the specific announcement date could not be clearly isolated from surrounding FY2025-results context in the source, so the date shown is an approximate placeholder within the confirmed reporting window, not a verified announcement date.'
);
