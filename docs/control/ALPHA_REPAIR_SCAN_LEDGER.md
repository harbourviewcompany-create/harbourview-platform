# Alpha Repair Scan Ledger — Globe, Country Briefs, Dashboard, Sections

Last updated: 2026-05-28

Source boundary: current repository files only. This ledger does not import external country lists or infer missing country coverage.

## Scan Ledger

### Globe findings

- Current homepage route is `app/page.tsx`, which renders `GlobeSameScreenRouterLanding` from `components/globe/GlobeSameScreenRouterLanding.tsx`.
- Active homepage globe uses `components/globe/r3f/GlobeCanvas.tsx`, `CountryPolygonMeshLayer`, and `CountryBorderLayer`. Those active R3F layers import `data/globe/natural-earth-countries.ts`, a generated repository geometry payload with 174 country records.
- A smaller fixture payload exists at `data/globe/natural-earth-fixture.ts` with 5 records and is still used by `lib/globe/country-geometry-store.ts` / readiness helpers, but it is not the active homepage polygon layer.
- Standalone/legacy globe surfaces found: `components/harbourview/globe/GlobeStage.tsx`, `HarbourviewGlobeClientLoader.tsx`, `HarbourviewGlobeRouteController.tsx`, `InteractiveGlobe.tsx`, `StaticGlobeFallback.tsx`, and `components/harbourview/CandidateBGlobe.tsx`. No standalone `/globe` route exists.
- `/intelligence` uses `components/intelligence/CountryIntelligenceMap.tsx`, an SVG/static projected map with point buttons; it is not WebGL/canvas.
- Feature behavior is runtime-gated by client WebGL availability, reduced motion, and low device performance in `GlobeSameScreenRouterLanding`. Route availability is controlled by `config/globe/route-map.ts`.
- Active globe path uses generated polygon data from repo, canvas/WebGL through React Three Fiber, and a static CSS/HTML fallback for reduced motion, no WebGL, or low-performance devices. It does not load external geometry at runtime.
- Breakage found: search/role routing coverage is narrower than active geometry; country brief hooks had no repo-backed fallback when Supabase env was absent; dashboard market brief ISO values were derived from display-name prefixes. These were repaired in this pass.
- Country coverage is partial at the product/intelligence level. Geometry has a generated Natural Earth repository payload, but country briefs and routing profiles only cover represented/tracked alpha jurisdictions.

### /intelligence/country-briefs findings

- `/intelligence/country-briefs` exists as `app/intelligence/country-briefs/page.tsx`.
- No dynamic route exists under `app/intelligence/country-briefs/[country]`, `[slug]`, `[iso2]`, or `[iso3]`.
- Country brief data sources are mixed: Supabase public country records when configured, plus repo static country intelligence fixtures after this pass.
- Existing globe/dashboard country brief interactions point to the country-brief index or in-page modal, not missing dynamic brief pages.
- Coverage wording has been constrained to represented/tracked alpha jurisdictions and partial repo-backed coverage.

### Dashboard findings

- `/dashboard` exists at `app/dashboard/page.tsx` and has a route-specific shell at `app/dashboard/layout.tsx`; it is unguarded/public in the current app tree.
- Navigation paths to `/dashboard` include the globe route manifest and homepage globe resolver for marketplace/services, request intro, seller listing, wanted request, and routing review destinations.
- Dashboard data is fixture/static plus optional client-side public country Supabase lookup. No service-role or private admin source is queried by the dashboard page.
- Public/private leakage risk was copy-level: dashboard signals looked live and country modal ISO derivation was wrong for Germany/United Kingdom. This pass relabeled signals/listings as alpha fixture examples and fixed market ISO values.

### Section coverage findings

- Marketplace routes under `app/marketplace` are present for index, category pages, listings, quote, sell, wanted, genetics, services, and qualified access. The public category pages use useful content/gap-state patterns rather than empty shells.
- Intelligence routes under `app/intelligence` are present for index, country briefs, counterparty intelligence, licensing pathways, logistics/trade routes, regulatory pathways, source engine, and watchlists. Country briefs is partial coverage, not complete global coverage.
- Education routes under `app/education` are present for index, compliance readiness, export/import readiness, pharmaceutical/medical cannabis, and cannabis history library. The index routes to professional readiness surfaces with guardrail copy.

### Verification plan

- Safe commands selected from `package.json`: `npm run typecheck`, `npm run lint`, `npm run test:globe-router`, targeted public route smoke tests, targeted visibility/leakage tests, and `npm run build`.
- `npm run verify:all-safe` was not selected as the first command because it chains production/leakage/admin checks and a full build; equivalent safer component commands are run separately.

## Globe-country jurisdiction ledger

