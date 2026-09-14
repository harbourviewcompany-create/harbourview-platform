# Re-sourcing the 34 retired jurisdictions — status, blocker, and two findings that change the job

**Dated 2026-09-13.** Every figure below was measured read-only against production
(`zvxdgdkukjrrwamdpqrg`) or by probing the network from this session. Nothing was
written. No evidence row was added, edited or reactivated.

Follows on from the 2026-09-11 `EVIDENCE_LOG.md` entry, "Retired 34
`verified_regulatory_tier` publications sourced below the primary/official bar",
which closes with: *"Re-sourcing all 34 against primary/official sources requires a
session with outbound egress."*

## 1. Live state — unchanged since the retirement

| check | result |
| --- | ---: |
| countries publishing a `verified_regulatory_tier` | 130 |
| active rows in `regulatory_market_access_evidence` | 96 |
| `hv-mkt-%-20260907` rows retired (`active = false`) | 34 |
| of the 34 ISO2s, how many publish a tier | **0** |

The retirement holds exactly as recorded. The 34 still fail closed, and the
re-sourcing is still outstanding.

## 2. The blocker is the same one, and it is total

Outbound egress to government, regulator, gazette and treaty-body domains is
refused by the network proxy in this session. This is not a sampling problem — 18
domains were probed across five continents plus the EU and UN bodies, by two
independent paths (`curl` and `WebFetch`), and **every one failed**:

| domain | result |
| --- | --- |
| `www.mhlw.go.jp` (Japan MHLW) | blocked |
| `www.gov.br/anvisa` (Brazil ANVISA) | blocked |
| `www.fda.moph.go.th` (Thailand FDA) | blocked |
| `www.bfarm.de` (Germany BfArM) | blocked |
| `eur-lex.europa.eu` | blocked |
| `www.legislation.gov.uk` | blocked |
| `www.loc.gov` (Library of Congress) | blocked |
| `www.who.int` | blocked |
| `www.incb.org` | blocked |
| `www.gazettes.gov.lk` (Sri Lanka) | blocked |
| `www.dre.pt` (Portugal) | blocked |
| `www.ris.bka.gv.at` (Austria) | blocked |
| `laws-lois.justice.gc.ca` (Canada) | blocked |
| `www.ecfr.gov` (US) | blocked |
| `www.fedlex.admin.ch` (Switzerland) | blocked |
| `www.riigiteataja.ee` (Estonia) | blocked |
| `www.e-tar.lt`, `e-tar.lt` (Lithuania) | blocked |

`curl` returns `000`; `WebFetch` returns `EGRESS_BLOCKED`. Web **search** works, and
returns what it returned on 2026-09-07 and 2026-09-11: law-firm client alerts,
industry trackers, news and PubMed — the exact source classes that got these 34
retired. For Japan, the first page of results is `sagepub.com` and
`pubmed.ncbi.nlm.nih.gov`; `pubmed.ncbi.nlm.nih.gov` is the rejected domain on the
retired JP row.

**Consequence:** not one of the 34 can be re-sourced to the stated bar from here.
Writing rows on search-snippet-derived URLs would reproduce the tranche-2 caveat
("No `authority_url` in this tranche was loaded and read directly") on top of
compliance-facing published content that was *just* retired for exactly that.

This is now the third session to hit this wall (2026-09-07, 2026-09-11,
2026-09-13). It is recorded here with the probe list so the fourth does not spend
the time rediscovering it.

## 3. Finding — the bar that retired these 34 is not the bar the table runs on

The 2026-09-11 retirement applied "primary/official sources only". Grouping the
**96 surviving rows** by `authority_url` host shows that bar is not what the rest of
the table rests on:

| host | active rows | class |
| --- | ---: | --- |
| `www.ncsl.org` | **51** | secondary tracker (US states) |
| `www.incb.org` | 26 | UN treaty body |
| 19 further hosts, 1 row each | 19 | government / regulator / gazette / LII |

Only 19 of 96 sit on a national government or regulator domain. **51 — more than
half the published table — rest on a single secondary tracker**, and those are the
US state rows. `REGULATORY_MARKET_ACCESS_EVIDENCE_TRANCHE_20260907.md` says so
directly: the standing bar was *"a named authority plus a citable published
source"*, seeded from NCSL, and *"'primary sources only' was never the standing bar
for this table."*

So a stricter bar was applied to 34 rows and not to the 51 that would fail it
hardest. Applied consistently, "primary/official only" retires 85 rows, not 34, and
takes every US state off the map.

That is a product decision, not a drift fix, and it is Tyler's. But the re-sourcing
job cannot be specified until it is settled, because it decides whether the work is
"find a regulator page for 34 countries" or "the 34 were held to a bar the table
does not use, and should be restored under the table's actual standard."

## 4. Finding — INCB cannot re-source 32 of the 34

The obvious shortcut is INCB: it is already an accepted authority here, covering 26
jurisdictions. It does not work for this set.

All 26 INCB rows cite **one** document — *Narcotic Drugs 2024* technical publication,
`source_effective_date` `2023-12-31` — all assign `legal_commercial_access`, and all
carry the identical rationale: *"INCB reports legal cannabis import and/or export
activity; an operational controlled cross-border supply pathway is verified."*

That is a **trade-statistics** source, and it is one-directional. Reported licensed
import/export activity supports `legal_commercial_access`. The absence of reported
activity is not evidence of prohibition, of a CBD-only regime, or of a limited
medical pathway — it is equally consistent with a legal market that did not trade
that year.

Tiers needed by the 34: `prohibited` 12, `medical_limited_trade` 16, `cbd_hemp_only`
3, `legal_commercial_access` 2 (RW, VU). **INCB can speak to at most the 2**, and
only if the 2024 tables list them — which cannot be checked from here, because
`incb.org` is blocked.

## 5. What a session that can do this work needs

1. **A decision on §3** — is the bar for this table primary/official only, or a named
   authority plus a citable published source? If the former, the 51 NCSL rows and the
   26 INCB rows need the same treatment as the 34.
2. **Egress** to government, regulator, gazette and treaty-body domains. Search alone
   is not enough and has now failed three times.
3. Then, per jurisdiction: fetch the instrument, record `authority_name`,
   `authority_url`, `source_effective_date`, and a rationale that cites what the
   instrument actually establishes — and, given the tranche-2 caveat, populate
   `source_snapshot_sha256` so a later session can tell that the URL was read rather
   than assembled from a search result.
4. Restore via a tranche migration, not by reactivating the retired rows: the retired
   `hv-mkt-%-20260907` keys record sources that failed the bar and should stay
   inactive as the audit trail.

`docs/control/rollback/20260911_retire_34_nonprimary_tiers.rollback.sql` remains
exact and sufficient if Tyler decides instead to restore the 34 as they were under
the table's standing bar. It is a one-statement revert; it is not being run here.

## 6. Not done

The 34 jurisdictions are **not re-sourced**. They still publish no tier. This
document records why, what was measured, and what unblocks it — it does not close
the item.
