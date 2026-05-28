# Alpha Scan Ledger — Globe, Country Briefs, Dashboard, Sections

Date: 2026-05-28  
Scope: HV-ALPHA-001 through HV-ALPHA-009 plus `/intelligence/country-briefs` and repository-derived jurisdiction reconciliation.  
Source rule: current repository files only; no external country lists or inferred country coverage.

## Scan sequence and patch boundary

The scan found concrete alpha defects before patching: country brief index had no repository fixture fallback when Supabase environment variables were absent; dashboard market-strip ISO derivation used `name.slice(0,2)` and produced invalid ISO2 values for Germany, Netherlands, and United Kingdom; dashboard labels implied live markets/signals and a `240+` market count not supported by repository data; public metadata/copy implied global coverage; and the homepage stable fallback used preview/shell wording. Patches were limited to those defects.

## Globe inventory

- Current homepage route: `app/page.tsx` renders `GlobeSameScreenRouterLanding` from `components/globe/GlobeSameScreenRouterLanding.tsx`.
- Current active homepage globe implementation: `components/globe/r3f/GlobeCanvas.tsx`, using React Three Fiber canvas/WebGL and `CountryPolygonMeshLayer`.
- Homepage fallback: `PremiumStaticGlobeFallback` in `components/globe/GlobeSameScreenRouterLanding.tsx`, selected for reduced motion, missing WebGL, low hardware resources, or feature disablement.
- `/intelligence` map implementation: `components/intelligence/CountryIntelligenceMap.tsx`, an SVG/static clickable map projection using country coordinates from Supabase public rows when configured or `lib/intelligence/country-fixtures.json` fixtures otherwise.
- Standalone/alternate globe components found: `components/globe/HarbourviewSovereignPlateGlobe.tsx`, `components/harbourview/globe/GlobeStage.tsx`, `components/harbourview/globe/HarbourviewGlobeClientLoader.tsx`, `components/harbourview/globe/InteractiveGlobe.tsx`, `components/harbourview/CandidateBGlobe.tsx`, `components/harbourview/MobileCountrySelection.tsx`, and `app/market-selection/page.tsx`.
- Standalone globe-router components found: `components/globe/useRouteResolver.ts`, `lib/globe/route-resolver.ts`, `components/globe/useGlobeRouterState.ts`, `components/globe/RouterBottomSheet.tsx`, `components/harbourview/globe/GlobeRouteController.tsx`, and `components/harbourview/globe/HarbourviewGlobeRouteController.tsx`.
- Feature/control flags found: `INTERACTIVE_GLOBE_ENABLED` in the active homepage globe, reduced-motion/WebGL/hardware fallback checks in the active homepage globe, route availability flags in `config/globe/route-map.ts`, and interactive readiness/fallback checks in `lib/harbourview/globe/interactive-readiness.ts`.
- Geometry/data source: active homepage polygon layer imports generated Natural Earth-derived repository geometry from `data/globe/natural-earth-countries.ts`; older store `lib/globe/country-geometry-store.ts` still points at the intentionally small `data/globe/natural-earth-fixture.ts` fixture.
- Complete-country assertion: the repository contains a generated 174-record Natural Earth-derived geometry payload, but the repository does not contain complete country intelligence/country-brief data for every geometry record. Complete country brief coverage is missing and must remain labeled partial.
- External loading: active homepage globe does not fetch external geometry at runtime; generated geometry is vendored in repository files. Country brief panel fetches Supabase only when public env vars exist and now falls back to repository fixtures.
- Breakage vs intentional fallback: WebGL/reduced-motion fallback is intentional; invalid dashboard brief ISO derivation and unsupported global/live copy were concrete defects.

## `/intelligence/country-briefs` inventory

- `/intelligence/country-briefs` exists as `app/intelligence/country-briefs/page.tsx`.
- No dynamic country brief route exists under `/intelligence/country-briefs/[country]`, `[slug]`, `[iso2]`, or `[iso3]`.
- Country brief data exists as static repository fixture records in `lib/intelligence/country-fixtures.json` and may also be Supabase-backed through `lib/server/countriesQuery.ts` when public env vars are configured.
- Before patching, the index rendered only when Supabase country rows were returned, leaving a thin route in envs without public Supabase config. It now falls back to repository fixtures and labels them as partial alpha coverage.
- Globe country brief panel links to the index route only, so no dynamic link was broken. Dashboard brief modal now links to the index route instead of generic markets for deeper country-brief orientation.

