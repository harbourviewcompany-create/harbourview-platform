# Command Centre Authenticated Route Audit

Date: 2026-08-02  
Canonical branch: `agent/command-centre-integration-rule`  
Classification vocabulary: already integrated, partially integrated, standalone, duplicated, inaccessible, inactive.

## Result

`/dashboard` is the only authenticated customer product workspace. Desktop renders `CommandCentre`; mobile renders `MobileCommandCentre`. Shared modules are portaled into the active shell main region rather than replacing the shell with a separate frame.

No authenticated customer feature route is intentionally left as a standalone workspace. Public discovery, authentication/account, admin/operator and infrastructure routes remain separate by design.

## Capability ledger

| Capability | Previous state | Integrated state |
|---|---|---|
| Briefing | Already integrated | Preserved in both canonical shells |
| Digest | Already integrated | Preserved in both canonical shells |
| Personal Briefings | Standalone authenticated page | Shared loader, authenticated API, entitlement enforcement and in-shell module |
| Intel | Already integrated | Preserved in both canonical shells |
| Search | Standalone / partially integrated | Existing semantic search rendered inside `.cc-main` and `.hvm-main` |
| Compliance | Already integrated | Preserved in both canonical shells |
| Market | Fragmented | Unified in-shell module using existing market metrics and trade-flow data |
| Marketplace | Already integrated | Preserved in both canonical shells |
| Supply | Public catalogue plus fragments | Authenticated in-shell module using existing marketplace DTO rows; public discovery routes remain public |
| Financing | Standalone form | Existing form reused as an in-shell module |
| Directories | Duplicated | Unified in-shell professionals, providers and operators module |
| Talent | Placeholder / separate surface | In-shell module backed by `talent_jobs_public` |
| Genetics | Already integrated | Preserved in both canonical shells |
| Clinical | Already integrated | Preserved in both canonical shells |
| Watchlist | Already integrated | Preserved with the existing entitlement boundary |
| Pathways | Already integrated | Preserved in both canonical shells |

No requested top-level authenticated capability remains standalone, inaccessible or inactive.

## Route-family ledger

| Route or family | Previous classification | Canonical treatment |
|---|---|---|
| `/dashboard` | Already integrated | Canonical responsive shell |
| `/dashboard/my-briefings/**` | Standalone | Resolves to Personal Briefings inside the shell |
| `/dashboard/signals/search/**` | Standalone | Resolves to Search inside the shell |
| `/dashboard/genetics/**` | Partially integrated | Resolves to Genetics inside the shell; descendant path is preserved as focused state |
| `/signals/**` | Duplicated / standalone details | Resolves to Intel or Search inside the shell after auth and tier checks |
| `/intelligence/**` | Duplicated / standalone details | Resolves to Intel inside the shell after auth and tier checks |
| `/genetics/**` | Duplicated / standalone details | Resolves to Genetics inside the shell after auth and tier checks |
| `/network/clinical-education/**` | Standalone | Resolves to Clinical inside the shell |
| `/network/**` | Duplicated / standalone details | Resolves to Directories inside the shell after auth and tier checks |
| `/opportunities/**` | Duplicated | Resolves to Marketplace inside the shell after auth and tier checks |
| `/reviewed-connections/**` | Duplicated | Resolves to Directories inside the shell |
| `/professionals/**` | Duplicated / standalone details | Resolves to Directories inside the shell |
| `/assessments/**` | Duplicated | Resolves to Compliance inside the shell |
| `/compliance/**` | Duplicated / standalone details | Resolves to Compliance inside the shell |
| `/education/**` | Duplicated / standalone details | Resolves to Education inside the shell |
| `/marketplace/financing/**` | Standalone form | Resolves to Financing inside the shell |
| `/marketplace/sell/**` | Focused standalone flow | Resolves to Marketplace with `action=sell` |
| `/marketplace/intake/**` | Focused standalone flow | Resolves to Marketplace with `action=intake` |
| `/marketplace/my-listings/**` | Duplicated | Resolves to Marketplace with `action=my-listings` |
| `/dashboard/country/[country]/**` | Partially integrated | Country-aware compatibility routes resolve into `/dashboard` with country and module context |
| `/account/**` | Intentional exception | Account, billing, recovery and subscription administration remain separate |
| `/admin/**` | Intentional exception | Administrative controls remain isolated |
| `/intake/**` | Intentional exception | Confidential public/private intake boundary remains separate from the product workspace |
| `/vault/**` | Intentional exception | Separate protected document boundary |
| `/api/**`, callbacks, webhooks and cron | Intentional exception | Infrastructure boundary; no customer page rendering |
| Anonymous public marketplace, supply and entity pages | Intentional public surface | Public discovery remains available without being treated as an authenticated workspace |

## Nested deep-link preservation

When a protected feature descendant is requested, middleware performs authentication and tier enforcement first, then redirects to `/dashboard` with:

- `page` for the canonical built-in shell page;
- `module` for shared in-shell modules;
- `action` for focused workflows such as sell, intake or my listings;
- `focus` for the requested descendant path or nested record.

This preserves deep-link intent without retaining a second authenticated workspace.

## Navigation reconciliation

The country-aware mobile navigation changes formerly tracked in PR #1249 are incorporated into PR #1257. This removes the dependency that previously blocked Command Centre integration.

## Entitlement order

Canonical route-family redirects execute only after:

1. public exceptions are checked;
2. authentication succeeds; and
3. existing subscription-tier checks succeed.

This prevents shell redirects from bypassing Intel or Operator access controls.
