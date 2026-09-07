# Regulatory Market Access — evidence tranche 2 — 2026-09-07

Controlling document for the 18 evidence rows added by
`supabase/migrations/20260907120000_market_access_evidence_tranche_two.sql`.

## Why this tranche exists

After `20260907015309` exposed `verified_regulatory_tier` through `api.countries`,
the globe rendered correctly but 174 of 203 national jurisdictions published
`NULL` (neutral gold) because no evidence row existed for them. `public.countries`
carries a legacy advisory `regulatory_tier` for all 291 rows, but that field is
explicitly not publication authority — the table comment on
`regulatory_market_access_evidence` states that briefing prose and regex are
advisory only.

This tranche researches the highest-value neutral jurisdictions and writes
evidence rows only where a citable source supports a specific tier.

## Sourcing bar used

**Stated explicitly, because the bar was ambiguous and the choice changes the output.**

The bar is the one already in force for the 51 US state rows seeded in
`20260831130000`: a named authority plus a citable published source. Those rows
rest on a single secondary tracker (NCSL), so "primary sources only" was never
the standing bar for this table.

Applied here as: a row ships only where the source is either

- a primary government or regulator page (NACOC, ANRAC, CRA Malawi, CLA Jamaica,
  MCA Saint Vincent, HPRA Ireland, ANSM France, MoH Ukraine, LNDC Lesotho,
  Botswana Government Daily News); or
- a recognised institutional or legal-practice source (Library of Congress
  Global Legal Monitor, PubMed peer-reviewed literature, Prohibition Partners'
  legislation map, named law firms: Tilleke & Gibbins, Harris Sliwoski,
  Karanovic & Partners, CBC Law).

Consumer "is weed legal in X" blogs were not accepted as the sole basis for any row.

### Known limitation of this tranche

Outbound network egress is blocked in the environment this research was performed
in: `WebFetch` and `curl` were refused for every government and regulator domain
tested (`cla.org.jm`, `ncc.gov.gh`, `ir.parliament.gh`, `gov.uk`, `hpra.ie`,
`halmed.hr`). Only search was reachable. **No `authority_url` in this tranche was
loaded and read directly.** Each URL and the content attributed to it came from
search results. URLs were not constructed or guessed — every one appeared in a
search result — but none was independently confirmed to resolve.

Before this tranche is applied to production, the URLs should be spot-checked from
an unrestricted network. This is recorded here rather than left implicit because
the rows are compliance-facing published content.

## Tier assignments

Tier follows what the cited source establishes, **not** the legacy advisory tier.
Six of the eighteen contradict the advisory value.

| ISO | Jurisdiction | Advisory tier | Published tier | Basis |
|-----|--------------|---------------|----------------|-------|
| BW | Botswana | legal_commercial_access | legal_commercial_access | Cannabis Act 2025; Cannabis Regulations 2026; National Cannabis Control Authority operating since March 2026 |
| LS | Lesotho | legal_commercial_access | legal_commercial_access | Drugs of Abuse (Cannabis) Regulations 2018 + 2025 amendment; operating export trade |
| MA | Morocco | legal_commercial_access | legal_commercial_access | Law 13-21; ANRAC licensing incl. import/export |
| MW | Malawi | legal_commercial_access | legal_commercial_access | Cannabis Regulation Act No. 6 of 2020; CRA licences issued |
| **GH** | **Ghana** | **legal_commercial_access** | **cbd_hemp_only** | Act 1019 s.43 (am. Act 1100), LI 2475 — cultivation capped at 0.3% THC |
| **GY** | **Guyana** | **medical_limited_trade** | **cbd_hemp_only** | Industrial Hemp Act 2022 only; no medical cannabis framework |
| **AL** | **Albania** | **legal_commercial_access** | **medical_limited_trade** | Law 61/2023 — licensed cultivation is export-only, no domestic market |
| **CY** | **Cyprus** | **legal_commercial_access** | **medical_limited_trade** | RAA 73/2019 permits trade but no production industry developed |
| **HR** | **Croatia** | **legal_commercial_access** | **medical_limited_trade** | No company holds full production/distribution authorisation |
| **IE** | **Ireland** | **legal_commercial_access** | **medical_limited_trade** | MCAP covers three indications; no licensed domestic cultivation |
| JM | Jamaica | legal_commercial_access | medical_limited_trade | CLA licences are medical/therapeutic/scientific; export not established by source |
| VC | Saint Vincent and the Grenadines | legal_commercial_access | medical_limited_trade | Medicinal Cannabis Industry Act 2018; cultivation + research licences |
| FR | France | medical_limited_trade | medical_limited_trade | ANSM experimentation pending generalisation |
| JP | Japan | medical_limited_trade | medical_limited_trade | Cannabis Control Act as amended Dec 2024 |
| PA | Panama | medical_limited_trade | medical_limited_trade | Law 242/2021; Decree 25 of 16 Jan 2024 |
| TH | Thailand | medical_limited_trade | medical_limited_trade | Controlled-herb reclassification; prescription-only since June 2025 |
| TR | Türkiye | medical_limited_trade | medical_limited_trade | Regulation of 24 July 2025; pharmacy-only sale |
| UA | Ukraine | medical_limited_trade | medical_limited_trade | Law 3528-IX in force 16 Aug 2024; licensing from 1 Dec 2024 |

