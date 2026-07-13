// Static intelligence data keyed by corridor "From→To" string

export type CorridorBanking = {
  summary:   string
  providers: string[]
  fxRisk:    string
}

export type CorridorAuthority = {
  team:   string
  email:  string
  queue:  string
  notes:  string
}

export type CorridorCostData = {
  permitFee:      string
  labCostBatch:   string
  logisticsPerKg: string
  fxExposure:     string
  gmpAudit:       string
  notes:          string
}

export const CORRIDOR_BANKING: Record<string, CorridorBanking> = {
  'Netherlands→Germany': {
    summary:   'Standard SEPA EUR wire transfers. Well-established B2B pharmaceutical banking lane. Both exporter and importer sides have functional cannabis-licensed accounts at major Dutch and German banks.',
    providers: ['Rabobank (NL — cooperative, cannabis-friendly)', 'ING Netherlands', 'Hypovereinsbank (DE)', 'DZ Bank (DE cooperative)', 'Triodos Bank (ethical banking)'],
    fxRisk:    'None — EUR/EUR. No FX exposure.',
  },
  'Canada→Germany': {
    summary:   'Royal Bank of Canada (RBC) and BMO Financial Group have established cannabis export banking for EU-bound licensed producers. German importer side typically uses Hypovereinsbank or Commerzbank specialist pharmaceutical accounts. FX exposure on CAD/EUR; hedge instruments advisable for contracts >CAD 200,000.',
    providers: ['Royal Bank of Canada', 'Bank of Montreal (BMO)', 'TD Bank (cannabis-licensed)', 'Hypovereinsbank (DE)', 'Commerzbank (DE)', 'Currency hedging: Convera, Moneycorp'],
    fxRisk:    'Moderate — CAD/EUR. Hedge >CAD 100k contracts.',
  },
  'Canada→United Kingdom': {
    summary:   'RBC and TD Bank established for Health Canada-licensed producers. UK side: ClearBank and Equals Money are leading cannabis-friendly banking providers post-Brexit. GBP/CAD FX exposure; hedge instruments recommended for supply agreements >6 months.',
    providers: ['Royal Bank of Canada', 'TD Bank', 'ClearBank (UK — cannabis-friendly)', 'Equals Money (UK FX)', 'OFX for FX conversion'],
    fxRisk:    'Moderate — CAD/GBP. GBP volatility adds exposure for long-term supply agreements.',
  },
  'Portugal→Germany / EU': {
    summary:   'Fully SEPA-integrated EUR corridor. Portuguese banks BPI and Millennium BCP handle pharmaceutical-grade export transactions for licensed operators. No FX exposure; standard EU wire.',
    providers: ['BPI (Banco Português de Investimento)', 'Millennium BCP', 'Caixa Geral de Depósitos', 'Hypovereinsbank (DE)', 'DZ Bank (DE)'],
    fxRisk:    'None — EUR/EUR.',
  },
  'Australia→Global': {
    summary:   'ANZ and National Australia Bank (NAB) have established cannabis export frameworks for TGA-licensed operators. AUD-to-destination FX via major banks; well-documented and functional for licensed exporters.',
    providers: ['ANZ (cannabis export programme)', 'National Australia Bank (NAB)', 'Westpac (pharmaceutical division)', 'Convera for international FX'],
    fxRisk:    'Varies by destination — AUD exposure; hedge for contracts >AUD 150k.',
  },
  'Germany→EU Distribution': {
    summary:   'Fully SEPA EUR corridor. German wholesale distributors use standard pharmaceutical banking. DZ Bank, Hypovereinsbank, Commerzbank pharmaceutical divisions are all functional. No FX exposure.',
    providers: ['DZ Bank', 'Hypovereinsbank', 'Commerzbank pharmaceutical division', 'Apobank (pharmacy-focused)'],
    fxRisk:    'None — EUR/EUR.',
  },
  'Netherlands→United Kingdom': {
    summary:   'Post-Brexit EUR/GBP corridor. Dutch exporter side straightforward (Rabobank, ING). UK importer side: ClearBank and Equals Money are most reliable cannabis-licensed UK banks. GBP/EUR FX requires hedging for multi-shipment contracts.',
    providers: ['Rabobank (NL)', 'ING Netherlands', 'ClearBank (UK)', 'Equals Money (UK)', 'Moneycorp (FX)'],
    fxRisk:    'Moderate — EUR/GBP. Brexit-era volatility; hedge for contracts >€100k.',
  },
  'Canada→Australia': {
    summary:   'Trans-Pacific CAD/AUD corridor. RBC, BMO on Canadian side; ANZ, NAB on Australian side. Both jurisdictions have functional licensed-producer banking. FX via major bank platforms or specialist FX providers.',
    providers: ['Royal Bank of Canada', 'ANZ Australia', 'National Australia Bank', 'OFX (FX specialist)', 'Convera'],
    fxRisk:    'Moderate — CAD/AUD. Both commodity-linked currencies; correlated volatility.',
  },
  'Canada→France': {
    summary:   'CAD/EUR corridor. Canadian side: RBC, BMO, TD. French side: BNP Paribas and Société Générale pharmaceutical divisions. Some French bank cannabis sensitivity; ANSM-licensed French importers report BNP as most reliable. EUR/CAD hedging advisable.',
    providers: ['Royal Bank of Canada', 'BNP Paribas (FR pharmaceutical)', 'Société Générale', 'Crédit Agricole', 'Convera for FX'],
    fxRisk:    'Moderate — CAD/EUR. Hedge for contracts >CAD 150k.',
  },
  'Canada→Israel': {
    summary:   'CAD/ILS corridor. Bank Hapoalim and Bank Leumi have established IMCA-licensed operator banking. SWIFT USD as intermediary is common. ILS/USD/CAD FX chain adds 2–3% in conversion costs on round-trip transactions.',
    providers: ['Bank Hapoalim (IL)', 'Bank Leumi (IL)', 'Royal Bank of Canada', 'TD Bank', 'SWIFT USD intermediary standard'],
    fxRisk:    'Moderate-High — CAD/ILS via USD. Multi-leg FX conversion; currency risk and conversion costs accumulate.',
  },
  'Colombia→EU / LATAM': {
    summary:   'USD/EUR conversion required. COP highly volatile (depreciated 12% vs EUR in 2026). Bancolombia and Davivienda handle INVIMA-licensed export transactions. EU side: EUR-denominated accounts standard. Harbourview recommends USD or EUR contract denomination; avoid COP for EU supply agreements.',
    providers: ['Bancolombia', 'Davivienda', 'Banco de Bogotá', 'USD intermediary for EU conversion', 'Corpbanca'],
    fxRisk:    'High — COP/EUR. COP highly volatile; USD denomination strongly recommended for all EU supply contracts.',
  },
  'Colombia→United Kingdom': {
    summary:   'COP/GBP corridor. Same Colombian banking as EU route. UK side: ClearBank, Equals Money. Additional GBP/USD conversion step. Three-leg FX (COP→USD→GBP) standard; cost 3–5% on each transaction.',
    providers: ['Bancolombia', 'Davivienda', 'ClearBank (UK)', 'Equals Money', 'Moneycorp for FX'],
    fxRisk:    'High — COP/GBP. Three-leg FX conversion; significant cost and volatility exposure.',
  },
  'Israel→Germany / EU': {
    summary:   'ILS/EUR corridor. Bank Hapoalim, Bank Leumi functional for IMCA-licensed operators. SWIFT EUR via correspondent banking. Some EU bank sensitivity to Israeli counterparties; German pharmaceutical importers typically use DZ Bank or Hypovereinsbank which have established Israeli correspondent relationships.',
    providers: ['Bank Hapoalim', 'Bank Leumi', 'Mizrahi Tefahot Bank', 'Hypovereinsbank (DE — Israeli correspondent)', 'DZ Bank (DE)'],
    fxRisk:    'Low-Moderate — ILS/EUR. ILS relatively stable vs EUR historically.',
  },
  'South Africa→Germany / EU': {
    summary:   'ZAR/EUR corridor. SARB (South African Reserve Bank) exchange controls require prior approval for cannabis export proceeds repatriation. Standard Bank and Nedbank handle licensed cannabis transactions. USD intermediary common. Currency controls add 2–3 week approval window per transaction.',
    providers: ['Standard Bank SA', 'Nedbank', 'First National Bank SA', 'SARB prior approval required', 'USD intermediary standard'],
    fxRisk:    'High — ZAR/EUR. ZAR historically volatile; SARB controls add friction and delays.',
  },
  'Zimbabwe→EU / UK': {
    summary:   'USD-only corridor (ZWL not accepted internationally). Significant correspondent banking constraints. CABS, FBC Bank handle cannabis export transactions in USD. EU/UK receivers need USD accounts or conversion. Payment delays of 2–4 weeks common due to correspondent bank de-risking of Zimbabwe.',
    providers: ['CABS Zimbabwe', 'FBC Bank', 'USD correspondent banking only', 'Stanbic Zimbabwe'],
    fxRisk:    'Very High — USD/EUR or USD/GBP. USD mandatory; Zimbabwe banking instability causes payment delays.',
  },
  'Lesotho→EU': {
    summary:   'LSL/ZAR/EUR multi-leg corridor. Lesotho banking infrastructure limited; transactions typically processed via South African correspondent banks. Standard Bank Lesotho primary. SARB exchange controls apply when routing via RSA. Expect 3–5 week payment cycles.',
    providers: ['Standard Bank Lesotho', 'Nedbank Lesotho', 'ZAR correspondent via RSA (SARB controls apply)', 'USD intermediary for EU conversion'],
    fxRisk:    'High — LSL/ZAR/EUR multi-leg. SARB controls add delays; USD intermediary adds cost.',
  },
  'Rwanda→EU / Africa': {
    summary:   'RWF/USD/EUR corridor. Bank of Kigali and Equity Bank Rwanda handle cannabis-sector export transactions. USD intermediary standard. RDB export permits required before payment can be initiated. 2–4 week payment cycles typical.',
    providers: ['Bank of Kigali', 'Equity Bank Rwanda', 'USD intermediary for EU conversion', 'I&M Bank Rwanda'],
    fxRisk:    'Moderate-High — RWF/USD/EUR. RWF relatively stable but USD intermediary adds conversion cost.',
  },
  'Morocco→EU': {
    summary:   'MAD/EUR corridor. Attijariwafa Bank and Banque Centrale Populaire handle agricultural export transactions including hemp. MAD partially convertible; Bank Al-Maghrib approval required for large transactions. Hemp/CBD transactions generally smoother than controlled substance routes.',
    providers: ['Attijariwafa Bank', 'Banque Centrale Populaire', 'BMCE Bank (Bank of Africa)', 'USD/EUR intermediary'],
    fxRisk:    'Low-Moderate — MAD/EUR. MAD managed against EUR/USD basket; relatively stable.',
  },
  'Jamaica→North America / EU': {
    summary:   'JMD/USD/EUR corridor. National Commercial Bank Jamaica and Scotiabank Jamaica handle CLA-licensed transactions. US banking highly restricted for any cannabis-touching transaction; even hemp-adjacent products face de-risking. EU route more viable via SWIFT USD intermediary.',
    providers: ['National Commercial Bank Jamaica', 'Scotiabank Jamaica', 'USD SWIFT intermediary (EU route only)', 'Sagicor Bank Jamaica'],
    fxRisk:    'Moderate — JMD/USD/EUR. US banking de-risking is primary risk, not FX per se.',
  },
  'Uruguay→EU': {
    summary:   'UYU/USD/EUR corridor. Banco República (BROU) handles IRCCA-authorised export transactions. USD intermediary standard for EU payments. Banking for Uruguay cannabis is functional but low-volume given state-supply model; BROU experienced with the framework.',
    providers: ['Banco República (BROU)', 'Banco Itaú Uruguay', 'USD intermediary standard', 'BROU trade finance division'],
    fxRisk:    'Moderate — UYU/USD/EUR. UYU stable; USD intermediary adds conversion cost.',
  },
  'Mexico→United States': {
    summary:   'MXN/USD corridor. Banamex, BBVA Mexico handle COFEPRIS-licensed hemp/CBD export transactions. US banking: de-risking extreme for any cannabis-adjacent product; even hemp importers face account closure risk at major US banks. Cannabis-friendly US banking: Safe Harbor Private Banking (CO), Numerica Credit Union.',
    providers: ['BBVA Mexico', 'Banamex', 'Banorte', 'Safe Harbor Private Banking (US)', 'Numerica Credit Union (US)', 'Hypur for cannabis payments (US)'],
    fxRisk:    'Low — MXN/USD. MXN relatively stable; USD conversion straightforward.',
  },
  'Brazil→EU': {
    summary:   'BRL/USD/EUR corridor. Bradesco and Itaú handle ANVISA-licensed pharmaceutical export transactions. Brazil central bank (BCB) requires prior registration of export contracts. USD as intermediary standard for EU payments. Brazilian banking generally functional for pharmaceutical exports.',
    providers: ['Bradesco', 'Itaú Unibanco', 'Banco do Brasil', 'BCB prior contract registration required', 'USD intermediary standard'],
    fxRisk:    'Moderate-High — BRL/USD/EUR. BRL historically volatile; hedge for contracts >USD 100k.',
  },
  'Thailand→Asia-Pacific': {
    summary:   'THB/USD corridor. Bangkok Bank and Kasikorn Bank handle FDA Thailand-licensed transactions. USD as intermediary for cross-border payments. Banking for cannabis export is functional but compliance scrutiny high given 2024 regulatory uncertainty. Transaction documentation must reference ONCB licence.',
    providers: ['Bangkok Bank', 'Kasikorn Bank (KBank)', 'SCB (Siam Commercial Bank)', 'USD intermediary for cross-border'],
    fxRisk:    'Low-Moderate — THB/USD. THB managed; moderate volatility.',
  },
  'New Zealand→Australia': {
    summary:   'NZD/AUD corridor. ANZ New Zealand and Westpac NZ handle Medsafe-licensed cannabis transactions. Trans-Tasman banking well-integrated; NZD/AUD FX tight and low-cost. Most efficient banking lane in Asia-Pacific cannabis trade.',
    providers: ['ANZ New Zealand', 'Westpac NZ', 'BNZ (Bank of New Zealand)', 'ANZ Australia (receiving)'],
    fxRisk:    'Low — NZD/AUD. Highly correlated currencies; minimal FX exposure.',
  },
  'United States→EU': {
    summary:   'USD/EUR corridor for hemp. US banking for hemp export: US Bank, Farm Bureau Bank handle USDA-licensed hemp transactions. EU side: standard EUR accounts at major EU banks. DEA export certificate required for payment release by some EU banks.',
    providers: ['US Bank (hemp division)', 'Farm Bureau Bank', 'BNP Paribas (EU)', 'Deutsche Bank (EU)', 'Standard USD/EUR SWIFT'],
    fxRisk:    'Low — USD/EUR. Standard USD/EUR conversion; liquid and low-cost.',
  },
  'Turkey→EU': {
    summary:   'TRY/EUR corridor for hemp. Ziraat Bank and Türkiye İş Bankası handle TEAB-certified agricultural export transactions. TRY highly volatile (50%+ depreciation 2022–2026); EUR-denominated contracts strongly recommended. Standard SWIFT EUR for EU payment.',
    providers: ['Ziraat Bank', 'Türkiye İş Bankası (İşbank)', 'Garanti BBVA', 'Standard SWIFT EUR for EU payment'],
    fxRisk:    'Very High — TRY/EUR. TRY has depreciated >50% against EUR since 2022. EUR denomination mandatory.',
  },
  'Lebanon→EU': {
    summary:   'LBP effectively non-convertible. USD cash transactions only; Lebanese banking in crisis. International payment routing via correspondent banks severely restricted. Creative financial structures required — escrow via Cyprus or UAE intermediaries used by some operators. Banking is the #1 operational barrier for this corridor.',
    providers: ['USD cash or escrow only', 'Cyprus intermediary accounts', 'UAE correspondent banking', 'BLC Bank Lebanon (limited international)', 'Audi Bank (limited)'],
    fxRisk:    'Extreme — LBP has lost >95% of value since 2019. USD-only denomination; Lebanese banking crisis is existential for this corridor.',
  },
  'Singapore→Asia-Pacific (Transit)': {
    summary:   'SGD/USD corridor for transit logistics fees. DBS Bank and OCBC handle Singapore logistics and transit service payments. No cannabis product payment flows through Singapore — transit only. Logistics service invoices (freight, handling) paid via standard SGD or USD wire.',
    providers: ['DBS Bank Singapore', 'OCBC Bank', 'UOB Singapore', 'Standard SGD/USD SWIFT for logistics fees only'],
    fxRisk:    'None — transit fees only; no product payment flows. SGD/USD highly stable.',
  },
  'Spain→EU': {
    summary:   'Fully SEPA EUR corridor. Santander and BBVA Spain have agricultural and pharmaceutical pharmaceutical export experience. Cannabis sensitivity exists at Spanish banks but AEMPS-licensed operators report functional accounts. Standard EUR SEPA transfers.',
    providers: ['Banco Santander', 'BBVA Spain', 'CaixaBank', 'Sabadell', 'Standard SEPA EUR'],
    fxRisk:    'None — EUR/EUR.',
  },
  'North Macedonia→EU': {
    summary:   'MKD/EUR corridor. Stopanska Banka and Komercijalna Banka handle pharmaceutical export transactions. MKD pegged to EUR (ERM-equivalent); minimal FX exposure. Some EU correspondent bank sensitivity to North Macedonia due to ongoing accession status.',
    providers: ['Stopanska Banka', 'Komercijalna Banka', 'NLB Bank Macedonia', 'EUR correspondent via Erste Group or Raiffeisen'],
    fxRisk:    'Very Low — MKD/EUR. MKD tightly pegged to EUR.',
  },
  'Greece→EU Distribution': {
    summary:   'Fully SEPA EUR corridor. Alpha Bank, Eurobank, and National Bank of Greece handle pharmaceutical export transactions. Greek banking is SEPA-integrated; no FX exposure. Cannabis licensing required for account maintenance but functional for EOF-licensed operators.',
    providers: ['Alpha Bank Greece', 'Eurobank', 'National Bank of Greece', 'Piraeus Bank', 'Standard SEPA EUR'],
    fxRisk:    'None — EUR/EUR.',
  },
  'Czech Republic→EU Distribution': {
    summary:   'CZK/EUR corridor. Komerční Banka and Česká Spořitelna handle SÚKL-licensed pharmaceutical export transactions. CZK/EUR FX exposure modest; Czech banks SEPA-capable. Standard EU pharmaceutical banking lane.',
    providers: ['Komerční Banka', 'Česká Spořitelna', 'ČSOB', 'EUR SEPA via Erste Bank'],
    fxRisk:    'Low — CZK/EUR. CZK tracks EUR closely; FX exposure minimal for standard shipment values.',
  },
  'Italy→EU Distribution': {
    summary:   'Fully SEPA EUR corridor. Intesa Sanpaolo and UniCredit have pharmaceutical export divisions. Cannabis licensing required; Italian state-supply history means commercial export banking is nascent but functional for private sector ISS-licensed operators.',
    providers: ['Intesa Sanpaolo', 'UniCredit Italy', 'Mediobanca', 'BancoBPM', 'Standard SEPA EUR'],
    fxRisk:    'None — EUR/EUR.',
  },
  'Poland→EU Distribution': {
    summary:   'PLN/EUR corridor. PKO Bank Polski and Pekao SA handle URPL-licensed pharmaceutical export transactions. PLN/EUR FX exposure manageable; EUR-denominated contracts recommended for larger shipments. Standard SEPA transfer for EUR receiving accounts.',
    providers: ['PKO Bank Polski', 'Pekao SA', 'mBank', 'EUR SEPA via BNP Paribas Poland', 'Santander Poland'],
    fxRisk:    'Low-Moderate — PLN/EUR. PLN relatively stable; EUR contracts recommended for multi-shipment supply agreements.',
  },
  'Portugal→United Kingdom': {
    summary:   'EUR/GBP corridor post-Brexit. Portuguese banking straightforward (Infarmed-licensed exporters at BPI, Millennium BCP). UK side: ClearBank and Equals Money most reliable for cannabis-adjacent medical imports. EUR/GBP FX exposure; hedge for contracts >€100k.',
    providers: ['BPI Portugal', 'Millennium BCP', 'ClearBank (UK)', 'Equals Money', 'Moneycorp FX'],
    fxRisk:    'Moderate — EUR/GBP post-Brexit. GBP volatility creates exposure; hedge for larger contracts.',
  },
  'Ecuador→EU': {
    summary:   'USD/EUR corridor. Banco Pichincha and Produbanco handle agricultural export transactions including cannabis derivatives. Ecuador fully dollarised (USD); no FX exposure on USD leg. EUR conversion via standard SWIFT at destination.',
    providers: ['Banco Pichincha', 'Produbanco', 'Banco Guayaquil', 'USD to EUR SWIFT conversion at destination'],
    fxRisk:    'Low — USD/EUR. Ecuador dollarised; only USD/EUR leg has exposure.',
  },
  'Peru→EU': {
    summary:   'PEN/USD/EUR corridor. BCP (Banco de Crédito del Perú) and Interbank handle pharmaceutical export transactions. DIGEMID approval required before international payment release. USD as intermediary standard. 2–3 week payment cycles expected.',
    providers: ['Banco de Crédito del Perú (BCP)', 'Interbank', 'BBVA Peru', 'USD intermediary for EU conversion'],
    fxRisk:    'Moderate — PEN/USD/EUR. PEN managed but volatile; USD intermediary adds conversion step.',
  },
  'Denmark→Germany / EU': {
    summary:   'DKK/EUR corridor. Jyske Bank and Nordea Denmark have pharmaceutical export experience. DKK closely pegged to EUR (ERM II); FX exposure minimal. Standard SEPA EUR transfers via Danish euro accounts.',
    providers: ['Nordea Denmark', 'Jyske Bank', 'Sydbank', 'Danske Bank', 'Standard SEPA EUR'],
    fxRisk:    'Very Low — DKK/EUR. DKK in ERM II; tightly pegged.',
  },
  'Malta→EU': {
    summary:   'Fully SEPA EUR corridor. Bank of Valletta and HSBC Malta handle MRA-licensed operator transactions. Malta fully EUR-integrated. Cannabis export banking nascent given framework age; Bank of Valletta is primary relationship bank for MRA-licensed operators.',
    providers: ['Bank of Valletta', 'HSBC Malta', 'APS Bank', 'Standard SEPA EUR'],
    fxRisk:    'None — EUR/EUR.',
  },
  'Switzerland→EU': {
    summary:   'CHF/EUR corridor. Zürcher Kantonalbank and Raiffeisen Switzerland handle Swissmedic-licensed transactions. CHF/EUR FX exposure present but manageable. Swiss banks generally cannabis-conservative but Swissmedic-licensed pharmaceutical operators have functional accounts.',
    providers: ['Zürcher Kantonalbank (ZKB)', 'Raiffeisen Switzerland', 'PostFinance', 'CHF/EUR FX via cantonal banks'],
    fxRisk:    'Low — CHF/EUR. CHF historically strong vs EUR; moderate appreciation risk for EUR-denominated contracts.',
  },
}

