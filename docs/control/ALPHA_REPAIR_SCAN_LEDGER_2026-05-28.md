# Alpha Repair Scan Ledger — 2026-05-28

Source rule: current repository files only. No external country list was used; the 174-geometry list below is read from the vendored/generated Natural Earth payload in `data/globe/natural-earth-countries.ts`.

## Globe findings
- Homepage route `app/page.tsx` renders `GlobeSameScreenRouterLanding` from `components/globe/GlobeSameScreenRouterLanding.tsx`.
- Current homepage globe path dynamically mounts `components/globe/r3f/GlobeCanvas.tsx` and related R3F layers. Reduced motion, unavailable WebGL, and low-performance devices get `PremiumStaticGlobeFallback`.
- Other globe implementations found: `components/globe/HarbourviewSovereignPlateGlobe.tsx`, `components/harbourview/CandidateBGlobe.tsx`, legacy `components/harbourview/globe/*`, and standalone router/support components under `components/globe/*`.
- `/intelligence` uses `components/intelligence/CountryIntelligenceMap.tsx`, an SVG/static map-like panel, not the homepage WebGL globe.
- Standalone globe-router components exist in `components/globe/GlobeSameScreenRouterLanding.tsx`, `components/globe/useGlobeRouterState.ts`, `components/globe/useRouteResolver.ts`, `components/harbourview/globe/GlobeRouteController.tsx`, and `components/harbourview/globe/HarbourviewGlobeRouteController.tsx`; no `/globe` app route exists.
- Feature flags found in `lib/harbourview/feature-flags.ts`: `interactiveGlobe`, `countryCards`, `expandedMode`, `beam`, `water`, and `globeForceFallback`. The active homepage component currently hard-codes interactive globe enabled and uses runtime capability fallback.
- Geometry/data model: generated Natural Earth country polygon data (`data/globe/natural-earth-countries.ts`) from vendored GeoJSON; no external runtime data loading for globe geometry. Fallback is a CSS/static visual shell. Interactive path is canvas/WebGL via React Three Fiber.
- Breakage found: fallback/operator copy implied premium preview rather than tracked alpha coverage; dashboard/country data hooks failed closed to empty/error when Supabase env was unavailable; dashboard showed `240+ markets` and `Live` signal language unsupported by repo data.
- Complete country brief data is missing. Complete polygon geometry exists only as a generated Natural Earth geometry payload; it is not complete country-intelligence or public-brief coverage.

## `/intelligence/country-briefs` findings
- Index route exists at `app/intelligence/country-briefs/page.tsx`.
- No dynamic country brief routes exist under `app/intelligence/country-briefs/[country|slug|iso2|iso3]`.
- Country brief/data references found: `app/intelligence/country-briefs/page.tsx`, `hooks/useCountryBrief.ts`, `hooks/useAllCountries.ts`, `lib/server/countriesQuery.ts`, `lib/intelligence/country-fixtures.json`, `data/harbourview/countries.ts`, `components/globe/CountryBriefPanel.tsx`, `components/dashboard/CountryBriefModal.tsx`, and institutional links in `lib/institutional/content.ts`.
- Data modes: Supabase-backed public `countries` queries when env exists; static/gap alpha fallback from repo fixtures after this pass; no generated complete brief set; no live data introduced.
- Links point to the index route or `/contact`/`/markets`; no dynamic brief links were found, so no dynamic brief route was added.

## Dashboard findings
- `/dashboard` route exists (`app/dashboard/page.tsx`) with shellless layout (`app/dashboard/layout.tsx`) and is unguarded/public at route level.
- Intentional navigation paths: active globe resolver maps multiple intents to `/dashboard`; public nav does not expose a main Dashboard link; dashboard quick actions route to public marketplace/contact/markets pages.
- Dashboard data is fixture/mixed: in-page sample listings and market strip, client Supabase country lookups if env exists, and static alpha fallback after this pass. No private Supabase/admin DTO path was connected.
- Public/private leakage risk: route is public, so copy must not expose private counterparties, provenance, evidence, analyst notes, or seller identity. Current patched copy labels alpha/sample state and keeps direct counterparty access behind controlled workflows.