## Deliberate abstentions

Seven researched jurisdictions get **no row** and continue to publish `NULL`.
Omission is the fail-closed default and is intentional, not an oversight.

| ISO | Jurisdiction | Advisory tier | Why no row |
|-----|--------------|---------------|------------|
| LB | Lebanon | legal_commercial_access | Law 178/2020 passed, but implementing decrees remain unpublished and the Regulatory Authority is not operational |
| SZ | Eswatini | legal_commercial_access | Medical cannabis bill never enacted; the Opium and Habit-Forming Drugs Act 1922 and Pharmacy Act 1929 still govern |
| RO | Romania | medical_limited_trade | Law 339/2005 provides a theoretical basis but no cultivation licence has ever been issued; framework non-operational |
| MU | Mauritius | medical_limited_trade | 2022 Dangerous Drugs Act amendment has no proclamation date and is not in effect |
| PH | Philippines | medical_limited_trade | Cannabis remains illegal under RA 9165; the medical bill is pending in the Senate. Only narrow FDA compassionate special permits exist |
| ME | Montenegro | legal_commercial_access | Cultivation is criminal regardless of intent and no medical programme exists, but the only sources located were consumer blogs — below the bar for publishing a `prohibited` colour |
| FJ | Fiji | medical_limited_trade | Medical cannabis illegal, legislation still in drafting; the industrial-hemp basis for a `cbd_hemp_only` row was not attributable to a source meeting the bar |

`ME` and `FJ` are excluded on **source quality**, not on the substance of the
finding. Both are candidates for a later tranche if a qualifying source is located.

## Verification performed

Validated against PostgreSQL 16 using the real DDL from `20260831130000` and
`20260831130500` with a `public.countries` stub:

- 18 rows insert and all 18 resolve to `published_from_evidence`.
- Re-running the migration is idempotent (upsert on `evidence_key`).
- An omitted jurisdiction (`LB`) stays `NULL` after refresh.
- Expiring a row neutralises its jurisdiction (`neutralized_no_current_evidence`,
  published count 18 → 17).
- A second active direct row for an already-covered jurisdiction is rejected by
  `regulatory_market_access_evidence_one_active_direct`.

### Defect caught during validation

The first draft set `verified_at` to `2026-09-07 12:00:00+00`. The resolver
requires `verified_at <= now()`, and the migration was authored at 03:49 UTC the
same day, so **all 18 rows applied cleanly and published nothing** — a silent
no-op that reported success. `verified_at` was moved to `2026-09-07 00:05:00+00`.

Any future tranche must backdate `verified_at`, never set it to a wall-clock time
that may still be in the future when the migration runs.

## Rollback

```sql
delete from public.regulatory_market_access_evidence where evidence_key like 'hv-mkt-%-20260907';
select * from api.refresh_verified_market_access_tiers('rollback-tranche-two');
```

The refresh returns the affected jurisdictions to `NULL` (neutral). No other
table is touched and `countries.regulatory_tier` is not modified.

## Coverage after this tranche

National jurisdictions publishing a tier: 29 → 47 of 203. The remaining 156 stay
neutral by design until evidence exists for them.

---

# Tranche 3 — 29 further jurisdictions (same day)

`supabase/migrations/20260907140000_market_access_evidence_tranche_three.sql`.