export const CORRIDOR_AUTHORITY: Record<string, CorridorAuthority> = {
  'Netherlands→Germany': {
    team:  'BfArM — Referat BT 4 (Betäubungsmittel / Narcotics)',
    email: 'betaeubungsmittel@bfarm.de',
    queue: 'Est. 8–12 weeks (July 2026)',
    notes: 'Applications sent by post or e-mail. Phone enquiries accepted Mon–Thu 8:00–16:00 CET. Reference import permit number in all correspondence.',
  },
  'Canada→Germany': {
    team:  'BfArM — Referat BT 4 + Health Canada Cannabis Regulation Division',
    email: 'betaeubungsmittel@bfarm.de · hc.cannabisinquiries.sc@canada.ca',
    queue: 'BfArM: 8–12 weeks. Health Canada export: 4–6 weeks. (July 2026)',
    notes: 'Two parallel permit processes. BfArM requires EU GMP certificate before permit issuance. Health Canada requires destination country import permit number before export permit issued.',
  },
  'Canada→United Kingdom': {
    team:  'MHRA — Controlled Drugs and Human Trafficking Unit',
    email: 'cdhu@mhra.gov.uk',
    queue: 'Est. 10–14 weeks (July 2026, digital portal)',
    notes: 'Digital applications via MHRA portal only from April 2026. Home Office authority required in parallel — apply simultaneously. Reference MHRA case number in all correspondence.',
  },
  'Portugal→Germany / EU': {
    team:  'Infarmed (PT) — Divisão de Fiscalização de Estupefacientes · BfArM — Referat BT 4 (DE)',
    email: 'estupefacientes@infarmed.pt · betaeubungsmittel@bfarm.de',
    queue: 'Infarmed export: 6–8 weeks. BfArM import: 8–12 weeks. (July 2026)',
    notes: 'Portuguese export and German import permits required simultaneously. Infarmed requires GACP certificate and facility inspection report before export permit issuance.',
  },
  'Denmark→Germany / EU': {
    team:  'DKMA — Narcotics Section · BfArM — Referat BT 4',
    email: 'narkotica@dkma.dk · betaeubungsmittel@bfarm.de',
    queue: 'DKMA: 4–6 weeks. BfArM: 8–12 weeks. (July 2026)',
    notes: 'DKMA export permit and BfArM import permit applied in parallel. Danish Medicines Agency responds to enquiries in Danish or English.',
  },
  'Australia→Global': {
    team:  'Office of Drug Control (ODC) — TGA, Department of Health',
    email: 'odc.info@tga.gov.au',
    queue: 'Est. 6–10 weeks standard (July 2026)',
    notes: 'ODC online portal for export permit applications. Separate application required for each shipment. Destination country import permit must be uploaded before ODC issues export permit.',
  },
  'Germany→EU Distribution': {
    team:  'BfArM — Referat BT 4 (Wholesale Distribution Authorisation)',
    email: 'betaeubungsmittel@bfarm.de',
    queue: 'Est. 4–8 weeks for new wholesale authorisations (July 2026)',
    notes: 'Wholesale distribution authorisation tied to facility GDP certification. BfArM requires GDP certificate and named Responsible Person before authorisation issued.',
  },
  'Netherlands→United Kingdom': {
    team:  'MHRA — Controlled Drugs and Human Trafficking Unit · CBG (Netherlands)',
    email: 'cdhu@mhra.gov.uk · info@cbg-meb.nl',
    queue: 'MHRA: 10–14 weeks. (July 2026)',
    notes: 'UK GMP recognition for EU facilities required before MHRA import licence issued. Separate UK GMP recognition process (4–8 months first-time) must complete before licence application.',
  },
  'Canada→Australia': {
    team:  'Office of Drug Control (ODC) · Health Canada Cannabis Regulation Division',
    email: 'odc.info@tga.gov.au · hc.cannabisinquiries.sc@canada.ca',
    queue: 'ODC: 6–10 weeks. Health Canada: 4–6 weeks. (July 2026)',
    notes: 'TGA GMP licence for Canadian facility required before ODC import permit. TGA manufacturing licence process: 4–8 months first-time. Apply TGA GMP before initiating ODC permit.',
  },
  'Canada→France': {
    team:  'ANSM — Division des stupéfiants et des psychotropes · Health Canada',
    email: 'cannabis-medical@ansm.sante.fr · hc.cannabisinquiries.sc@canada.ca',
    queue: 'ANSM: 12–16 weeks per product SKU. Health Canada: 4–6 weeks. (July 2026)',
    notes: 'ANSM product-level authorisation required per SKU. Submit product dossier (product monograph, COA batch data, packaging) with each application. ANSM responds in French.',
  },
  'Canada→Israel': {
    team:  'IMCA — Israeli Medical Cannabis Agency · Health Canada',
    email: 'imca@health.gov.il · hc.cannabisinquiries.sc@canada.ca',
    queue: 'IMCA: 6–10 weeks. Quota check advised before application. (July 2026)',
    notes: 'IMCA quarterly import quotas — confirm quota availability before investing in permit process. IMCA import permit valid for single shipment. Health Canada Export Permit required in parallel.',
  },
  'Israel→Germany / EU': {
    team:  'IMCA — Israeli Medical Cannabis Agency · BfArM — Referat BT 4',
    email: 'imca@health.gov.il · betaeubungsmittel@bfarm.de',
    queue: 'IMCA export: 8–12 weeks. BfArM: 8–12 weeks. Research pathway only until Q4 2026. (July 2026)',
    notes: 'Research protocol required for BfArM research-grade import. Academic or clinical institution must be named as end-user. IMC-GMP equivalency expected Q4 2026 — monitor EMA announcements.',
  },
  'Colombia→EU / LATAM': {
    team:  'INVIMA — Dirección de Medicamentos y Productos Biológicos',
    email: 'info@invima.gov.co',
    queue: 'INVIMA export cert: 4–8 weeks. (July 2026)',
    notes: 'INVIMA export certificate required before EU import permit application can proceed. INVIMA responds in Spanish. EU GMP audit must be in place before applying.',
  },
  'Colombia→United Kingdom': {
    team:  'MHRA — Controlled Drugs Unit · INVIMA',
    email: 'cdhu@mhra.gov.uk · info@invima.gov.co',
    queue: 'MHRA: 10–14 weeks. INVIMA: 4–8 weeks. (July 2026)',
    notes: 'UK GMP recognition for Colombian facility required before MHRA import licence. UK GMP recognition is separate from EU GMP; MHRA audit adds 4–8 months for first-time facilities.',
  },
  'South Africa→Germany / EU': {
    team:  'SAHPRA — Inspectorate Division (Narcotics) · BfArM — Referat BT 4',
    email: 'narcotics@sahpra.org.za · betaeubungsmittel@bfarm.de',
    queue: 'SAHPRA: 8–16 weeks. BfArM: 8–12 weeks. (July 2026)',
    notes: 'SAHPRA export permit requires EU GMP certificate for facility. SAHPRA inspections for export-eligible facilities: 4–6 months wait. Fee: ZAR 18,500 (revised Feb 2026).',
  },
  'Zimbabwe→EU / UK': {
    team:  'MCAZ — Medicines Control Authority of Zimbabwe · BfArM or MHRA',
    email: 'mcaz@mcaz.co.zw · betaeubungsmittel@bfarm.de or cdhu@mhra.gov.uk',
    queue: 'MCAZ: 8–16 weeks. EU/UK: 8–14 weeks. (July 2026)',
    notes: 'MCAZ framework established 2020. Limited processing capacity — follow up every 2 weeks after application. EU/UK import authority requires EU or UK GMP certificate for Zimbabwean facility.',
  },
  'Lesotho→EU': {
    team:  'Lesotho Ministry of Health — Pharmacy and Drug Regulation Division',
    email: 'pharmacy@health.gov.ls',
    queue: 'Est. 10–16 weeks (limited processing capacity) (July 2026)',
    notes: 'Small regulatory team; personal follow-up with Ministry contacts often required to advance applications. EU GMP certificate required for export permit. Route all logistics via South Africa.',
  },
  'Rwanda→EU / Africa': {
    team:  'RDB — Rwanda Development Board (Cannabis Licensing) · BfArM',
    email: 'info@rdb.rw · betaeubungsmittel@bfarm.de',
    queue: 'RDB: 8–14 weeks. EU import: 8–12 weeks. (July 2026)',
    notes: 'RDB is single point of contact for cannabis export licensing in Rwanda. Monthly licensing committee review — applications must arrive 2 weeks before committee date.',
  },
  'Morocco→EU': {
    team:  'ONICL — Office National Interprofessionnel des Céréales et des Légumineuses (hemp) · ONSSA (phytosanitary)',
    email: 'contact@onicl.org.ma · contact@onssa.gov.ma',
    queue: 'ONICL: 3–5 weeks for hemp. Medical THC framework: not yet established. (July 2026)',
    notes: 'Hemp/CBD export via ONICL and ONSSA. Medical THC export framework pending parliamentary approval — monitor legislative calendar. ONSSA phytosanitary certificate required for all plant-based exports.',
  },
  'Jamaica→North America / EU': {
    team:  'CLA — Cannabis Licensing Authority Jamaica',
    email: 'info@cla.gov.jm',
    queue: 'CLA export permit: 8–14 weeks. (July 2026)',
    notes: 'CLA online operator verification portal launched Oct 2025 — verify counterparty status before engaging. CLA permits valid for single shipment to specified destination.',
  },
  'Uruguay→EU': {
    team:  'IRCCA — Instituto de Regulación y Control del Cannabis',
    email: 'info@ircca.gub.uy',
    queue: 'IRCCA authorisation: 12–20 weeks. State-model volumes very limited. (July 2026)',
    notes: 'IRCCA authorisations only issued to state-licensed producers. Commercial private export not permitted under current Uruguayan model. Volumes tightly controlled by IRCCA board.',
  },
  'Mexico→United States': {
    team:  'COFEPRIS — Comisión Federal para la Protección contra Riesgos Sanitarios · FDA (US)',
    email: 'cofepris@cofepris.gob.mx · druginfo@fda.hhs.gov',
    queue: 'COFEPRIS export cert: 4–8 weeks. FDA prior notice: 2–5 days. (July 2026)',
    notes: 'FDA prior notice must be filed via PNSI portal before shipment arrives. COFEPRIS export certificate required. THC content compliance critical — test at <0.25% to provide buffer vs 0.3% threshold.',
  },
  'Thailand→Asia-Pacific': {
    team:  'Thai FDA — Food and Drug Administration Thailand · ONCB (Office of Narcotics Control Board)',
    email: 'contact@fda.moph.go.th · info@oncb.go.th',
    queue: 'ONCB export licence: 10–16 weeks (increased scrutiny post-2024). (July 2026)',
    notes: 'ONCB export licence processing increased following 2024 partial re-scheduling. Reference updated export notification from Thai FDA before applying. Destination country permits must be uploaded with application.',
  },
  'New Zealand→Australia': {
    team:  'Medsafe — New Zealand Medicines and Medical Devices Safety Authority · ODC (TGA)',
    email: 'medsafe@health.govt.nz · odc.info@tga.gov.au',
    queue: 'Medsafe: 4–6 weeks. ODC: 6–10 weeks. (July 2026)',
    notes: 'Medsafe export certificate and ODC import permit applied in parallel. ODC product database entry required before import permit application (3–4 weeks for new products).',
  },
  'Singapore→Asia-Pacific (Transit)': {
    team:  'HSA — Health Sciences Authority Singapore (Controlled Drugs Branch)',
    email: 'hsa_CDD@hsa.gov.sg',
    queue: 'HSA transit permit: 5–10 business days. (July 2026)',
    notes: 'Apply for transit permit minimum 10 business days before cargo arrival. Zero deviation from declared transit route. No break of bulk permitted under any circumstance. Criminal penalties apply.',
  },
  'United States→EU': {
    team:  'DEA — Drug Enforcement Administration (hemp export) · USDA APHIS (phytosanitary)',
    email: 'odle@dea.gov · APHIS.Web@usda.gov',
    queue: 'DEA export cert: 2–4 weeks. USDA phytosanitary: 1–2 weeks. (July 2026)',
    notes: 'DEA export certificate for hemp required from DEA Diversion Control Division. USDA APHIS phytosanitary certificate required. EU Novel Food authorisation at destination must be in place before shipment.',
  },
  'Turkey→EU': {
    team:  'TEAB — Tarım ve Orman Bakanlığı (Ministry of Agriculture and Forestry)',
    email: 'bilgi@tarimorman.gov.tr',
    queue: 'TEAB export cert: 3–6 weeks. (July 2026)',
    notes: 'TEAB agricultural export certificate required for hemp. Medical THC export: no legal pathway under current Turkish law. Ensure THC content well below 0.2% to buffer against EU threshold risk.',
  },
  'Lebanon→EU': {
    team:  'Ministry of Public Health Lebanon — Directorate General of Pharmaceutical Affairs',
    email: 'info@moph.gov.lb',
    queue: 'MoPH: 12–20+ weeks (government capacity constraints). (July 2026)',
    notes: 'Lebanese government capacity severely constrained. Personal contacts within MoPH pharmaceutical division typically required to advance applications. Banking pre-arrangement mandatory before initiating regulatory process.',
  },
  'Brazil→EU': {
    team:  'ANVISA — Agência Nacional de Vigilância Sanitária',
    email: 'sac@anvisa.gov.br',
    queue: 'ANVISA export auth: 8–14 weeks (framework nascent). (July 2026)',
    notes: 'ANVISA export pathway for cannabis derivatives still being operationalised. Reference ANVISA Resolution RDC 327/2019 and updates in applications. Spanish/Portuguese preferred for correspondence.',
  },
  'Ecuador→EU': {
    team:  'ARCSA — Agencia Nacional de Regulación, Control y Vigilancia Sanitaria',
    email: 'info@controlsanitario.gob.ec',
    queue: 'ARCSA: framework not yet operationalised for cannabis export. (July 2026)',
    notes: 'ARCSA cannabis export framework under development. Contact ARCSA regulatory affairs division for current status before investing in permit process. EU GMP certification prerequisite.',
  },
  'Peru→EU': {
    team:  'DIGEMID — Dirección General de Medicamentos, Insumos y Drogas',
    email: 'postmaster@digemid.minsa.gob.pe',
    queue: 'DIGEMID: framework nascent — expect 14–24 weeks. (July 2026)',
    notes: 'DIGEMID cannabis export framework based on Decreto Legislativo 1241 and Ley 30681. Framework principally designed for importation; export procedures still being developed. Contact directly for current guidance.',
  },
  'Spain→EU': {
    team:  'AEMPS — Agencia Española de Medicamentos y Productos Sanitarios',
    email: 'sgmuh@aemps.es',
    queue: 'AEMPS: 10–16 weeks (export framework nascent). (July 2026)',
    notes: 'AEMPS narcotic export authorisation process for cannabis being operationalised. AEMPS responds in Spanish. Initial applications may require supplementary information requests — expect additional 4–6 weeks for first-time applicants.',
  },
  'North Macedonia→EU': {
    team:  'Agency for Medicines and Medical Devices of North Macedonia (MALMED)',
    email: 'info@malmed.gov.mk',
    queue: 'MALMED: 8–14 weeks. (July 2026)',
    notes: 'MALMED export certificate required. EU GMP required with EU-qualified QP batch release. MALMED responds in Macedonian and English. EU accession process may simplify pathway in coming years.',
  },
  'Greece→EU Distribution': {
    team:  'EOF — Εθνικός Οργανισμός Φαρμάκων (National Organisation for Medicines)',
    email: 'info@eof.gr',
    queue: 'EOF: 8–14 weeks. (July 2026)',
    notes: 'EOF export permit required for cannabis products. EU GMP certificate required; EOF has limited capacity for cannabis GMP inspections. Respond in Greek preferred; English accepted.',
  },
  'Czech Republic→EU Distribution': {
    team:  'SÚKL — Státní ústav pro kontrolu léčiv (State Institute for Drug Control)',
    email: 'posta@sukl.cz',
    queue: 'SÚKL: 8–12 weeks (domestic demand may extend). (July 2026)',
    notes: 'SÚKL processing extended when domestic supply constraints require prioritisation. Apply 16 weeks before target export date. SÚKL responds in Czech and English.',
  },
  'Italy→EU Distribution': {
    team:  'AIFA — Agenzia Italiana del Farmaco (Narcotics Division) · ISS (oversight)',
    email: 'aifa@pec.aifa.gov.it',
    queue: 'AIFA/ISS: 10–16 weeks (commercial export framework developing). (July 2026)',
    notes: 'ISS oversight for narcotics; AIFA for pharmaceutical authorisation. Domestic supply priority constrains export authorisation processing. Apply well in advance and follow up regularly.',
  },
  'Poland→EU Distribution': {
    team:  'URPL — Urząd Rejestracji Produktów Leczniczych (Office for Registration of Medicinal Products)',
    email: 'urpl@urpl.gov.pl',
    queue: 'URPL: 12 weeks (extended Aug 2025 — domestic demand). (July 2026)',
    notes: 'URPL processing extended to 12 weeks as of September 2025. Apply 16 weeks before target ship date. URPL responds in Polish and English.',
  },
  'Portugal→United Kingdom': {
    team:  'MHRA — Controlled Drugs Unit · Infarmed',
    email: 'cdhu@mhra.gov.uk · estupefacientes@infarmed.pt',
    queue: 'MHRA: 10–14 weeks. Infarmed export: 6–8 weeks. (July 2026)',
    notes: 'UK GMP recognition for Portuguese facility required before MHRA import licence. Separate from EU GMP; MHRA audit process 4–8 months first-time. Plan 12+ months ahead for new product introductions.',
  },
  'Malta→EU': {
    team:  'MRA — Malta Medicines Authority (previously MRA Cannabis Unit)',
    email: 'cannabis@mra.org.mt',
    queue: 'MRA export licence: 14–20 weeks (pilot framework). (July 2026)',
    notes: 'MRA export framework published Dec 2025 — only 5 pilot operator licences issued. Contact MRA early to confirm operator eligibility before investing in permit process.',
  },
  'Switzerland→EU': {
    team:  'Swissmedic — Swiss Agency for Therapeutic Products (Narcotics Division) · FOPH',
    email: 'betaeubungsmittel@swissmedic.ch',
    queue: 'Swissmedic: 8–14 weeks. Bilateral authorisation: add 4–6 weeks per shipment. (July 2026)',
    notes: 'Each shipment requires bilateral Swissmedic + EU destination authority co-authorisation due to non-EU MRA status. Swiss-EU bilateral cannabis MRA negotiations stalled as of Nov 2025 — monitor FOPH announcements.',
  },
}