| Display name as found | ISO2 | ISO3 | Source file(s) | Globe geometry | Intelligence/country data | Dashboard fixtures | Marketplace/listing fixtures | Existing country brief route/data | Enough data for public country brief | Fixture/example only |
|---|---:|---:|---|---|---|---|---|---|---|---|
| Afghanistan | AF | AFG | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Albania | AL | ALB | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Algeria | DZ | DZA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Angola | AO | AGO | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Argentina | AR | ARG | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Armenia | AM | ARM | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Australia | AU | AUS | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>config/globe/country-spots.ts<br>data/globe/natural-earth-countries.ts<br>data/globe/natural-earth-fixture.ts<br>lib/intelligence/country-fixtures.json<br>lib/intelligence/fixtures.ts<br>lib/marketplace/geneticsShowcase.ts | yes | yes | yes | yes | yes | no | yes |
| Austria | AT | AUT | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Azerbaijan | AZ | AZE | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Bahamas | BS | BHS | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Bangladesh | BD | BGD | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Belarus | BY | BLR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Belgium | BE | BEL | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Belize | BZ | BLZ | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Benin | BJ | BEN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Bhutan | BT | BTN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Bolivia | BO | BOL | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Bosnia and Herzegovina | BA | BIH | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Botswana | BW | BWA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Brazil | BR | BRA | components/dashboard/SignalStrip.tsx<br>data/globe/natural-earth-countries.ts<br>lib/intelligence/country-fixtures.json<br>lib/intelligence/fixtures.ts | yes | yes | yes | no | yes | no | yes |
| Brunei Darussalam | BN | BRN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Bulgaria | BG | BGR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Burkina Faso | BF | BFA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Burundi | BI | BDI | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| California | — | — | app/marketplace/quote/QuoteRequestForm.tsx | no | no | no | yes | no | no | yes |
| Cambodia | KH | KHM | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Cameroon | CM | CMR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Canada | CA | CAN | app/dashboard/page.tsx<br>app/marketplace/quote/QuoteRequestForm.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>config/globe/country-spots.ts<br>data/globe/natural-earth-countries.ts<br>data/globe/natural-earth-fixture.ts<br>lib/intelligence/country-fixtures.json<br>lib/intelligence/fixtures.ts<br>lib/marketplace/geneticsShowcase.ts<br>scripts/marketplace-smoke-lib.mjs | yes | yes | yes | yes | yes | yes | yes |
| Central African Republic | CF | CAF | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Chad | TD | TCD | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Chile | CL | CHL | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| China | CN | CHN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Colombia | CO | COL | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>config/globe/country-spots.ts<br>data/globe/natural-earth-countries.ts<br>lib/intelligence/country-fixtures.json<br>lib/intelligence/fixtures.ts | yes | yes | yes | no | yes | no | yes |
| Costa Rica | CR | CRI | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Croatia | HR | HRV | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Cuba | CU | CUB | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Cyprus | CY | CYP | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Czech Republic | CZ | CZE | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Côte d'Ivoire | CI | CIV | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Dem. Rep. Korea | KP | PRK | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Democratic Republic of the Congo | CD | COD | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Denmark | DK | DNK | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Djibouti | DJ | DJI | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Dominican Republic | DO | DOM | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Ecuador | EC | ECU | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Egypt | EG | EGY | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| El Salvador | SV | SLV | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Equatorial Guinea | GQ | GNQ | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Eritrea | ER | ERI | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Estonia | EE | EST | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Ethiopia | ET | ETH | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Falkland Islands / Malvinas | FK | FLK | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Fiji | FJ | FJI | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Finland | FI | FIN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| France | FR | FRA | components/dashboard/SignalStrip.tsx<br>data/globe/natural-earth-countries.ts | yes | no | yes | no | no | no | yes |
| French Southern and Antarctic Lands | TF | ATF | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Gabon | GA | GAB | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Georgia | GE | GEO | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Germany | DE | DEU | app/dashboard/page.tsx<br>app/marketplace/quote/QuoteRequestForm.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>config/globe/country-spots.ts<br>data/globe/natural-earth-countries.ts<br>data/globe/natural-earth-fixture.ts<br>lib/intelligence/country-fixtures.json<br>lib/intelligence/fixtures.ts | yes | yes | yes | yes | yes | no | yes |
| Ghana | GH | GHA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Greece | GR | GRC | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Greenland | GL | GRL | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Guatemala | GT | GTM | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Guinea | GN | GIN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Guinea-Bissau | GW | GNB | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Guyana | GY | GUY | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Haiti | HT | HTI | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Honduras | HN | HND | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Hungary | HU | HUN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Iceland | IS | ISL | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| India | IN | IND | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Indonesia | ID | IDN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Iran | IR | IRN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Iraq | IQ | IRQ | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Ireland | IE | IRL | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Israel | IL | ISR | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>config/globe/country-spots.ts<br>data/globe/natural-earth-countries.ts | yes | no | yes | no | no | no | yes |
| Italy | IT | ITA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Jamaica | JM | JAM | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Japan | JP | JPN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Jordan | JO | JOR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Kazakhstan | KZ | KAZ | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Kenya | KE | KEN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Kingdom of eSwatini | SZ | SWZ | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Kosovo | XK | KOS | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Kuwait | KW | KWT | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Kyrgyzstan | KG | KGZ | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Lao PDR | LA | LAO | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Latvia | LV | LVA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Lebanon | LB | LBN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Lesotho | LS | LSO | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Liberia | LR | LBR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Libya | LY | LBY | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Lithuania | LT | LTU | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Luxembourg | LU | LUX | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Madagascar | MG | MDG | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Malawi | MW | MWI | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Malaysia | MY | MYS | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Mali | ML | MLI | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Massachusetts | — | — | lib/marketplace/listings.ts | no | no | no | yes | no | no | yes |
| Mauritania | MR | MRT | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Mexico | MX | MEX | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Moldova | MD | MDA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Mongolia | MN | MNG | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Montenegro | ME | MNE | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Morocco | MA | MAR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Mozambique | MZ | MOZ | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Myanmar | MM | MMR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Namibia | NA | NAM | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Nepal | NP | NPL | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Netherlands | NL | NLD | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>config/globe/country-spots.ts<br>data/globe/natural-earth-countries.ts<br>data/globe/natural-earth-fixture.ts | yes | no | yes | no | no | no | yes |
| New Caledonia | NC | NCL | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| New Zealand | NZ | NZL | data/globe/natural-earth-countries.ts<br>lib/marketplace/geneticsShowcase.ts | yes | no | no | yes | no | no | yes |
| Nicaragua | NI | NIC | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Niger | NE | NER | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Nigeria | NG | NGA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| North Macedonia | MK | MKD | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Norway | NO | NOR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Oman | OM | OMN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Pakistan | PK | PAK | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Palestine | PS | PSX | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Panama | PA | PAN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Papua New Guinea | PG | PNG | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Paraguay | PY | PRY | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Peru | PE | PER | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Philippines | PH | PHL | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Poland | PL | POL | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Portugal | PT | PRT | app/dashboard/page.tsx<br>config/globe/country-role-profiles.ts<br>config/globe/country-spots.ts<br>data/globe/natural-earth-countries.ts<br>data/globe/natural-earth-fixture.ts | yes | no | yes | no | no | no | yes |
| Puerto Rico | PR | PRI | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Qatar | QA | QAT | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Republic of Korea | KR | KOR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Republic of the Congo | CG | COG | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Romania | RO | ROU | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Russian Federation | RU | RUS | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Rwanda | RW | RWA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Saudi Arabia | SA | SAU | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Senegal | SN | SEN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Serbia | RS | SRB | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Sierra Leone | SL | SLE | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Slovakia | SK | SVK | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Slovenia | SI | SVN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Solomon Islands | SB | SLB | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Somalia | SO | SOM | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| South Africa | ZA | ZAF | config/globe/country-role-profiles.ts<br>config/globe/country-spots.ts<br>data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | yes |
| South Sudan | SS | SDS | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Spain | ES | ESP | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Sri Lanka | LK | LKA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Sudan | SD | SDN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Suriname | SR | SUR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Sweden | SE | SWE | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Switzerland | CH | CHE | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Syria | SY | SYR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Taiwan | TW | TWN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Tajikistan | TJ | TJK | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Tanzania | TZ | TZA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Thailand | TH | THA | components/dashboard/SignalStrip.tsx<br>data/globe/natural-earth-countries.ts | yes | no | yes | no | no | no | yes |
| The Gambia | GM | GMB | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Timor-Leste | TL | TLS | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Togo | TG | TGO | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Trinidad and Tobago | TT | TTO | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Tunisia | TN | TUN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Turkey | TR | TUR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Turkmenistan | TM | TKM | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Uganda | UG | UGA | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Ukraine | UA | UKR | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| United Arab Emirates | AE | ARE | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| United Kingdom | GB | GBR | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>config/globe/country-spots.ts<br>data/globe/natural-earth-countries.ts<br>lib/intelligence/country-fixtures.json<br>lib/intelligence/fixtures.ts | yes | yes | yes | no | yes | no | yes |
| United States | US | USA | config/globe/country-role-profiles.ts<br>config/globe/country-spots.ts<br>data/globe/natural-earth-countries.ts<br>lib/marketplace/geneticsShowcase.ts<br>lib/marketplace/listings.ts | yes | no | no | yes | no | no | yes |
| Uruguay | UY | URY | config/globe/country-role-profiles.ts<br>config/globe/country-spots.ts<br>data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | yes |
| Uzbekistan | UZ | UZB | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Vanuatu | VU | VUT | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Venezuela | VE | VEN | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Vietnam | VN | VNM | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Western Sahara | EH | SAH | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Yemen | YE | YEM | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Zambia | ZM | ZMB | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |
| Zimbabwe | ZW | ZWE | data/globe/natural-earth-countries.ts | yes | no | no | no | no | no | no |

## Remaining gaps recorded by scan

- Complete product-level country brief coverage is missing; the country brief route only has represented alpha coverage from approved public records or repo fixtures.
- Route/search profile coverage is narrower than generated Natural Earth globe geometry.
- Some jurisdictions appear only in fixture/example marketplace or dashboard copy and are not country brief records.
- Dashboard remains an unguarded operator-style alpha surface; it must not expose private admin/provenance/counterparty fields without a separate guard/DTO review.