Tranche 2 prioritised by `opportunity_score`, which left Africa, Central Asia and
the Middle East neutral by default. That is a reporting defect, not a judgement:
under the fail-closed contract an unresearched jurisdiction and a closed one both
render neutral gold, so the globe could not distinguish *"we have not looked"*
from *"this market is closed"*.

Tranche 3 addresses that directly, and is the first tranche anywhere to publish
`prohibited`. Before it, **no jurisdiction on the globe carried a published
`prohibited` tier.**

Same sourcing bar and the same egress limitation as tranche 2 — no `authority_url`
here was loaded and read directly either.

## Published

**`legal_commercial_access` (4)** — Zambia (Cannabis Act 2021 No. 33 + Industrial
Hemp Act 2021 No. 34, ZAMRA lead agency; source is ZambiaLII, the official legal
information institute), Rwanda (Ministerial Order No 003/MoH/2021, eight licence
types, NAEB export licence tied to a verified foreign buyer), Barbados (Medicinal
Cannabis Industry Act 2019, BMCLA, eight licence categories including export),
Vanuatu (Medical Cannabis and Industrial Hemp Act 2021, regulations gazetted 2023).

**`medical_limited_trade` (11)** — Switzerland, Slovenia, Lithuania, Argentina,
Chile, Ecuador, Mexico, Paraguay, Sri Lanka, Trinidad and Tobago (Cannabis Control
Act 2022, sourced to the Parliament's own published Act), Saint Kitts and Nevis.

**`cbd_hemp_only` (2)** — China (Category I narcotic with no medical exception,
alongside one of the world's largest licensed industrial-hemp sectors) and India
(NDPS s.14 licensed cultivation for fibre, seed, horticulture and medical research;
four states license low-THC hemp; bhang falls outside the Act's cannabis definition).

**`prohibited` (12)** — Bulgaria and Slovakia (CMS Expert Guides country pages),
Hungary, Sweden, Russia, Belarus, Serbia, Moldova, Singapore, Nigeria, Kenya,
Tanzania.

## Abstentions in this tranche

| ISO | Jurisdiction | Why no row |
|-----|--------------|------------|
| UG | Uganda | The Narcotic Drugs and Psychotropic Substances (Control) Act 2015 licensed cultivation, processing and export — but Uganda's Constitutional Court **nullified that Act in May 2023** on quorum grounds. The Judiciary later clarified the ruling did not legalise cannabis. Current statutory basis is unresolved; publishing either tier would misstate it. |
| CD | DR Congo | Legislation of 27 February 2021 permits medical, industrial and scientific use, but sources conflict on whether any medicinal programme actually operates. |
| LV | Latvia | "Limited medical access, low product availability" is too vague to map onto a tier. |
| — | Gulf states (SA, AE, QA, KW, OM, BH) | Prohibition is not in doubt, but the sources located were aggregate journalism and advocacy trackers rather than a legal or regulatory source. Deferred rather than published below the bar. |
| — | Malaysia, Indonesia, Vietnam | Same reason as the Gulf: sourced only through comparative death-penalty reporting. |

Uganda and DR Congo are the substantive catch of this tranche. Both appear on
widely-repeated "African countries with legal medical cannabis" lists — the
eleven-country figure that circulates in industry reporting — and checking each
one individually is what surfaced that neither currently supports a published tier.
A regional bulk assignment would have got both wrong.

## Verification

Applied to the same PostgreSQL 16 harness on top of tranche 2:

- 29 rows insert; all 29 resolve `published_from_evidence`.
- All 18 tranche-2 rows return `verified_unchanged` — the tranches do not interfere.
- `LB` remains `neutral_unchanged`.
- Live pre-check: all 29 ISO codes exist in `public.countries`, none already
  publishes a tier, so there is no FK failure and no uniqueness collision.

## Coverage after tranches 2 and 3

National jurisdictions publishing a tier: **29 → 76 of 203**. Counted across both
tranches: Africa +10, Europe +17, Americas +12, Asia +7, Oceania +1.

127 national jurisdictions still publish `NULL`. That is not finished work — it is
the remaining backlog, and most of it is the deep tail (small island states, much
of West and Central Africa, Central Asia) plus the deferred Gulf and Southeast
Asian rows above, which need a source meeting the bar rather than more searching.