## Section coverage findings
- `/marketplace` and category routes exist with useful content or gap states across listings, wanted, sell, import/export, equipment, services, genetics, consumables, used surplus, quote, and related category routes.
- `/intelligence` exists with a country map panel, request workflow cards, signals section when data exists, and links to country briefs/source engine; copy needed tracked-alpha wording instead of global-complete wording.
- `/intelligence/country-briefs` existed but could render no coverage when Supabase env was missing; patched to static repo-backed alpha coverage/gap state wording.
- `/education` and subroutes exist (`cannabis-history-library`, `compliance-readiness`, `export-import-readiness`, `pharmaceutical-medical-cannabis`) and present orientation content rather than empty shells.

## Verification plan
- Safe order from package scripts: `npm run typecheck`, `npm run lint`, `npm run test:globe-router`, `npm run test:intelligence-globe-leakage`, `npm run test:visibility`, targeted public route smoke if dependencies exist, then `npm run build`.
- `npm run verify:all-safe` chains non-destructive checks but is broader than this pass and depends on installed dependencies; run only after install succeeds.

## Globe-country jurisdiction ledger

| Display name as found | ISO2 | ISO3 | Source file(s) | Globe geometry | Intelligence/country data | Dashboard fixtures | Marketplace/listing fixtures | Country brief route/data | Enough for public country brief | Fixture/example only |
|---|---:|---:|---|---|---|---|---|---|---|---|
| Afghanistan | AF | AFG | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Albania | AL | ALB | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Algeria | DZ | DZA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Angola | AO | AGO | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Argentina | AR | ARG | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Armenia | AM | ARM | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Australia | AU | AUS | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>data/globe/natural-earth-countries.ts<br>lib/compliance/countries.ts<br>lib/intelligence/country-fixtures.json<br>lib/marketplace/geneticsProfiles.ts | yes | yes | yes | yes | public-safe/static fixture | yes | mixed/alpha fixture |
| Austria | AT | AUT | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Azerbaijan | AZ | AZE | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Bahamas | BS | BHS | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Bangladesh | BD | BGD | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Belarus | BY | BLR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Belgium | BE | BEL | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Belize | BZ | BLZ | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Benin | BJ | BEN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Bhutan | BT | BTN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Bolivia | BO | BOL | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Bosnia and Herzegovina | BA | BIH | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Botswana | BW | BWA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Brazil | BR | BRA | components/dashboard/SignalStrip.tsx<br>data/globe/natural-earth-countries.ts<br>lib/compliance/countries.ts<br>lib/intelligence/country-fixtures.json | yes | yes | yes | no | public-safe/static fixture | yes | mixed/alpha fixture |
| Brunei Darussalam | BN | BRN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Bulgaria | BG | BGR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Burkina Faso | BF | BFA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Burundi | BI | BDI | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Cambodia | KH | KHM | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Cameroon | CM | CMR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Canada | CA | CAN | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>data/globe/natural-earth-countries.ts<br>data/harbourview/countries.ts<br>lib/fixtures/cannabis-inventory.ts<br>lib/intelligence/country-fixtures.json<br>lib/marketplace-data.ts | yes | yes | yes | yes | public-safe/static fixture | yes | mixed/alpha fixture |
| Central African Republic | CF | CAF | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Chad | TD | TCD | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Chile | CL | CHL | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| China | CN | CHN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Colombia | CO | COL | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>data/globe/natural-earth-countries.ts<br>lib/compliance/countries.ts<br>lib/intelligence/country-fixtures.json | yes | yes | yes | no | public-safe/static fixture | yes | mixed/alpha fixture |
| Costa Rica | CR | CRI | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Croatia | HR | HRV | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Cuba | CU | CUB | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Cyprus | CY | CYP | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Czech Republic | CZ | CZE | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Côte d'Ivoire | CI | CIV | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Dem. Rep. Korea | KP | PRK | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Democratic Republic of the Congo | CD | COD | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Denmark | DK | DNK | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Djibouti | DJ | DJI | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Dominican Republic | DO | DOM | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Ecuador | EC | ECU | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Egypt | EG | EGY | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| El Salvador | SV | SLV | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Equatorial Guinea | GQ | GNQ | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Eritrea | ER | ERI | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Estonia | EE | EST | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Ethiopia | ET | ETH | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Falkland Islands / Malvinas | FK | FLK | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Fiji | FJ | FJI | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Finland | FI | FIN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| France | FR | FRA | components/dashboard/SignalStrip.tsx<br>data/globe/natural-earth-countries.ts<br>lib/compliance/countries.ts | yes | no | yes | no | none | no | mixed/alpha fixture |
| French Southern and Antarctic Lands | TF | ATF | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Gabon | GA | GAB | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Georgia | GE | GEO | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Germany | DE | DEU | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>data/globe/natural-earth-countries.ts<br>data/harbourview/countries.ts<br>lib/compliance/countries.ts<br>lib/fixtures/cannabis-inventory.ts<br>lib/intelligence/country-fixtures.json | yes | yes | yes | yes | public-safe/static fixture | yes | mixed/alpha fixture |
| Ghana | GH | GHA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Greece | GR | GRC | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Greenland | GL | GRL | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Guatemala | GT | GTM | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Guinea | GN | GIN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Guinea-Bissau | GW | GNB | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Guyana | GY | GUY | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Haiti | HT | HTI | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Honduras | HN | HND | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Hungary | HU | HUN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Iceland | IS | ISL | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| India | IN | IND | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Indonesia | ID | IDN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Iran | IR | IRN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Iraq | IQ | IRQ | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Ireland | IE | IRL | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Israel | IL | ISR | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>data/globe/natural-earth-countries.ts<br>lib/compliance/countries.ts | yes | no | yes | no | gap-state only | no | mixed/alpha fixture |
| Italy | IT | ITA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Jamaica | JM | JAM | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Japan | JP | JPN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Jordan | JO | JOR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Kazakhstan | KZ | KAZ | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Kenya | KE | KEN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Kingdom of eSwatini | SZ | SWZ | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Kosovo | XK | KOS | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Kuwait | KW | KWT | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Kyrgyzstan | KG | KGZ | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Lao PDR | LA | LAO | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Latvia | LV | LVA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Lebanon | LB | LBN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Lesotho | LS | LSO | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Liberia | LR | LBR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Libya | LY | LBY | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Lithuania | LT | LTU | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Luxembourg | LU | LUX | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Madagascar | MG | MDG | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Malawi | MW | MWI | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Malaysia | MY | MYS | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Mali | ML | MLI | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Mauritania | MR | MRT | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Mexico | MX | MEX | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Moldova | MD | MDA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Mongolia | MN | MNG | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Montenegro | ME | MNE | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Morocco | MA | MAR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Mozambique | MZ | MOZ | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Myanmar | MM | MMR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Namibia | NA | NAM | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Nepal | NP | NPL | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Netherlands | NL | NLD | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>config/globe/country-role-profiles.ts<br>data/globe/natural-earth-countries.ts<br>lib/compliance/countries.ts | yes | no | yes | no | gap-state only | no | mixed/alpha fixture |
| New Caledonia | NC | NCL | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| New Zealand | NZ | NZL | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Nicaragua | NI | NIC | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Niger | NE | NER | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Nigeria | NG | NGA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| North Macedonia | MK | MKD | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Norway | NO | NOR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Oman | OM | OMN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Pakistan | PK | PAK | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Palestine | PS | PSX | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Panama | PA | PAN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Papua New Guinea | PG | PNG | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Paraguay | PY | PRY | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Peru | PE | PER | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Philippines | PH | PHL | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Poland | PL | POL | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Portugal | PT | PRT | app/dashboard/page.tsx<br>config/globe/country-role-profiles.ts<br>data/globe/natural-earth-countries.ts<br>data/harbourview/countries.ts<br>lib/commercial-os/fixtures.ts<br>lib/compliance/countries.ts | yes | yes | yes | no | gap-state only | no | mixed/alpha fixture |
| Puerto Rico | PR | PRI | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Qatar | QA | QAT | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Republic of Korea | KR | KOR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Republic of the Congo | CG | COG | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Romania | RO | ROU | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Russian Federation | RU | RUS | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Rwanda | RW | RWA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Saudi Arabia | SA | SAU | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Senegal | SN | SEN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Serbia | RS | SRB | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Sierra Leone | SL | SLE | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Slovakia | SK | SVK | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Slovenia | SI | SVN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Solomon Islands | SB | SLB | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Somalia | SO | SOM | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| South Africa | ZA | ZAF | config/globe/country-role-profiles.ts<br>data/globe/natural-earth-countries.ts<br>lib/compliance/countries.ts | yes | no | no | no | gap-state only | no | mixed/alpha fixture |
| South Sudan | SS | SDS | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Spain | ES | ESP | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Sri Lanka | LK | LKA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Sudan | SD | SDN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Suriname | SR | SUR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Sweden | SE | SWE | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Switzerland | CH | CHE | data/globe/natural-earth-countries.ts<br>data/harbourview/countries.ts<br>lib/compliance/countries.ts | yes | yes | no | no | none | no | mixed/alpha fixture |
| Syria | SY | SYR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Taiwan | TW | TWN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Tajikistan | TJ | TJK | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Tanzania | TZ | TZA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Thailand | TH | THA | components/dashboard/SignalStrip.tsx<br>data/globe/natural-earth-countries.ts<br>lib/compliance/countries.ts | yes | no | yes | no | none | no | mixed/alpha fixture |
| The Gambia | GM | GMB | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Timor-Leste | TL | TLS | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Togo | TG | TGO | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Trinidad and Tobago | TT | TTO | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Tunisia | TN | TUN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Turkey | TR | TUR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Turkmenistan | TM | TKM | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Uganda | UG | UGA | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Ukraine | UA | UKR | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| United Arab Emirates | AE | ARE | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| United Kingdom (also found as UK) | GB | GBR | app/dashboard/page.tsx<br>components/dashboard/SignalStrip.tsx<br>components/harbourview/globe/HarbourviewGlobeRouteController.tsx<br>config/globe/country-role-profiles.ts<br>data/globe/natural-earth-countries.ts<br>lib/compliance/countries.ts<br>lib/intelligence-os/fixtures.ts<br>lib/intelligence/country-fixtures.json | yes | yes | yes | no | public-safe/static fixture | yes | mixed/alpha fixture |
| United States | US | USA | config/globe/country-role-profiles.ts<br>data/globe/natural-earth-countries.ts<br>lib/compliance/countries.ts<br>lib/marketplace-data.ts<br>lib/marketplace/geneticsProfiles.ts | yes | no | no | yes | gap-state only | no | mixed/alpha fixture |
| Uruguay | UY | URY | config/globe/country-role-profiles.ts<br>data/globe/natural-earth-countries.ts<br>lib/compliance/countries.ts | yes | no | no | no | gap-state only | no | mixed/alpha fixture |
| Uzbekistan | UZ | UZB | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Vanuatu | VU | VUT | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Venezuela | VE | VEN | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Vietnam | VN | VNM | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Western Sahara | EH | SAH | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Yemen | YE | YEM | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Zambia | ZM | ZMB | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Zimbabwe | ZW | ZWE | data/globe/natural-earth-countries.ts | yes | no | no | no | none | no | yes |
| Unknown Country | — | UNK | data/harbourview/countries.ts | no | yes | no | no | none | no | yes |