## Dashboard inventory

- `/dashboard` exists as `app/dashboard/page.tsx`; `app/dashboard/layout.tsx` makes it shellless by design, and `components/ShellWrapper.tsx` skips global nav/footer for `/dashboard`.
- The route is public/unguarded in the current repo. Admin routes are separately under `app/admin/(protected)` with protected layout; `/dashboard` should be treated as a public-safe/operator alpha surface, not a private admin surface.
- Navigation paths to `/dashboard`: `config/globe/route-map.ts` marks `/dashboard` available and maps marketplace services, request introduction, seller listing, wanted request, and routing review intents to it.
- Dashboard data is fixture-only in `app/dashboard/page.tsx` and dashboard components, plus optional public Supabase country lookup hooks. No private/admin fields are fetched.
- Leakage risk found and mitigated: dashboard copy and signal rail implied live records and unsupported market counts; patched labels now identify alpha fixture/operator context.

## Section coverage inventory

- `/marketplace` and major children exist with public-safe listing, intake, category, quote, sell, wanted, and gap-state pages. Some marketplace pages are fixture/category-orientation surfaces rather than live data.
- `/intelligence` exists with public-safe map, modules, country briefs, source engine, watchlists, licensing, regulatory, logistics/trade, and counterparty pages. `/intelligence/country-briefs` is partial and repository-backed after this pass.
- `/education` exists with compliance readiness, export/import readiness, pharmaceutical/medical cannabis, and history-library routes. Globe route-map still intentionally treats `/education/medical` and `/education/regulatory` as provisional and falls back to intake; those exact routes do not exist.
- Related public entry routes found and checked include `/markets`, `/opportunities`, `/signals`, `/platform`, `/contact`, and `/intake`.
- Controlled-review/private-routing boundaries are preserved: public pages use public-safe summaries, request/intake CTAs, and disclaimers rather than exposing admin evidence or private counterparties.

