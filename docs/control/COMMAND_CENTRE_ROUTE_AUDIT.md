# Command Centre Authenticated Route Audit

Date: 2026-08-02  
Canonical branch: `agent/command-centre-integration-rule`  
Classification vocabulary: already integrated, partially integrated, standalone, duplicated, inaccessible, inactive.

## Result

`/dashboard` is the canonical authenticated customer workspace. Desktop renders `CommandCentre`; mobile renders `MobileCommandCentre`; shared modules render through `CommandCentreIntegrationGateway`.

## Capability ledger

| Capability | Previous state | Integrated state |
|---|---|---|
| Briefing | Already integrated | Registered and preserved in both shells |
| Digest | Already integrated | Registered and preserved in both shells |
| Personal Briefings | Standalone authenticated page | Shared loader, authenticated API, entitlement enforcement and responsive module |
| Intel | Already integrated | Registered and preserved |
| Search | Standalone / partially integrated | Existing semantic search rendered inside both shells |
| Compliance | Already integrated | Registered and preserved |
| Market | Fragmented | Unified module using existing market metrics and trade-flow data |
| Marketplace | Already integrated | Registered and preserved |
| Supply | Public catalogue plus fragments | Authenticated module using existing marketplace DTO rows; public routes preserved |
| Financing | Standalone form | Existing form reused inside both shells; public form preserved |
| Directories | Duplicated | Unified professionals, providers and operators module |
| Talent | Placeholder / separate surface | Shared module backed by `talent_jobs_public` |
| Genetics | Already integrated | Registered and preserved |
| Clinical | Already integrated | Registered and preserved |
| Watchlist | Already integrated | Registered with existing entitlement boundary |
| Pathways | Already integrated | Registered and preserved |

No requested top-level capability remains intentionally inaccessible or inactive.

## Route-family ledger

| Route or family | Classification | Canonical treatment |
|---|---|---|
| `/dashboard` | Already integrated | Canonical responsive shell |
| `/dashboard/my-briefings` | Previously standalone | Redirects to the Personal Briefings module |
| `/dashboard/signals/search` | Previously standalone | Redirects to the Search module |
| `/signals` | Previously duplicated | Redirects to Intel after authentication and tier checks |
| `/intelligence` | Previously duplicated | Redirects to Intel after authentication and tier checks |
| `/genetics` | Previously duplicated | Redirects to Genetics after authentication and tier checks |
| `/network` | Previously duplicated | Redirects to Directories after authentication and tier checks |
| `/opportunities` | Previously duplicated | Redirects to Marketplace after authentication and tier checks |
| `/reviewed-connections` | Previously duplicated | Redirects to Directories |
| `/professionals` | Previously duplicated | Redirects to Directories |
| `/assessments` | Previously duplicated | Redirects to Compliance |
| `/compliance` | Previously duplicated | Redirects to Compliance |
| `/education` | Previously duplicated | Redirects to Education inside the existing shell |
| `/marketplace/my-listings` | Previously duplicated | Redirects to Marketplace |
| `/dashboard/country/[country]/**` | Partially integrated | Country-aware compatibility and detail routes preserved |
| `/account/**` | Intentional standalone | Billing, recovery and account management remain separate |
| `/admin/**` | Intentional standalone | Administrative controls remain isolated |
| `/intake/**` | Intentional standalone | Confidential intake remains isolated |
| `/marketplace/sell/**` | Intentional focused flow | Launched from Marketplace; remains a focused form |
| `/vault/**` | Intentional protected exception | Separate permission and document boundary |
| Detail routes under signals, intelligence, compliance, education, genetics and professionals | Intentional deep links | Opened from the relevant Command Centre module |

## Navigation reconciliation

The country-aware mobile navigation changes formerly tracked in PR #1249 are incorporated into PR #1257. This removes the dependency that previously blocked Command Centre integration.

## Entitlement order

Canonical root redirects execute only after:

1. public exceptions are checked;
2. authentication succeeds; and
3. existing subscription-tier checks succeed.

This prevents shell redirects from bypassing Intel or Operator access controls.