export const CORRIDOR_COSTS: Record<string, CorridorCostData> = {
  'Netherlands→Germany': {
    permitFee:      '€300–550 (BfArM permit application)',
    labCostBatch:   '€900–1,800 per batch (EU GMP COA, 8-panel)',
    logisticsPerKg: '€18–35 (temperature-controlled road freight)',
    fxExposure:     'None (EUR/EUR)',
    gmpAudit:       'N/A (intra-EU; Dutch EU GMP recognised)',
    notes:          'Most cost-efficient established EU corridor. BfArM permit fee per application; annual facility fee separate.',
  },
  'Canada→Germany': {
    permitFee:      'CAD 3,500–6,000 (Health Canada export) + €300–550 (BfArM)',
    labCostBatch:   '€1,200–2,500 per batch (EU GMP COA + GACP attestation)',
    logisticsPerKg: '€90–160 (temperature-controlled air freight YYZ→FRA)',
    fxExposure:     'CAD/EUR — moderate. 1yr CAD/EUR FX hedge ~0.8–1.2% premium',
    gmpAudit:       '€20,000–60,000 one-time EU GMP audit (Canadian facility)',
    notes:          'Air freight cost dominates. EU GMP audit is one-time but significant. Hedge CAD/EUR for supply agreements >6 months.',
  },
  'Canada→United Kingdom': {
    permitFee:      'CAD 3,500–6,000 (Health Canada) + £750–1,500 (MHRA CDL)',
    labCostBatch:   '£900–2,000 per batch (UK GMP COA equivalent)',
    logisticsPerKg: '€70–130 (air freight YYZ→LHR)',
    fxExposure:     'CAD/GBP — moderate. GBP post-Brexit volatility',
    gmpAudit:       '£15,000–45,000 one-time UK GMP recognition audit',
    notes:          'Dual EU + UK GMP if targeting both markets adds significant audit cost. MHRA digital portal reduces permit cost vs. historic paper process.',
  },
  'Portugal→Germany / EU': {
    permitFee:      '€200–400 (Infarmed export) + €300–550 (BfArM)',
    labCostBatch:   '€800–1,600 per batch (EU GMP COA)',
    logisticsPerKg: '€22–42 (temperature-controlled road freight LIS→FRA)',
    fxExposure:     'None (EUR/EUR)',
    gmpAudit:       '€18,000–50,000 one-time EU GMP audit (Portuguese facility)',
    notes:          'Lowest EU corridor cost after Netherlands. Road freight viable. EU GMP audit one-time investment unlocks full EU market access.',
  },
  'Denmark→Germany / EU': {
    permitFee:      '€250–450 (DKMA) + €300–550 (BfArM)',
    labCostBatch:   '€900–1,800 per batch',
    logisticsPerKg: '€20–38 (road/short-sea freight CPH→FRA)',
    fxExposure:     'Very low (DKK/EUR ERM II peg)',
    gmpAudit:       'N/A (EU GMP recognised for Danish facilities)',
    notes:          'Short logistics haul. Production scale the constraint, not cost. DKMA and BfArM permits applied in parallel to minimise timeline.',
  },
  'Australia→Global': {
    permitFee:      'AUD 4,500–9,000 (ODC export permit)',
    labCostBatch:   'AUD 1,200–2,800 per batch (TGA GMP COA)',
    logisticsPerKg: 'AUD 140–240 (air freight SYD to Europe/Asia)',
    fxExposure:     'AUD/destination — varies. AUD moderate volatility',
    gmpAudit:       'AUD 25,000–70,000 one-time TGA manufacturing licence',
    notes:          'Long-haul air freight the major cost driver. TGA GMP licence is one-time per facility. Each destination requires separate import permit — budget per market.',
  },
  'Germany→EU Distribution': {
    permitFee:      '€500–1,200 (Wholesale Distribution Authorisation, one-time)',
    labCostBatch:   '€400–900 per batch (GDP-compliant testing)',
    logisticsPerKg: '€12–28 (road freight, intra-EU GDP)',
    fxExposure:     'None (EUR/EUR)',
    gmpAudit:       '€8,000–20,000 GDP audit (one-time per warehouse)',
    notes:          'Lowest per-kg logistics cost in the playbooks. Pharmacy distribution via licensed wholesalers. GDP audit is one-time per facility.',
  },
  'Netherlands→United Kingdom': {
    permitFee:      '€200–400 (CBG) + £750–1,500 (MHRA)',
    labCostBatch:   '£900–2,000 per batch',
    logisticsPerKg: '£35–65 (temperature-controlled road/ferry AMS→UK)',
    fxExposure:     'EUR/GBP — moderate. Post-Brexit GBP volatility',
    gmpAudit:       '£15,000–45,000 UK GMP recognition (separate from EU GMP)',
    notes:          'UK GMP recognition is the major one-time cost. Post-Brexit road/ferry logistics straightforward for licensed pharmaceutical freight.',
  },
  'Canada→Australia': {
    permitFee:      'CAD 3,500–6,000 (Health Canada) + AUD 4,500–9,000 (ODC)',
    labCostBatch:   'AUD 1,200–2,800 per batch',
    logisticsPerKg: 'CAD 160–280 (air freight YVR/YYZ→SYD)',
    fxExposure:     'CAD/AUD — moderate, correlated commodity currencies',
    gmpAudit:       'AUD 25,000–70,000 TGA manufacturing licence (separate from EU GMP)',
    notes:          'Long trans-Pacific haul. Both TGA GMP and Health Canada export licence required. Correlated currency pair reduces FX risk vs EUR corridors.',
  },
  'Canada→France': {
    permitFee:      'CAD 3,500–6,000 (Health Canada) + €400–800 (ANSM per SKU)',
    labCostBatch:   '€1,000–2,200 per batch (EU GMP COA)',
    logisticsPerKg: '€95–170 (air freight YUL/YYZ→CDG)',
    fxExposure:     'CAD/EUR — moderate',
    gmpAudit:       '€20,000–60,000 EU GMP audit (Canadian facility)',
    notes:          'ANSM charges per product SKU — SKU proliferation multiplies permit cost. Consolidate product range before targeting French market.',
  },
  'Canada→Israel': {
    permitFee:      'CAD 2,500–5,000 (Health Canada) + ILS 3,000–6,000 (IMCA)',
    labCostBatch:   'ILS 3,500–7,000 per batch (IMCA COA format)',
    logisticsPerKg: 'CAD 120–200 (air freight YYZ→TLV)',
    fxExposure:     'CAD/ILS via USD — moderate multi-leg FX',
    gmpAudit:       'IMC-GMP or Canadian GMP accepted — lower one-time cost than EU GMP',
    notes:          'IMCA quota management key — confirm quota before investing in permit process. ILS 3-leg FX conversion adds 2–3% per transaction.',
  },
  'Colombia→EU / LATAM': {
    permitFee:      'COP 4,000,000–8,000,000 (INVIMA export) + €300–550 (EU import)',
    labCostBatch:   '€900–1,800 per batch (EU GMP if certified) / lower for GACP-only',
    logisticsPerKg: '€110–190 (air freight BOG→FRA/AMS)',
    fxExposure:     'COP/EUR — HIGH. COP depreciated 12% vs EUR in 2026. EUR contracts strongly recommended',
    gmpAudit:       '€25,000–70,000 EU GMP audit (Colombian facility)',
    notes:          'Lowest production cost globally at scale. Air freight and EU GMP audit are the main cost items. FX is primary financial risk; EUR contract denomination essential.',
  },
  'South Africa→Germany / EU': {
    permitFee:      'ZAR 18,500 (SAHPRA export, revised 2026) + €300–550 (BfArM)',
    labCostBatch:   '€1,000–2,200 per batch (EU GMP COA)',
    logisticsPerKg: '€160–260 (air freight JNB→FRA)',
    fxExposure:     'ZAR/EUR — HIGH. ZAR historically volatile',
    gmpAudit:       '€25,000–70,000 EU GMP audit + ZAR 45,000 SAHPRA facility inspection',
    notes:          'SAHPRA fee revised upward 23% in Feb 2026. Long-haul air freight significant. ZAR volatility makes EUR contract denomination essential.',
  },
  'Israel→Germany / EU': {
    permitFee:      'ILS 4,000–8,000 (IMCA export) + €300–550 (BfArM)',
    labCostBatch:   '€1,000–2,000 per batch (Research grade COA)',
    logisticsPerKg: '€90–160 (air freight TLV→FRA)',
    fxExposure:     'ILS/EUR — low-moderate. ILS relatively stable',
    gmpAudit:       'IMC-GMP certification currently required (~€15,000–30,000); EU GMP equivalency expected Q4 2026',
    notes:          'Research pathway only until EU-Israel IMC-GMP equivalency confirmed (Q4 2026). Post-equivalency, permit fee and lab structure will align with standard EU corridors.',
  },
  'New Zealand→Australia': {
    permitFee:      'NZD 1,500–3,500 (Medsafe) + AUD 4,500–9,000 (ODC)',
    labCostBatch:   'AUD 800–1,800 per batch',
    logisticsPerKg: 'NZD 40–80 (air freight AKL→SYD)',
    fxExposure:     'NZD/AUD — very low. Highly correlated currencies',
    gmpAudit:       'TGA product registration per SKU: AUD 3,000–8,000',
    notes:          'Most cost-efficient inter-country corridor in Asia-Pacific. Short haul. Correlated currencies. TGA product registration per SKU is main recurring cost.',
  },
  'Turkey→EU': {
    permitFee:      'TRY 5,000–12,000 (TEAB export) + EU hemp import declaration €0–200',
    labCostBatch:   '€400–900 per batch (hemp COA, phytosanitary)',
    logisticsPerKg: '€18–35 (road freight IST→EU)',
    fxExposure:     'TRY/EUR — VERY HIGH. TRY down >50% vs EUR since 2022. EUR contracts mandatory',
    gmpAudit:       'N/A for hemp — no GMP audit required for agricultural hemp export',
    notes:          'Hemp/fibre only. Low per-kg logistics via road. TRY inflation and depreciation make EUR contract denomination non-negotiable.',
  },
  'Morocco→EU': {
    permitFee:      'MAD 1,500–4,000 (ONICL + ONSSA) + EU hemp import declaration',
    labCostBatch:   '€300–800 per batch (hemp COA, phytosanitary cert)',
    logisticsPerKg: '€20–40 (road/sea freight from Morocco)',
    fxExposure:     'MAD/EUR — low. MAD managed against EUR/USD basket',
    gmpAudit:       'N/A for hemp export. Medical THC pathway: not yet established',
    notes:          'Hemp/CBD only at present. Very competitive logistics cost from proximity to EU. Medical THC awaits parliamentary approval.',
  },
  'Mexico→United States': {
    permitFee:      'MXN 8,000–18,000 (COFEPRIS) + FDA prior notice (free)',
    labCostBatch:   'USD 500–1,200 per batch (COA, phytosanitary)',
    logisticsPerKg: 'USD 8–20 (road freight MEX→US border)',
    fxExposure:     'MXN/USD — low. MXN relatively stable; USD conversion straightforward',
    gmpAudit:       'N/A for hemp — USDA-compliant GACP sufficient',
    notes:          'Hemp/CBD only — THC products completely blocked. Road freight lowest per-kg cost of all corridors. FDA Import Alert 54-15 compliance critical for CBD.',
  },
  'Lebanon→EU': {
    permitFee:      'LBP (nominal — USD equivalent ~USD 500–2,000) + EU import permit €300–550',
    labCostBatch:   '€800–2,000 per batch (EU-standard COA)',
    logisticsPerKg: '€120–200 (air freight BEY→FRA/AMS)',
    fxExposure:     'EXTREME — LBP lost >95% vs USD/EUR since 2019. USD cash only',
    gmpAudit:       'GMP audit cost secondary — banking infrastructure the primary constraint',
    notes:          'Banking is the principal cost risk, not logistics. Financial structuring via Cyprus or UAE intermediary adds 5–8% per transaction. All costs in USD cash.',
  },
}
