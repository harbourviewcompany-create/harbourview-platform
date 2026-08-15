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
-- version 20260719092904.
--
-- Rewriting this file cannot affect production: 20260719092904 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- First real population of the deal/capital tables (previously 0 rows across the board).
-- Every figure below is sourced to an SEC filing or the company's own investor-relations
-- press release -- the highest-confidence tier available for corporate financial data.
-- Scoped to operators already in cannabis_operators (Curaleaf International, Canopy Growth)
-- plus the two other parties (Tilray/Aphria) where the deal itself is the notable fact.
-- This is a first tranche, not exhaustive -- flagged as such in the closing summary.

INSERT INTO public.deal_ma_transactions
  (acquirer_operator_id, acquirer_name, target_operator_id, target_name, transaction_type,
   country_iso2, deal_value_usd, consideration_type, announced_date, closed_date, deal_status,
   source_name, source_url, confidence, notes)
VALUES
(
  NULL, 'Tilray, Inc.',
  NULL, 'Aphria Inc.',
  'merger', 'CA', 3381289000, 'stock',
  '2020-12-16', '2021-04-30', 'closed',
  'Tilray, Inc. SEC Form 8-K / DEFA14A merger proxy filings',
  'https://www.sec.gov/Archives/edgar/data/1731348/000119312521055831/d105344dex991.htm',
  'confirmed',
  'Structured as a plan of arrangement under the Business Corporations Act (Ontario); Tilray is the legal acquirer but the deal was accounted for as a reverse acquisition with Aphria as accounting acquirer. Deal value shown is the SEC-filed estimated purchase price ($3,381,289 thousand as of the Feb 3, 2021 measurement date) -- the filing itself notes this figure moves with Aphria''s share price; press coverage commonly cites the deal as "~$3.9 billion." The combined company (renamed Tilray, Nasdaq: TLRY) had a market cap of approximately $8.2 billion at close on April 30, 2021 -- a related but distinct figure from the purchase price.'
),
(
  NULL, 'Curaleaf Holdings, Inc.',
  NULL, 'EMMAC Life Sciences Limited',
  'acquisition', 'GB', 286000000, 'cash_and_stock',
  '2021-03-09', '2021-04-07', 'closed',
  'Curaleaf Holdings Investor Relations',
  'https://ir.curaleaf.com/2021-04-07-Curaleaf-Completes-Acquisition-of-EMMAC-and-Secures-US-130-Million-Investment-from-a-Single-Strategic-Institutional-Investor',
  'confirmed',
  'Base consideration of ~US$286M (85% Curaleaf subordinate voting shares, 15% cash), with up to an additional US$57M in contingent consideration tied to performance milestones (total deal commonly cited at up to $343M). Curaleaf''s first UK/EU transaction; EMMAC was Europe''s largest vertically integrated independent cannabis company, with cultivation in Portugal and a distribution presence across the UK, Germany, Italy, Spain and Portugal. The combined entity now operates as Curaleaf International Holdings Ltd (see cannabis_operators, GB) -- EMMAC as a standalone legal entity no longer exists.'
);

INSERT INTO public.deal_capital_raises
  (company_operator_id, company_name, country_iso2, round_type, amount_usd, amount_currency,
   announced_date, closed_date, deal_status, use_of_proceeds, source_name, source_url, confidence, notes)
VALUES
(
  'a6000006-0000-0000-0000-000000000001', 'Curaleaf International Holdings Ltd', 'GB',
  'private_placement', 130000000, 'USD',
  '2021-04-07', '2021-04-07', 'closed',
  'Fund Curaleaf International''s European expansion and rollout, including funding the cash portion of the EMMAC acquisition',
  'Curaleaf Holdings Investor Relations',
  'https://ir.curaleaf.com/2021-04-07-Curaleaf-Completes-Acquisition-of-EMMAC-and-Secures-US-130-Million-Investment-from-a-Single-Strategic-Institutional-Investor',
  'confirmed',
  'Single (unnamed in source) strategic institutional investor took a 31.5% equity stake in the newly formed Curaleaf International Holdings Limited, implying a ~$413M post-money valuation. Closed simultaneously with the EMMAC acquisition.'
),
(
  NULL, 'Canopy Growth Corporation', 'CA',
  'convertible_note', 50000000, 'USD',
  '2024-05-02', NULL, 'announced',
  'Balance sheet strengthening; C$27.5M of existing debt (maturing Sept 2025) exchanged into a new senior unsecured convertible debenture maturing 2029',
  'Canopy Growth Corp SEC Form 8-K',
  'https://www.sec.gov/Archives/edgar/data/1737927/000110465924057446/tm2413548d1_ex99-1.htm',
  'confirmed',
  'Single unnamed institutional investor; investor also received 3.35M common share purchase warrants (5-year term, CAD $16.18 strike). closed_date left null -- the 8-K describes proceeds as "expected," and no separate closing confirmation was located.'
),
(
  NULL, 'Canopy Growth Corporation', 'CA',
  'debt', 150000000, 'USD',
  '2026-01-08', '2026-01-08', 'closed',
  'Retire ~US$101M of existing senior secured debt due September 2027; working capital and general corporate purposes; tied to the pending MTL Cannabis acquisition',
  'Canopy Growth Corporation Investor Relations',
  'https://canopygrowth.com/investors/news-releases/canopy-growth-announces-strategic-recapitalization-transactions/',
  'confirmed',
  'New senior secured term loan led by JGB Management Inc., maturing January 2031, priced at Term SOFR + 6.25% (3.25% floor). Part of a broader recapitalization pushing Canopy''s debt maturities out to 2031. Described in the source as "finalized" on this date.'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.deal_investors (name, investor_type, hq_country_iso2, focus_areas, website, notes, source_name, source_url)
VALUES (
  'JGB Management Inc.', 'institutional', 'US',
  ARRAY['private_credit', 'structured_finance'],
  NULL,
  'Led the lender consortium on Canopy Growth''s January 2026 US$150M senior secured term loan.',
  'Canopy Growth Corporation Investor Relations',
  'https://canopygrowth.com/investors/news-releases/canopy-growth-announces-strategic-recapitalization-transactions/'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.deal_participants (capital_raise_id, investor_id, investor_name, role)
SELECT
  (SELECT id FROM public.deal_capital_raises WHERE company_name = 'Canopy Growth Corporation' AND announced_date = '2026-01-08'),
  (SELECT id FROM public.deal_investors WHERE name = 'JGB Management Inc.'),
  'JGB Management Inc.', 'lead'
WHERE EXISTS (SELECT 1 FROM public.deal_capital_raises WHERE company_name = 'Canopy Growth Corporation' AND announced_date = '2026-01-08')
  AND EXISTS (SELECT 1 FROM public.deal_investors WHERE name = 'JGB Management Inc.');
