# Market Access coverage — the remaining 127, and why the legacy tier cannot fill them

**Dated 2026-09-10. Every figure below was measured read-only against production
(`zvxdgdkukjrrwamdpqrg`), not inferred.**

The globe shows 127 of 291 jurisdictions on the neutral gold plate. That is the
fail-closed contract working as designed, not a rendering defect: a plate renders
a tier only when tier, `evidence_key`, `verified_at` and an unexpired
`expires_at` all agree. No evidence, no claim.

| | rows |
| --- | ---: |
| `api.countries` total | 291 |
| publishing a `verified_regulatory_tier` | 164 |
| **blank (neutral plate)** | **127** |

Blanks by region:

| region | blank | of which have live reviewed signals | reviewed signals |
| --- | ---: | ---: | ---: |
| Africa | 43 | 16 | 110 |
| Asia | 40 | 15 | 205 |
| Americas | 19 | 13 | 197 |
| Europe | 14 | 8 | 128 |
| Oceania | 11 | 1 | 15 |

---

## The shortcut, and why it must not be taken

**All 127 blank rows already carry a legacy `regulatory_tier` value.** A single
`UPDATE` would fill the map today. That is precisely the thing not to do.

`regulatory_market_access_evidence` now holds 131 researched rows. Joining them
back to the legacy column measures how often it was right:

| | count |
| --- | ---: |
| researched rows that also have a legacy tier | 131 |
| legacy tier **agreed** with the researched tier | 75 |
| legacy tier **contradicted** it | **56** |
| **error rate** | **42.7%** |

Not a rounding problem, and not a harmless one. The errors run in both
directions, including the direction that matters most for a compliance surface —
telling an operator a prohibited market is tradeable:

| jurisdiction | legacy said | evidence says |
| --- | --- | --- |
| Sweden | `medical_limited_trade` | **`prohibited`** |
| Hungary | `medical_limited_trade` | **`prohibited`** |
| Slovakia | `medical_limited_trade` | **`prohibited`** |
| Bulgaria | `medical_limited_trade` | **`prohibited`** |
| Belarus | `cbd_hemp_only` | **`prohibited`** |
| Serbia | `cbd_hemp_only` | **`prohibited`** |

And the inverse — a red plate over a market that is actually open, which costs
commercial opportunity rather than compliance risk:

| jurisdiction | legacy said | evidence says |
| --- | --- | --- |
| Rwanda | `prohibited` | `legal_commercial_access` |
| Zambia | `prohibited` | `legal_commercial_access` |
| Vanuatu | `prohibited` | `legal_commercial_access` |
| India | `prohibited` | `cbd_hemp_only` |

At the observed rate, publishing the legacy column across the 127 blanks would
ship roughly **54 wrong regulatory classifications** onto a compliance-facing
map. The evidence system exists because this column is unreliable; promoting it
wholesale would undo the reason it was built.

**Decision, 2026-09-10:** research the gap properly and keep the map fail-closed
in the meantime.

## Sources that cannot close the gap

- `public.country_cannabis_legal_status` — 41 rows, **zero carrying a URL** in
  any column (`iso2`, `country_name`, `legal_status`, `notes`, `last_reviewed`),
  and it overlaps only **6** of the 127 blanks. It cannot satisfy the evidence
  contract, which requires an `authority_url`.
- `public.jurisdiction_playbooks_research_queue` — 203 rows, but scoped to
  *playbooks*, not market-access tiers. Deliberately **not** repurposed: matching
  on shape rather than checking stated purpose is the exact failure this repo's
  own operating notes call out.

## Sourcing bar

Unchanged from tranches 2 and 3: **NCSL-level** — reputable secondary trackers
count, the same standard as the 51 US state rows and the 47 national rows already
shipped. A primary regulator source is preferred where one exists and is
reachable; a tranche row is not published without an `authority_url`.

Twelve jurisdictions were deliberately left unpublished in earlier tranches where
the framework is not operational or no source met the bar. That option stays open
here: **"thorough coverage" means every jurisdiction is researched, not that every
jurisdiction is forced to a tier.** A jurisdiction that genuinely has no
determinable framework stays neutral, with the reason recorded.

## Worklist — all 127, in research order

Ordered by live reviewed-signal volume, as a proxy for where operators are
actually looking. `legacy tier` is shown as a **hypothesis to verify, not a
starting truth** — it is wrong 42.7% of the time and must be confirmed or
overturned against a citation, never carried across.

