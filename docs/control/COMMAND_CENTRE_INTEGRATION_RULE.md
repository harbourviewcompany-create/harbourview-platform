# Command Centre Integration Rule

Status: IMPLEMENTED ON DRAFT PR #1257 — MERGE AND PRODUCTION DEPLOYMENT NOT AUTHORIZED  
Date: 2026-08-02

## Governing rule

Harbourview has two canonical authenticated customer shells:

- Desktop: `components/dashboard/CommandCentre.tsx`
- Mobile: `components/dashboard/MobileCommandCentre.tsx`

Every customer-facing authenticated capability must render inside the appropriate canonical shell. A route, API, migration, database table, branch or preview is not completed product delivery unless the capability is integrated into both the desktop and mobile Command Centre experience.

Standalone authenticated customer feature pages are prohibited. A capability that needs a dedicated view must be implemented as a Command Centre module, nested module state or focused module action. Deep links may remain stable, but after authentication and entitlement enforcement they must resolve into the correct Command Centre module.

## Shared integration architecture

- `lib/dashboard/commandCentreIntegration.ts` — canonical module registry and deep-link builder.
- `components/dashboard/CommandCentreIntegrationGateway.tsx` — shared module navigation and renderer. Custom modules are portaled into `.cc-main` or `.hvm-main`, so the real `CommandCentre` or `MobileCommandCentre` remains mounted and visible for every authenticated capability.
- `components/dashboard/DashboardResponsiveShell.tsx` — selects the canonical desktop or mobile shell and routes both through the gateway.
- `middleware.ts` — preserves authentication and tier checks, then resolves authenticated feature routes and descendants into `/dashboard` modules, actions and focused nested state.

The navigation work from PR #1249 is incorporated into PR #1257. PR #1257 is the single integration branch and no longer waits on a separate navigation PR.

## Canonical modules

1. Briefing
2. Digest
3. My Briefings
4. Intel
5. Search
6. Compliance
7. Market
8. Marketplace
9. Supply
10. Financing
11. Directories
12. Talent
13. Genetics
14. Clinical
15. Watchlist
16. Pathways

Country and role context are preserved in generated module URLs.

## Route boundaries

The following may remain outside the authenticated customer shell because they are not authenticated customer product workspaces:

- public acquisition and SEO pages;
- public marketplace, supply and public entity-detail pages intended for anonymous discovery;
- authentication, account recovery and onboarding;
- account billing and subscription administration;
- admin and operator controls;
- API, callback, webhook, cron and infrastructure routes.

Authenticated customer feature routes must resolve into the shell, including focused transaction flows and feature details. The shell may use `module`, `action` and `focus` query state to preserve the requested capability or nested record.

Known authenticated entry routes include:

- `/dashboard/my-briefings` → `/dashboard?page=digest&module=personal-briefings`
- `/dashboard/signals/search` → `/dashboard?page=signals&module=search`
- `/marketplace/financing` → `/dashboard?page=marketplace&module=financing`
- `/marketplace/sell` → `/dashboard?page=marketplace&action=sell`
- `/marketplace/intake` → `/dashboard?page=marketplace&action=intake`
- `/marketplace/my-listings` → `/dashboard?page=marketplace&action=my-listings`

Protected route families resolve after authentication and tier enforcement:

- `/signals/**`
- `/intelligence/**`
- `/genetics/**`
- `/network/**`
- `/opportunities/**`
- `/reviewed-connections/**`
- `/professionals/**`
- `/assessments/**`
- `/compliance/**`
- `/education/**`
- the authenticated marketplace routes listed above.

## Definition of done

An authenticated customer capability is complete only when:

1. It is registered in the shared module registry.
2. It renders inside `CommandCentre` and `MobileCommandCentre`, not a replacement standalone frame.
3. It is discoverable from both desktop and mobile.
4. It preserves country, role and requested nested state.
5. It uses the same data, permission and entitlement boundary.
6. Loading, error and empty states exist where data is asynchronous.
7. Canonical deep links resolve into the shell after auth and tier checks.
8. Unit and route-contract tests pass.
9. Browser verification covers 320, 375, 390, 430, 768 and desktop widths.
10. Screenshot and command evidence are attached before merge.

## Release boundary

PR #1257 remains draft. No merge, production deployment, production alias movement, database migration, secret change or production data write is authorized by this document.
