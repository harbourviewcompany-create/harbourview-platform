# Market Access Primary-Source Hardening Standard

Status: HOLD until the complete jurisdiction universe is individually sourced.

Effective: 2026-09-16.

## Production acceptance contract

Every jurisdiction published by the Market Access globe must have one individually reviewed primary source. The required inventory is the 203 national jurisdiction rows plus the 88 currently rendered subnational rows: 291 jurisdiction keys total.

A qualifying source must be one of:

- the jurisdiction's cannabis regulator;
- the jurisdiction's government legal database or enacted law/regulation;
- the jurisdiction's official gazette;
- a jurisdiction-specific court or other official decision that directly establishes the applicable cannabis market-access rule.

The following do not qualify as the final provenance source:

- CannabisRegulations.ai or any other legal tracker/aggregator;
- NCSL or other secondary policy summaries;
- INCB, UNODC, WHO or other international aggregate reports when used instead of the jurisdiction's own primary law/regulator;
- Wikipedia, news articles, commercial legal guides, consulting summaries, or market databases;
- a generic government home page that does not itself establish the relevant rule;
- a parent-country/federal source reused for a subnational row when the subnational jurisdiction has its own controlling authority or legal publication;
- one URL reused for more than one jurisdiction.

## Required provenance fields

Each registry row must contain:

- jurisdiction key and level;
- parent jurisdiction for subnational rows;
- authority name;
- unique HTTPS authority URL;
- exact source title;
- source effective date where determinable;
- fetch/read verification timestamp;
- source expiry/freshness deadline;
- SHA-256 snapshot hash of the reviewed source content;
- notes documenting the exact rule relevant to Harbourview's five-tier commercial market-access ontology.

A source is not considered verified merely because its URL was discovered in search results. The source must be opened/read and the relevant legal or regulatory provision reconciled with the published tier.

## Tier mapping rule

The primary source establishes the underlying legal/regulatory fact. Harbourview's five-tier commercial market-access classification remains a derived product classification:

`prohibited` / `cbd_hemp_only` / `medical_limited_trade` / `domestic_only` / `legal_commercial_access`.

Where the source establishes multiple relevant rules, the evidence record must document why the selected tier follows from the commercial market-access definition. Conflicting or incomplete primary sources remain neutral/HOLD; they are not resolved by secondary-source consensus or model inference.

## Freshness

A primary-source row is current only when `expires_at > now()`. Source effective dates cannot be future-dated. A changed law, regulator page, gazette publication, court decision, or other material regulatory event requires re-verification and a new snapshot hash.

## Uniqueness

The registry enforces uniqueness of normalized source URL. The final hardening gate also rejects a primary-source URL that is identical to the currently published evidence URL. This prevents the existing secondary evidence layer from being silently relabeled as primary provenance.

## Subnational rule

Subnational rows are first-class jurisdictions. They cannot inherit a parent country's tier or provenance. The current rendered set is 88 rows across US/DC, Canadian provinces/territories, German Länder, and Australian states/territories.

## Release gate

Production GO requires all of the following:

1. 203/203 national rows hardened.
2. 88/88 rendered subnational rows hardened.
3. 291/291 total hardened.
4. Zero missing, expired, wrong-level, wrong-parent, missing-snapshot, future-effective, reused-current-evidence, or duplicate-source failures.
5. Fresh CI, typecheck, tests, build, migration-drift, security, and production-read-only verification green.
6. Globe rendering confirms the same 379-jurisdiction publication boundary without legacy or inherited fallback.

Until all six conditions are true, the release status is HOLD.