| ISO2 | jurisdiction | region | legacy tier (unverified) | signals |
| --- | --- | --- | --- | ---: |
| PR | Puerto Rico | Americas | medical_limited_trade | 56 |
| AE | United Arab Emirates | Asia | cbd_hemp_only | 49 |
| GD | Grenada | Americas | medical_limited_trade | 43 |
| BA | Bosnia and Herzegovina | Europe | medical_limited_trade | 41 |
| LC | Saint Lucia | Americas | domestic_only | 37 |
| EE | Estonia | Europe | medical_limited_trade | 34 |
| LA | Laos | Asia | prohibited | 32 |
| BE | Belgium | Europe | medical_limited_trade | 31 |
| BJ | Benin | Africa | prohibited | 29 |
| NA | Namibia | Africa | prohibited | 27 |
| BT | Bhutan | Asia | prohibited | 24 |
| GE | Georgia | Asia | domestic_only | 22 |
| LB | Lebanon | Asia | legal_commercial_access | 19 |
| PK | Pakistan | Asia | prohibited | 18 |
| MY | Malaysia | Asia | prohibited | 17 |
| FJ | Fiji | Oceania | medical_limited_trade | 15 |
| GM | Gambia | Africa | prohibited | 12 |
| BS | Bahamas | Americas | domestic_only | 12 |
| AG | Antigua and Barbuda | Americas | domestic_only | 11 |
| SV | El Salvador | Americas | prohibited | 11 |
| FK | Falkland Islands | Americas | prohibited | 11 |
| CV | Cape Verde | Africa | prohibited | 7 |
| CD | Democratic Republic of the Congo | Africa | prohibited | 7 |
| AM | Armenia | Asia | prohibited | 7 |
| FO | Faroe Islands | Europe | medical_limited_trade | 7 |
| SZ | Eswatini | Africa | legal_commercial_access | 6 |
| LI | Liechtenstein | Europe | medical_limited_trade | 6 |
| SM | San Marino | Europe | medical_limited_trade | 6 |
| AO | Angola | Africa | prohibited | 5 |
| EG | Egypt | Africa | prohibited | 5 |
| BO | Bolivia | Americas | medical_limited_trade | 5 |
| CU | Cuba | Americas | prohibited | 5 |
| KH | Cambodia | Asia | prohibited | 5 |
| ET | Ethiopia | Africa | prohibited | 4 |
| BZ | Belize | Americas | medical_limited_trade | 3 |
| BN | Brunei | Asia | prohibited | 3 |
| ID | Indonesia | Asia | prohibited | 3 |
| KM | Comoros | Africa | prohibited | 2 |
| PH | Philippines | Asia | medical_limited_trade | 2 |
| VN | Vietnam | Asia | prohibited | 2 |
| AD | Andorra | Europe | prohibited | 2 |
| BF | Burkina Faso | Africa | prohibited | 1 |
| BI | Burundi | Africa | prohibited | 1 |
| CM | Cameroon | Africa | prohibited | 1 |
| CI | Cote d'Ivoire | Africa | prohibited | 1 |
| DJ | Djibouti | Africa | prohibited | 1 |
| LR | Liberia | Africa | prohibited | 1 |
| DM | Dominica | Americas | domestic_only | 1 |
| DO | Dominican Republic | Americas | prohibited | 1 |
| NI | Nicaragua | Americas | prohibited | 1 |
| BH | Bahrain | Asia | prohibited | 1 |
| NP | Nepal | Asia | prohibited | 1 |
| RO | Romania | Europe | medical_limited_trade | 1 |
| DZ | Algeria | Africa | prohibited | 0 |
| CF | Central African Republic | Africa | prohibited | 0 |
| TD | Chad | Africa | prohibited | 0 |
| GQ | Equatorial Guinea | Africa | prohibited | 0 |
| ER | Eritrea | Africa | prohibited | 0 |
| GA | Gabon | Africa | prohibited | 0 |
| GN | Guinea | Africa | prohibited | 0 |
| GW | Guinea-Bissau | Africa | prohibited | 0 |
| LY | Libya | Africa | prohibited | 0 |
| MG | Madagascar | Africa | prohibited | 0 |
| ML | Mali | Africa | prohibited | 0 |
| MR | Mauritania | Africa | prohibited | 0 |
| MU | Mauritius | Africa | medical_limited_trade | 0 |
| MZ | Mozambique | Africa | prohibited | 0 |
| NE | Niger | Africa | prohibited | 0 |
| CG | Republic of the Congo | Africa | prohibited | 0 |
| ST | Sao Tome and Principe | Africa | prohibited | 0 |
| SN | Senegal | Africa | prohibited | 0 |
| SC | Seychelles | Africa | prohibited | 0 |
| SL | Sierra Leone | Africa | prohibited | 0 |
| SO | Somalia | Africa | prohibited | 0 |
| SS | South Sudan | Africa | prohibited | 0 |
| SD | Sudan | Africa | prohibited | 0 |
| TG | Togo | Africa | prohibited | 0 |
| TN | Tunisia | Africa | prohibited | 0 |
| UG | Uganda | Africa | prohibited | 0 |
| EH | Western Sahara | Africa | prohibited | 0 |
| GL | Greenland | Americas | prohibited | 0 |
| GT | Guatemala | Americas | medical_limited_trade | 0 |
| HT | Haiti | Americas | prohibited | 0 |
| HN | Honduras | Americas | prohibited | 0 |
| SR | Suriname | Americas | medical_limited_trade | 0 |
| VE | Venezuela | Americas | prohibited | 0 |
| AF | Afghanistan | Asia | prohibited | 0 |
| AZ | Azerbaijan | Asia | prohibited | 0 |
| BD | Bangladesh | Asia | prohibited | 0 |
| HK | Hong Kong | Asia | prohibited | 0 |
| IR | Iran | Asia | prohibited | 0 |
| IQ | Iraq | Asia | prohibited | 0 |
| JO | Jordan | Asia | prohibited | 0 |
| KZ | Kazakhstan | Asia | medical_limited_trade | 0 |
| KW | Kuwait | Asia | prohibited | 0 |
| KG | Kyrgyzstan | Asia | prohibited | 0 |
| MV | Maldives | Asia | prohibited | 0 |
| MN | Mongolia | Asia | prohibited | 0 |
| MM | Myanmar | Asia | prohibited | 0 |
| KP | North Korea | Asia | prohibited | 0 |
| OM | Oman | Asia | prohibited | 0 |
| PS | Palestine | Asia | prohibited | 0 |
| QA | Qatar | Asia | prohibited | 0 |
| SA | Saudi Arabia | Asia | prohibited | 0 |
| SY | Syria | Asia | prohibited | 0 |
| TW | Taiwan | Asia | medical_limited_trade | 0 |
| TJ | Tajikistan | Asia | prohibited | 0 |
| TL | Timor-Leste | Asia | prohibited | 0 |
| TM | Turkmenistan | Asia | prohibited | 0 |
| UZ | Uzbekistan | Asia | prohibited | 0 |
| YE | Yemen | Asia | prohibited | 0 |
| VA | Holy See | Europe | prohibited | 0 |
| IS | Iceland | Europe | medical_limited_trade | 0 |
| XK | Kosovo | Europe | prohibited | 0 |
| LV | Latvia | Europe | medical_limited_trade | 0 |
| MC | Monaco | Europe | medical_limited_trade | 0 |
| ME | Montenegro | Europe | legal_commercial_access | 0 |
| KI | Kiribati | Oceania | prohibited | 0 |
| MH | Marshall Islands | Oceania | prohibited | 0 |
| FM | Micronesia | Oceania | prohibited | 0 |
| NR | Nauru | Oceania | prohibited | 0 |
| PW | Palau | Oceania | prohibited | 0 |
| PG | Papua New Guinea | Oceania | prohibited | 0 |
| WS | Samoa | Oceania | prohibited | 0 |
| SB | Solomon Islands | Oceania | prohibited | 0 |
| TO | Tonga | Oceania | prohibited | 0 |
| TV | Tuvalu | Oceania | prohibited | 0 |

