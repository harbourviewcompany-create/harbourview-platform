# Command Centre Integration Rule

Status: IMPLEMENTED ON DRAFT PR #1257 — MERGE AND PRODUCTION DEPLOYMENT NOT AUTHORIZED  
Date: 2026-08-02

## Governing rule

Harbourview has two canonical authenticated customer shells:

- Desktop: `components/dashboard/CommandCentre.tsx`
- Mobile: `components/dashboard/MobileCommandCentre.tsx`

Every customer-facing authenticated capability must be discoverable and usable from the appropriate shell. A route, API, migration, database table, branch or preview is not completed product delivery unless the capability is integrated into the desktop and mobile Command Centre experience.

## Shared integration architecture

- `lib/dashboard/commandCentreIntegration.ts` — canonical module registry and deep-link builder.
- `components/dashboard/CommandCentreIntegrationGateway.tsx` — shared desktop/mobile module navigation and rendering boundary.
- `components/dashboard/DashboardResponsiveShell.tsx` — selects the canonical desktop or mobile shell and routes both through the gateway.
- `middleware.ts` — preserves authentication and tier checks, then resolves exact authenticated product roots into `/dashboard` modules.

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

The following remain outside the authenticated shell where appropriate:

- public acquisition and SEO pages;
- public marketplace, supply and entity-detail pages intended for anonymous discovery;
- authentication, account recovery and onboarding;
- admin and operator controls;
- API, callback, webhook, cron and infrastructure routes;
- focused transaction forms and detailed entity pages opened from a Command Centre module.

Known authenticated standalone entry routes resolve to the shell:

- `/dashboard/my-briefings` → `/dashboard?page=digest&module=personal-briefings`
- `/dashboard/signals/search` → `/dashboard?page=signals&module=search`

Exact protected product roots resolve after authentication and tier enforcement:

- `/signals`, `/intelligence`, `/genetics`, `/network`, `/opportunities`, `/reviewed-connections`, `/professionals`, `/assessments`, `/compliance`, `/education`, `/marketplace/my-listings`.

## Definition of done

An authenticated customer capability is complete only when:

1. It is registered in the shared module registry.
2. It is discoverable from both desktop and mobile.
3. It preserves country and role context.
4. It uses the same data, permission and entitlement boundary.
5. Loading, error and empty states exist where data is asynchronous.
6. Canonical deep links resolve into the shell.
7. Unit and route-contract tests pass.
8. Browser verification covers 320, 375, 390, 430, 768 and desktop widths.
9. Screenshot and command evidence are attached before merge.
10. A new standalone authenticated workspace requires an explicit documented exception.

## Release boundary

PR #1257 remains draft. No merge, production deployment, production alias movement, database migration, secret change or production data write is authorized by this document.
