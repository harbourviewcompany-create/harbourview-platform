# Claude Build Handoff — Harbourview Production Command Platform

## Mission

Complete the Harbourview platform as one production-grade Command Centre application across desktop and mobile.

Do not create another dashboard, launcher, microsite, duplicate route system or standalone product experience. Consolidate every built capability into the existing desktop Command Centre and Mobile Command Centre while preserving public/private separation, regulatory copy, live-data behavior, authentication, RLS and Harbourview-mediated marketplace workflows.

## Repository and branch

- Repository: `harbourviewcompany-create/harbourview-platform`
- Working branch: `build/harbourview-production-command-platform`
- Base: current `main`
- Existing draft PR: create or continue the PR for this exact branch
- Do not merge or deploy to production

## Read first

1. `AGENTS.md`
2. `docs/DO_NOT_TOUCH.md`
3. `docs/control/PRODUCTION_COMMAND_CENTRE_ARCHITECTURE.md`
4. `config/command-centre-routes.mjs`
5. `docs/control/PROJECT_STATE.md`
6. `docs/control/BUILD_CONTROL.md`
7. `docs/control/VERIFICATION_PLAN.md`
8. `docs/control/EVIDENCE_LOG.md`
9. `components/dashboard/CommandCentre.tsx`
10. `components/dashboard/MobileCommandCentreRebuild.tsx`
11. `components/dashboard/DashboardResponsiveShell.tsx`
12. `app/dashboard/page.tsx`
13. `app/country/[country]/role/[role]/page.tsx`
14. `lib/platform/capabilityRegistry.ts`
15. `lib/dashboard/dashboardLiveData.ts`
16. `lib/dashboard/dashboardServerData.ts`
17. `lib/supabase/server.ts`
18. `proxy.ts` or `middleware.ts`, whichever is active

## Required outcome

The final PR must deliver:

- one canonical Command Centre platform;
- complete desktop/mobile module parity;
- every existing built product capability wired to live or explicitly labelled fallback data;
- no product capability stranded as a separate user experience;
- public entry and legal/auth routes preserved;
- transaction flows rendered in-shell with direct-load fallbacks;
- a shared server data loader;
- registry-driven navigation and route contracts;
- full loading, empty, partial, stale and error states;
- no private evidence or provenance leakage;
- production preview evidence;
- a clean, reviewable PR.

## Implementation instructions

### 1. Reconcile branch before editing

- Fetch latest `main`.
- Inspect the current branch diff.
- Preserve the working Mobile Command Centre build already on this branch.
- Rebase or merge `main` only if required to include newer auth/security fixes.
- Resolve conflicts without removing active safeguards.
- Report the exact base and head SHA in the PR body.

### 2. Make the route registry canonical

Use `config/command-centre-routes.mjs` as the authoritative module and route policy source.

Create a typed adapter such as:

- `lib/platform/commandCentreRegistry.ts`

The typed registry must be consumed by:

- desktop navigation;
- mobile section navigation;
- command palette;
- route normalization;
- route tests;
- analytics names;
- production-readiness reporting.

Remove duplicated hard-coded module lists after parity is verified.

### 3. Extract the shared server loader

Create:

- `lib/dashboard/loadCommandCentreData.ts`
- `lib/dashboard/commandCentreDataTypes.ts`

The loader must:

- accept country, region, role, page, user and organization context;
- resolve Supabase SSR auth server-side;
- execute independent data sources with `Promise.allSettled`;
- normalize results into serializable DTOs;
- attach `live | partial | fallback | empty | error` states;
- attach freshness timestamps and safe source labels;
- keep service-role access server-only;
- preserve public/auth/admin projection boundaries;
- support both `/dashboard` and `/country/[country]/role/[role]` entry routes;
- avoid one source failure blanking the entire shell.

Replace duplicated orchestration in both entry routes with this loader.

### 4. Modularize desktop Command Centre

Split `components/dashboard/CommandCentre.tsx` without changing behavior into:

- `CommandCentreShell.tsx`
- `CommandCentreHeader.tsx`
- `CommandCentreNavigation.tsx`
- `CommandCentreContextBar.tsx`
- `CommandCentreModuleOutlet.tsx`
- `modules/BriefingModule.tsx`
- `modules/MarketplaceModule.tsx`
- `modules/SignalsModule.tsx`
- `modules/WatchlistModule.tsx`
- `modules/MarketIntelligenceModule.tsx`
- `modules/AccessPathwayModule.tsx`
- `modules/RegulatoryModule.tsx`
- `modules/LocalIntelModule.tsx`
- `modules/CountriesModule.tsx`
- `modules/EvidenceModule.tsx`
- `modules/EducationModule.tsx`
- `modules/GeneticsModule.tsx`
- `modules/ClinicalModule.tsx`
- `modules/ComplianceModule.tsx`
- `modules/LicencesModule.tsx`
- `modules/DirectoriesModule.tsx`
- `modules/TalentModule.tsx`
- `modules/NetworkModule.tsx`
- `modules/LogisticsModule.tsx`
- `modules/BankingModule.tsx`
- `modules/InsuranceModule.tsx`
- `modules/TradeCalculatorModule.tsx`
- `modules/FinancingModule.tsx`
- `modules/EventsModule.tsx`
- `modules/AssistantModule.tsx`
- `modules/DocumentsModule.tsx`
- `modules/NotificationsModule.tsx`
- `modules/OrganizationModule.tsx`
- `modules/SettingsModule.tsx`
- `modules/KybModule.tsx`

Keep files focused. Avoid replacing real implementations with placeholders.

### 5. Complete Mobile Command Centre parity

The mobile shell must contain every module in the registry.

Required:

