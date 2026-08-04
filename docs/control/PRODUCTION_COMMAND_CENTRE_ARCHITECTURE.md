# Harbourview Production Command Centre Architecture

**Status:** implementation control document  
**Branch:** `build/harbourview-production-command-platform`  
**Target:** one production platform shell across desktop and mobile, with every built capability rendered inside the Command Centre or Mobile Command Centre.

## 1. Product decision

Harbourview is not a collection of disconnected pages. It is one regulated-market operating platform with a controlled public/private boundary.

The production application uses:

- a **public entry layer** for brand, authentication, legal and accessibility routes;
- a **single Command Centre application shell** for market access, intelligence, marketplace, education, clinical, compliance, directories, talent, genetics, network and financing;
- **in-shell transactional workflows** for wanted requests, supply submissions, financing, confidential intake, quote requests, listing review and document collection;
- an **admin/operator shell** for protected review, publication, provenance, evidence, counterparty and operational controls.

Standalone product pages are migration sources, not the target architecture. They remain reachable only until their data, disclaimer, accessibility, SEO and workflow contracts have full parity inside the Command Centre.

## 2. Canonical runtime model

### Public entry layer

The following remain independent routes because they are not product modules:

- `/`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/auth/callback`
- `/privacy`
- `/terms`
- `/accessibility`

Everything else is classified in `config/command-centre-routes.mjs` as:

- `redirect-now`: already represented by desktop and mobile command modules;
- `retain-public`: canonical public/SEO entry surface retained outside the authenticated operating shell;
- `redirect-now`: legacy or transactional route with verified authenticated Command Centre parity and reload restoration;
- `intercept-next`: transitional route awaiting a contained workflow (none remain in the current route policy).

### Canonical product URL

The current production-safe canonical URL remains:

`/dashboard?page=<desktopPage>&country=<ISO2>&role=<roleId>`

The shell must preserve country, region, role, page, section, action, filters and selected record through navigation.

A later route-quality pass may introduce `/command/<module>` aliases, but it must not duplicate loaders or create a second application architecture.

## 3. Command module registry

`config/command-centre-routes.mjs` is the first canonical route registry. Every module has:

- stable ID;
- desktop `CommandPage` target;
- mobile section target;
- launch criticality;
- legacy route policy.

The registry must become the source for:

- desktop navigation;
- mobile section navigation;
- route redirects;
- command palette;
- access checks;
- breadcrumb and deep-link generation;
- analytics event naming;
- route-contract tests;
- production readiness reporting.

No new module should be added directly to one shell without a registry entry and parity test.

## 4. Shell architecture

### Desktop

`components/dashboard/CommandCentre.tsx` remains the desktop application surface, but its current monolithic structure must be split into:

- `CommandCentreShell`
- `CommandCentreHeader`
- `CommandCentreNavigation`
- `CommandCentreContextBar`
- `CommandCentreModuleOutlet`
- focused module components under `components/dashboard/modules/*`

The shell owns layout, context, navigation, keyboard behavior, responsive boundaries, error states and telemetry. Modules own presentation and module-specific interaction.

### Mobile

The Mobile Command Centre is not a reduced dashboard. It must expose the same capability universe with mobile-native information hierarchy.

Required mobile behavior:

- full section registry;
- persistent five-destination bottom navigation;
- horizontal section rail or command palette for the complete module universe;
- country and role context controls;
- safe-area handling;
- no horizontal overflow at 320, 360, 375, 390 and 430;
- transactional workflows as sheets, drawers or full-height command panels;
- deterministic loading, empty, partial, error and stale states;
- reduced-motion support;
- 44–48px interactive targets;
- no floating module launcher.

### Shared module contract

Every module should accept a shared contract:

```ts
type CommandModuleContext = {
  countryIso2: string | null
  regionCode: string | null
  roleId: string | null
  userId: string | null
  organizationId: string | null
  access: FeatureAccess
  dataState: 'live' | 'partial' | 'fallback' | 'empty' | 'error'
  refreshedAt: string | null
}
```

Desktop and mobile modules can use different layouts, but they must consume the same normalized server data and enforce the same visibility boundary.

## 5. Server data architecture

The current dashboard page performs too much orchestration directly. Extract one server-only loader:

`lib/dashboard/loadCommandCentreData.ts`

Responsibilities:

1. resolve session and user identity;
2. resolve role and jurisdiction context;
3. resolve organization membership and feature access;
4. execute independent data requests with `Promise.allSettled`;
5. normalize every result into public, authenticated or admin-safe DTOs;
6. attach source state, freshness and error metadata;
7. avoid module-wide failure when one source is unavailable;
8. never expose service-role data to client components;
9. support both `/dashboard` and country-role entry routes;
10. return a stable serializable `CommandCentreData` object.

No module should query Supabase directly from a client component.

## 6. Authentication and authorization

Production auth uses Supabase SSR cookie sessions.

Required controls:

- server-side identity resolution for every protected request;
- request-scoped Supabase clients only;
- admin/operator authorization from the existing role model;
- RLS as the final database boundary;
- service-role access only in server-only modules;
- exact route matching for auth exceptions;
- no client-side authorization as the sole gate;
- preserved reset, recovery and callback URLs;
- session refresh coverage in the Next.js proxy/middleware path;
- authenticated Playwright storage state kept out of the repository.

## 7. Marketplace and confidentiality boundary

The marketplace is a revenue and transaction layer inside Harbourview, not a public supplier directory.

The Command Centre must support:

- cannabis supply;
- wanted demand;
- equipment;
- consumables and packaging;
- new products;
- services;
- distressed assets and business opportunities;
- trade financing;
- confidential intake;
- quote and introduction requests;
- submission status;
- controlled matching and deal-room progression.

Public and authenticated DTOs must exclude private provenance, source evidence, internal review notes, reviewer identity, authorization status and raw source URLs.

Transactional routes remain direct-load capable until their intercepted in-shell equivalent is verified.

## 8. Education, clinical and compliance parity

The following routes cannot be retired until their exact disclaimer, source-status and review-gate behavior is reproduced in the command shell:

- `/intelligence/licensing-pathways`
- `/intelligence/logistics-trade-routes`
- `/intelligence/source-engine`
- `/intelligence/watchlists`
- `/education/compliance-readiness`
- `/education/export-import-readiness`
- `/education/pharmaceutical-medical-cannabis`
- `/education/cannabis-history-library`
- `/policy-standards/regulatory-change-tracker`
- `/network/clinical-education`

Retirement requires passing the existing HAR-39/HAR-40 tests against the embedded command module, not deleting the safety copy.

## 9. Reliability and error handling

The production shell requires:

- route-level `loading.tsx`;
- route-level `error.tsx`;
- module-level error isolation;
- stale-data labeling;
- source-specific fallback states;
- retry controls;
- no blank shell when one query fails;
- health endpoint and dependency checks;
- Sentry error correlation;
- structured server logs with request/module identifiers;
- no production console leakage;
- safe failure before presenting unreliable conclusions.

This branch adds the dashboard loading and error boundaries as the first reliability layer.

## 10. Performance

Production targets:

- initial shell and primary action visible before secondary modules finish;
- no duplicate desktop/mobile DOM after hydration;
- route-level code splitting by module;
- dynamic import for heavy charts, maps, globe and document viewers;
- server-side data aggregation to reduce client waterfalls;
- image optimization for all remote product assets;
- no unbounded list rendering;
- list pagination or virtualization where volume warrants it;
- database and function region aligned with Vercel;
- measured Core Web Vitals on preview and production.

## 11. Accessibility

Required:

- WCAG 2.2 AA;
- keyboard-complete navigation;
- visible focus states;
- correct tab/tabpanel semantics;
- skip link to active module;
- headings in logical order;
- screen-reader announcements for context changes and async results;
- large-text reflow;
- reduced motion;
- no bottom-navigation obstruction;
- accessible error and empty states;
- contrast verification for gold, muted text and status colors.

## 12. Observability and release control

Every release must provide:

- exact commit SHA;
- Vercel preview URL and deployment ID;
- lint, typecheck, unit, integration and build results;
- authenticated desktop and mobile screenshots;
- browser console and page-error results;
- horizontal-overflow and fixed-obstruction metrics;
- route redirect matrix results;
- public leakage results;
- RLS/auth verification;
- production-safe no-write confirmation;
- changed-file list;
- unresolved review-thread count;
- final GO/HOLD.

Vercel production promotion remains separate from build completion. Preview verification must pass before promotion.

## 13. Execution sequence

Sequencing does not reduce scope.

### Build packet A — registry and shell control

- establish canonical module/route registry;
- centralize desktop and mobile navigation from registry;
- add loading/error boundaries;
- add route contract tests;
- remove duplicate module definitions.

### Build packet B — shared data loader

- extract `loadCommandCentreData`;
- normalize DTOs and source states;
- use the loader from dashboard and country-role entry routes;
- add loader tests and degraded-source fixtures.

### Build packet C — module parity

- embed all read-only product routes;
- preserve disclaimer and live-data behavior;
- activate redirects only after parity tests pass.

### Build packet D — transactional overlays

- convert intake, wanted, sell, quote and financing routes into intercepted command workflows;
- retain hard-navigation fallback routes;
- add authenticated and anonymous flow tests.

### Build packet E — production evidence

- full test suite;
- Vercel preview;
- authenticated visual matrix;
- accessibility audit;
- leakage and RLS verification;
- performance and observability evidence;
- final operator review.

## 14. Current branch state

Implemented in this branch:

- canonical module and route policy registry;
- first set of safe command-centre redirects;
- public/auth/legal route exceptions;
- route-registry contract tests;
- dashboard loading state;
- dashboard recovery boundary;
- production architecture and Claude implementation handoff.

Not yet complete:

- shared server loader extraction;
- registry-driven desktop/mobile navigation;
- full standalone route retirement;
- transactional intercepted routes;
- full preview evidence and production promotion.

The branch remains implementation-active and must stay draft until all acceptance gates are satisfied.


## Controlled customer-facing copy contract

`lib/platform/commandCentreCopy.ts` is the sole customer-facing control-copy module for the Command Centre surface. It is governed by this document and covers:

- public/private projection and reviewed-access language;
- evidence, authorization and counterparty-release boundaries;
- degraded, stale, fallback, empty and failure-state assurances;
- marketplace, supply, talent, clinical, compliance, network and financing controls;
- support and recovery language.

Components must consume this module rather than introducing local control claims. Neutral labels, factual data values and accessibility-only labels may remain local when they make no legal, trust, privacy, evidence or reliability commitment.

## Demand-driven source contract

`lib/dashboard/commandCentreSourcePlan.ts` defines the exact source keys required by each supported desktop page. `lib/dashboard/buildDashboardCommandSources.ts` builds the typed source map and marks all unrequested sources as disabled. Disabled sources return typed fallback values without network or database execution and are excluded from requested-source health aggregation.

The default route resolves to the Briefing Room plan. Page-specific navigation therefore pays only for sources rendered by that page while retaining a stable prop contract across both responsive shells.

## Public and authenticated route boundary

Public intelligence, market, education, compliance, network and marketplace browse pages remain canonical public entry surfaces under `retain-public`. They preserve guest access, SEO, disclaimers and public-safe projection contracts. The authenticated Command Centre is the operating surface.

The supply, wanted and financing legacy transaction routes redirect into verified, URL-addressable Command Centre workflows. Confidential `/intake` remains public and shareable because authentication is not a prerequisite for initiating a confidential discussion.

## Isolated local Supabase evidence boundary

Loopback Supabase endpoints are accepted only for a GitHub Actions evidence build carrying all explicit CI markers, a GitHub run identifier and the repository-specific workflow contract. Vercel and other hosted runtimes are always denied. The production application allowlist remains locked to the canonical Supabase project. This controlled evidence build produces a production-optimized Next.js artifact against an ephemeral local database without authorizing loopback endpoints in deployed runtime environments.


## Production release closure

- `lib/dashboard/commandCentreSourcePlan.ts` is the complete page-to-source dependency contract. A route may not execute an unlisted source.
- `lib/dashboard/buildDashboardCommandSources.ts` is the server-only source-definition boundary and is independently unit tested.
- `lib/platform/commandCentreCopy.ts` is the canonical customer-facing control-copy contract.
- Public orientation and SEO routes remain canonical public entry surfaces. Verified authenticated transaction routes redirect into URL-addressable in-shell workflows.
- Local Supabase is permitted only in GitHub Actions with a numeric workflow run identifier and the complete isolated-build marker set.
- Database release requirements are controlled by `docs/control/SUPABASE_PRODUCTION_SECURITY_HARDENING.md`.