## Why this session could not do the research

Outbound HTTPS from this environment reaches npm and the MCP connectors only.
Every research source tested returned no connection (`000`) through the agent
proxy on 2026-09-10:

```
https://en.wikipedia.org         000
https://www.ncsl.org             000
https://cannigma.com             000
https://prohibitionpartners.com  000
https://www.unodc.org            000
https://cms.law                  000
```

The 47 rows in tranches 2 and 3 were researched in a session that had egress.
This one does not, so the work above is scoped and queued rather than done. The
`authority_url` spot-check still outstanding from those tranches has the same
blocker and the same fix.

## Executing this

One tranche per session, following the shape of
`20260907120000_market_access_evidence_tranche_two.sql`:

1. Research the next block from the worklist, top down.
2. Write one migration inserting `regulatory_market_access_evidence` rows —
   `evidence_key`, `jurisdiction_iso2`, `tier`, `authority_url`,
   `source_effective_date`, `rationale`.
3. `verified_at` must be **in the past at apply time**. A future `verified_at`
   applies cleanly, publishes nothing, and reports success — that trap cost a
   full cycle on tranche two and is the single easiest way to ship a silent no-op.
4. End with `select * from api.refresh_verified_market_access_tiers('<key>');`.
5. Apply by running the committed body and inserting the ledger row **at the
   committed version** — never via the Supabase `apply_migration` tool, which
   generates its own timestamp and manufactures drift.
6. Verify field-by-field against the committed file before calling it done.

At the 47-per-session rate already demonstrated, 127 jurisdictions is roughly
three sessions.

---
_Generated by [Claude Code](https://claude.ai/code)_
