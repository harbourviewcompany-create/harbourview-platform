-- Retroactive reconciliation: applied directly to production via Supabase MCP on 20260726003138.\n-- Committed here per the migration-drift protocol to keep supabase/migrations/ in sync with\n-- supabase_migrations.schema_migrations. Statement below is the exact DDL/DML that was executed.\n\n-- Second deal-data tranche: Israeli operators already in cannabis_operators (Inter Cannabis
-- Ltd / IMC, Tikun Olam Ltd). All sourced to SEC 6-K filings or named-outlet reporting (Haaretz,
-- Globes, PRNewswire). The Kadimastem transaction is logged as 'terminated', not completed --
-- verified directly: Kadimastem's merger actually closed 30-Oct-2025 with a different company
-- entirely (NLS Pharmaceutics, forming NewcelX Ltd), meaning the Feb-2024 IMC proposal was
-- abandoned/superseded. Logging it accurately as a real but unconsummated proposal, not a
-- completed deal for IMC.

INSERT INTO public.deal_ma_transactions
  (acquirer_operator_id, acquirer_name, target_operator_id, target_name, transaction_type,
   country_iso2, deal_value_usd, consideration_type, announced_date, closed_date, deal_status,
   source_name, source_url, confidence, notes)
VALUES
(
  'a3000003-0000-0000-0000-000000000001', 'IM Cannabis Corp (via IMC Holdings Ltd, Israeli subsidiary)',
  NULL, 'R.A. Yarok Pharm Ltd (Pharm Yarok), Rosen High Way Ltd, and High Way Shinua Ltd',
  'acquisition', 'IL', 4600000, 'cash',
  '2021-07-28', '2021-07-28', 'closed',
  'IM Cannabis Corp SEC Form 6-K',
  'https://www.sec.gov/Archives/edgar/data/1792030/000106299321006798/exhibit99-1.htm',
  'confirmed',
  'Three simultaneous acquisitions accelerating IMC''s vertical integration into Israeli retail: a leading medical cannabis pharmacy (Pharm Yarok), a cannabis distribution/logistics center (Rosen High Way), and a transportation-license applicant (HW Shinua). Aggregate consideration ~$4.6M, of which $1.3M was invested back into IMC equity by the sellers.'
),
(
  'a3000003-0000-0000-0000-000000000001', 'IM Cannabis Corp (via IMC Holdings Ltd, Israeli subsidiary)',
  NULL, 'Oranim Pharm partnership (51% interest)',
  'majority_stake', 'IL', NULL, 'undisclosed',
  '2022-03-30', '2022-03-30', 'closed',
  'IM Cannabis Corp SEC Form 6-K',
  'https://www.sec.gov/Archives/edgar/data/1792030/000117891322001288/exhibit_99-1.htm',
  'confirmed',
  'Oranim Pharm was the largest medical cannabis pharmacy in the Jerusalem area, with disclosed FY revenue of approximately $16.5M (12 months to Oct 2021) and positive EBITDA at acquisition -- deal value itself not disclosed in the filing.'
),
(
  NULL, 'Cannbit Pharmaceuticals (TASE-listed)',
  'a3000003-0000-0000-0000-000000000002', 'Tikun Olam Ltd (Israel operations)',
  'acquisition', 'IL', 41500000, 'cash',
  '2019-11-25', NULL, 'announced',
  'Haaretz -- In Israel''s Biggest Medical-cannabis Deal, Cannbit Buys Tikun Olam',
  'https://www.haaretz.com/israel-news/business/2019-11-26/ty-article/in-israels-biggest-medical-cannabis-deal-cannbit-buys-tikun-olam/0000017f-db05-dee4-a9ff-ff7703210000',
  'reported',
  'At the time Israel''s largest-ever medical cannabis merger: $23.5M cash upfront plus up to $18M contingent on the merged company reaching a 1 billion shekel (~$290M) market value within 5 years, plus a 5% stake and 3.2% sales royalty for Tikun Olam founder Tzachi Cohen. Deal followed Tikun Olam losing its cultivation license renewal after a court ruling against Cohen remaining a controlling shareholder. The merged entity (Tikun Olam-Cannbit Pharmaceuticals, TASE: TKUN) itself later merged with unrelated industrial businesses in 2023 as its cannabis operations declined (Globes) -- closed_date left null as no confirmation of final completion terms was located independent of the announcement.'
),
(
  'a3000003-0000-0000-0000-000000000001', 'IM Cannabis Corp',
  NULL, 'Kadimastem Ltd (proposed reverse merger, cannabis-to-biotech pivot)',
  'reverse_merger', 'IL', NULL, 'stock',
  '2024-02-28', NULL, 'terminated',
  'PRNewswire (IMC investor relations) -- IMC Announces Potential Reverse Merger with Kadimastem',
  'https://www.prnewswire.com/news-releases/imc-announces-potential-reverse-merger-with-kadimastem-a-leading-clinical-cell-therapy-company-302074148.html',
  'confirmed',
  'Non-binding proposal announced Feb 2024: IMC shareholders would hold 12% of a resulting biotech-focused entity, Kadimastem shareholders 88%, with IMC exiting the cannabis business entirely. This did not proceed -- independently verified that Kadimastem instead completed a merger with a different company, NLS Pharmaceutics (NASDAQ: NLSP), effective 30 October 2025, forming NewcelX Ltd (NASDAQ: NCEL). The IMC proposal is treated as abandoned/superseded, not completed; IM Cannabis Corp''s subsequent corporate status was not independently re-verified in this pass.'
);