## Verification plan

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:globe-router`
4. `npm run test:intelligence-fixtures`
5. `npm run test:intelligence-globe-leakage`
6. `npm run test:visibility`
7. `npm run build`
8. `npm run verify:all-safe` only if dependencies and environment support the preceding safe commands.

## Jurisdiction ledger

Legend: `globe geometry` means represented in repository globe geometry/fixture data; `intelligence` means represented in country intelligence fixtures or public country data path; `dashboard` means represented in dashboard fixture UI; `marketplace/listing` means represented in dashboard marketplace examples or marketplace DTO tests; `country brief` means only the existing index card/fixture path unless noted. No dynamic country brief route exists.

| Display name | ISO2 | ISO3 | Source files | Globe geometry | Intelligence/country data | Dashboard fixture | Marketplace/listing fixture | Country brief route/data | Enough public brief data | Fixture/example only |
|---|---|---|---|---|---|---|---|---|---|---|
| Afghanistan | AF | AFG | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Albania | AL | ALB | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Algeria | DZ | DZA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Angola | AO | AGO | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Argentina | AR | ARG | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Armenia | AM | ARM | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Australia | AU | AUS | app/dashboard/page.tsx, components/dashboard/SignalStrip.tsx, config/globe/country-role-profiles.ts, data/globe/natural-earth-countries.ts, data/globe/natural-earth-fixture.ts, lib/intelligence/country-fixtures.json | yes | yes | yes | yes | index card | orientation fixture | yes |
| Austria | AT | AUT | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Azerbaijan | AZ | AZE | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Bahamas | BS | BHS | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Bangladesh | BD | BGD | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Belarus | BY | BLR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Belgium | BE | BEL | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Belize | BZ | BLZ | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Benin | BJ | BEN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Bhutan | BT | BTN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Bolivia | BO | BOL | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Bosnia and Herzegovina | BA | BIH | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Botswana | BW | BWA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Brazil | BR | BRA | data/globe/natural-earth-countries.ts, lib/intelligence/country-fixtures.json | yes | yes | no | no | index card | orientation fixture | yes |
| Brunei Darussalam | BN | BRN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Bulgaria | BG | BGR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Burkina Faso | BF | BFA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Burundi | BI | BDI | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Cambodia | KH | KHM | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Cameroon | CM | CMR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Canada | CA | CAN | app/dashboard/page.tsx, components/dashboard/SignalStrip.tsx, config/globe/country-role-profiles.ts, data/globe/natural-earth-countries.ts, data/globe/natural-earth-fixture.ts, lib/intelligence/country-fixtures.json, tests/harbourview/unified-listings-dto.test.ts | yes | yes | yes | yes | index card | orientation fixture | yes |
| Central African Republic | CF | CAF | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Chad | TD | TCD | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Chile | CL | CHL | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| China | CN | CHN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Colombia | CO | COL | app/dashboard/page.tsx, components/dashboard/SignalStrip.tsx, config/globe/country-role-profiles.ts, data/globe/natural-earth-countries.ts, lib/intelligence/country-fixtures.json | yes | yes | yes | yes | index card | orientation fixture | yes |
| Costa Rica | CR | CRI | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Croatia | HR | HRV | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Cuba | CU | CUB | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Cyprus | CY | CYP | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Czech Republic | CZ | CZE | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Côte d'Ivoire | CI | CIV | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Dem. Rep. Korea | KP | PRK | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Democratic Republic of the Congo | CD | COD | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Denmark | DK | DNK | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Djibouti | DJ | DJI | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Dominican Republic | DO | DOM | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Ecuador | EC | ECU | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Egypt | EG | EGY | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| El Salvador | SV | SLV | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Equatorial Guinea | GQ | GNQ | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Eritrea | ER | ERI | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Estonia | EE | EST | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Ethiopia | ET | ETH | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Falkland Islands / Malvinas | FK | FLK | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Fiji | FJ | FJI | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Finland | FI | FIN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| France | FR | FRA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| French Southern and Antarctic Lands | TF | ATF | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Gabon | GA | GAB | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Georgia | GE | GEO | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Germany | DE | DEU | app/dashboard/page.tsx, components/dashboard/SignalStrip.tsx, config/globe/country-role-profiles.ts, data/globe/natural-earth-countries.ts, data/globe/natural-earth-fixture.ts, lib/intelligence/country-fixtures.json | yes | yes | yes | yes | index card | orientation fixture | yes |
| Ghana | GH | GHA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Greece | GR | GRC | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Greenland | GL | GRL | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Guatemala | GT | GTM | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Guinea | GN | GIN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Guinea-Bissau | GW | GNB | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Guyana | GY | GUY | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Haiti | HT | HTI | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Honduras | HN | HND | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Hungary | HU | HUN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Iceland | IS | ISL | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| India | IN | IND | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Indonesia | ID | IDN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Iran | IR | IRN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Iraq | IQ | IRQ | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Ireland | IE | IRL | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Israel | IL | ISR | app/dashboard/page.tsx, config/globe/country-role-profiles.ts, data/globe/natural-earth-countries.ts | yes | no | yes | yes | no dynamic brief | no | yes |
| Italy | IT | ITA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Jamaica | JM | JAM | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Japan | JP | JPN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Jordan | JO | JOR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Kazakhstan | KZ | KAZ | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Kenya | KE | KEN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Kingdom of eSwatini | SZ | SWZ | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Kosovo | XK | KOS | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Kuwait | KW | KWT | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Kyrgyzstan | KG | KGZ | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Lao PDR | LA | LAO | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Latvia | LV | LVA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Lebanon | LB | LBN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Lesotho | LS | LSO | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Liberia | LR | LBR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Libya | LY | LBY | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Lithuania | LT | LTU | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Luxembourg | LU | LUX | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Madagascar | MG | MDG | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Malawi | MW | MWI | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Malaysia | MY | MYS | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Mali | ML | MLI | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Mauritania | MR | MRT | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Mexico | MX | MEX | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Moldova | MD | MDA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Mongolia | MN | MNG | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Montenegro | ME | MNE | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Morocco | MA | MAR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Mozambique | MZ | MOZ | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Myanmar | MM | MMR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Namibia | NA | NAM | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Nepal | NP | NPL | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Netherlands | NL | NLD | app/dashboard/page.tsx, components/dashboard/SignalStrip.tsx, config/globe/country-role-profiles.ts, data/globe/natural-earth-countries.ts, data/globe/natural-earth-fixture.ts | yes | no | yes | yes | no dynamic brief | no | yes |
| New Caledonia | NC | NCL | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| New Zealand | NZ | NZL | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Nicaragua | NI | NIC | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Niger | NE | NER | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Nigeria | NG | NGA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| North Macedonia | MK | MKD | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Norway | NO | NOR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Oman | OM | OMN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Pakistan | PK | PAK | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Palestine | PS | PSX | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Panama | PA | PAN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Papua New Guinea | PG | PNG | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Paraguay | PY | PRY | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Peru | PE | PER | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Philippines | PH | PHL | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Poland | PL | POL | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Portugal | PT | PRT | app/dashboard/page.tsx, config/globe/country-role-profiles.ts, data/globe/natural-earth-countries.ts, data/globe/natural-earth-fixture.ts | yes | no | yes | yes | no dynamic brief | no | yes |
| Puerto Rico | PR | PRI | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Qatar | QA | QAT | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Republic of Korea | KR | KOR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Republic of the Congo | CG | COG | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Romania | RO | ROU | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Russian Federation | RU | RUS | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Rwanda | RW | RWA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Saudi Arabia | SA | SAU | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Senegal | SN | SEN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Serbia | RS | SRB | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Sierra Leone | SL | SLE | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Slovakia | SK | SVK | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Slovenia | SI | SVN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Solomon Islands | SB | SLB | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Somalia | SO | SOM | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| South Africa | ZA | ZAF | config/globe/country-role-profiles.ts, data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | yes |
| South Sudan | SS | SDS | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Spain | ES | ESP | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Sri Lanka | LK | LKA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Sudan | SD | SDN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Suriname | SR | SUR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Sweden | SE | SWE | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Switzerland | CH | CHE | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Syria | SY | SYR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Taiwan | TW | TWN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Tajikistan | TJ | TJK | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Tanzania | TZ | TZA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Thailand | TH | THA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| The Gambia | GM | GMB | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Timor-Leste | TL | TLS | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Togo | TG | TGO | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Trinidad and Tobago | TT | TTO | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Tunisia | TN | TUN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Turkey | TR | TUR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Turkmenistan | TM | TKM | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Uganda | UG | UGA | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Ukraine | UA | UKR | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| United Arab Emirates | AE | ARE | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| United Kingdom | GB | GBR | app/dashboard/page.tsx, components/dashboard/SignalStrip.tsx, config/globe/country-role-profiles.ts, data/globe/natural-earth-countries.ts, lib/intelligence/country-fixtures.json | yes | yes | yes | yes | index card | orientation fixture | yes |
| United States | US | USA | config/globe/country-role-profiles.ts, data/globe/natural-earth-countries.ts, tests/harbourview/unified-listings-dto.test.ts | yes | no | no | yes | no dynamic brief | no | yes |
| Uruguay | UY | URY | config/globe/country-role-profiles.ts, data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | yes |
| Uzbekistan | UZ | UZB | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Vanuatu | VU | VUT | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Venezuela | VE | VEN | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Vietnam | VN | VNM | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Western Sahara | EH | SAH | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Yemen | YE | YEM | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Zambia | ZM | ZMB | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |
| Zimbabwe | ZW | ZWE | data/globe/natural-earth-countries.ts | yes | no | no | no | no dynamic brief | no | geometry only |

## Remaining gaps recorded by scan

- Country intelligence/country-brief coverage is partial and does not cover every generated globe geometry record.
- No dynamic country brief route exists; current safe route is the index list/gap state.
- Dashboard remains fixture/operator-alpha data with optional public Supabase country lookup; it is not a live private operating database.
- Generated globe geometry and the smaller legacy fixture store coexist; active homepage uses generated geometry, while legacy helper store remains fixture-backed.
- `/education/medical` and `/education/regulatory` are route-map provisional destinations and intentionally fall back to intake instead of rendering direct pages.