- five-destination bottom navigation;
- complete module rail or accessible command palette;
- context controls for country, region and role;
- section deep links;
- no floating Modules launcher;
- no horizontal overflow at 320, 360, 375, 390, 430;
- 768px transition to desktop;
- action queue;
- market intelligence;
- marketplace and supply;
- signals and briefing;
- search;
- education;
- jurisdiction;
- pipeline and review gates;
- directories and talent;
- genetics;
- clinical;
- compliance;
- network;
- financing;
- loading, empty, partial, error and stale states.

Do not reduce the module universe to fit mobile. Use navigation and progressive disclosure.

### 6. Embed standalone read-only routes

For every route classified `redirect-after-parity`:

1. inspect the source page;
2. identify live queries, disclaimers, states, CTAs, SEO contract and tests;
3. move or reuse the implementation inside the matching command module;
4. preserve all required safety copy;
5. add parity tests;
6. change its route policy to `redirect-now` only after parity passes;
7. keep the legacy URL as a temporary non-permanent redirect.

The nine routes protected in `docs/DO_NOT_TOUCH.md` require explicit parity proof before retirement.

### 7. Convert transactional routes to in-shell workflows

For routes classified `intercept-next`, use Next.js App Router intercepted/parallel routes where appropriate, or an equivalent command drawer/sheet architecture.

Required workflows:

- confidential intake;
- submit supply;
- post wanted demand;
- quote request;
- financing request;
- listing detail;
- wanted detail;
- submission status;
- reviewed introduction request;
- document/evidence upload where authorized.

Hard navigation to the original URL must still render a complete fallback. Soft navigation inside the platform must preserve the command shell.

### 8. Preserve access and confidentiality boundaries

Verify:

- anonymous/public DTOs;
- authenticated DTOs;
- admin/operator DTOs;
- exact role gates;
- RLS enforcement;
- no service-role use in client bundles;
- no supplier identity leakage;
- no raw source URLs;
- no private evidence;
- no internal review notes;
- no reviewer identity;
- no authorization status leakage;
- no automatic publication or direct seller bypass.

Extend existing leakage probes to the new command modules and bundles.

### 9. Production reliability

Complete:

- route-level loading and error states;
- module-level error isolation;
- retry behavior;
- stale-data labels;
- health endpoint verification;
- Sentry correlation;
- structured server logs;
- no production console errors;
- no infinite loading;
- no blank shell when one data source fails;
- rate limiting for write routes;
- idempotency for submission routes;
- safe write gates for production smoke tests.

### 10. Accessibility and responsive quality

Verify WCAG 2.2 AA and:

- 44–48px targets;
- logical heading order;
- keyboard navigation;
- visible focus;
- skip navigation;
- screen-reader labels;
- tab/tabpanel semantics;
- reduced motion;
- large-text reflow;
- safe-area support;
- no fixed-nav obstruction;
- contrast;
- error announcements;
- responsive behavior at 320, 360, 375, 390, 430, 768, 820, 1024, 1440.

### 11. Performance

- split heavy modules with dynamic imports;
- keep client boundaries narrow;
- avoid duplicate desktop/mobile DOM;
- remove unbounded queries and lists;
- paginate or virtualize high-volume records;
- prevent client waterfalls;
- optimize images;
- verify no secrets or server-only modules enter client bundles;
- measure build output and route bundle changes;
- verify Core Web Vitals on preview.

### 12. Tests

Run and pass:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Also run all existing repository-specific safety suites, including:

- full-scope routes/content/education/compliance/marketplace;
- visibility and leakage probes;
- HAR-39/HAR-40 public surfaces;
- clinical education;
- regulatory signals;
- intake workflow safety;
- marketplace DTO/public leakage;
- admin/auth/role checks;
- production visibility probe;
- focused command route registry tests;
- authenticated Playwright command-centre tests.

Add Playwright coverage for:

- anonymous public entry;
- authenticated dashboard;
- country-role route;
- desktop/mobile module parity;
- deep links;
- route redirects;
- context preservation;
- transactional overlays;
- loading/error/empty states;
- no overflow;
- no browser console/page errors;
- reduced motion;
- keyboard navigation;
- admin denial and leakage.

### 13. Evidence

Capture:

- desktop screenshots at 1024 and 1440;
- mobile screenshots at 320, 360, 375, 390 and 430;
- tablet screenshots at 768 and 820;
- one screenshot per major module state;
- JSON geometry and browser-error evidence;
- exact workflow run IDs;
- Vercel deployment ID and URL;
- Supabase branch status;
- changed files;
- command exits;
- unresolved review threads;
- final GO/HOLD.

Store evidence under:

- `docs/control/evidence/production-command-centre/`

Update:

- `docs/control/PROJECT_STATE.md`
- `docs/control/BUILD_CONTROL.md`
- `docs/control/VERIFICATION_PLAN.md`
- `docs/control/EVIDENCE_LOG.md`
- PR body

## PR requirements

The PR body must include:

- mission;
- architecture;
- module inventory;
- route migration matrix;
- data-loader architecture;
- auth/RLS boundary;
- changed files;
- test evidence;
- screenshots;
- Vercel preview;
- Supabase impact;
- unresolved defects;
- registry impact;
- GO/HOLD.

Keep the PR draft until:

- all launch-critical modules render in desktop and mobile;
- every valid review finding is fixed or explicitly dispositioned;
- all required checks pass on final head;
- preview screenshots are visually inspected;
- no production data, secrets or deployment settings changed;
- operator authorizes merge and production promotion.

## Immediate first action

Inspect the current branch head, compare it to `main`, read every changed file and produce a short implementation ledger in the PR before making additional code changes. Then execute the work in the sequence above without opening a second competing PR.
