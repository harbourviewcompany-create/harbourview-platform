# Jurisdiction Command — 2026-08-15

Base inspected: `25a12d221c2b9d137bc8444e8b75d1dd2d41ebf1` (`main`).

## Objective

Replace the mobile Command `Jurisdiction` country profile with an operational jurisdiction command surface that answers:

1. What changed?
2. What is the current access posture?
3. Can a reviewed route be resolved for the selected activity/product/counterparty market/role?
4. Which dependencies are satisfied, missing, blocked or unknown for the active organization?
5. What commercial evidence exists?
6. Which verified market participants exist?
7. What evidence supports the answer, what is stale/incomplete, and what is not modelled?
8. What can the operator do next?

No unsupported fact, route or counterparty capability is inferred to make the UI look complete.

## Current-main architecture map

| Concern | Current implementation | Verified behavior / limitation |
| --- | --- | --- |
| Mobile route | `/dashboard?page=access-pathway&section=jurisdiction&country=<ISO2>&role=<role?>` | `jurisdiction` maps to desktop `access-pathway`; All roles is allowed in the Command context. |
| Renderer | `components/dashboard/mobile-command/sections/OperationsSections.tsx#JurisdictionSection` | Static narrative + six status cells + linear pathway list. |
| Mobile export | `components/dashboard/mobile-command/Sections.tsx` | Previously re-exported the static OperationsSections renderer. |
| Country context | `useMobileCommandModel.base.ts` | Normalizes subdivisions to parent country; role may be null (`All roles`). |
| Country intelligence | `getCountryIntelProfile()` | Country status fields, briefing, recent field changes and regulatory calendar already exist. Most were not surfaced in Jurisdiction. |
| Pathway | `cc_pathway_templates`, `cc_pathway_steps`, `cc_pathway_step_requirements` | Public pathway is keyed by country + role. Current loader returns empty when role is null. Generic role fallback exists when no curated template exists. |
| Organization progress | `cc_org_pathway_progress`, `cc_org_requirement_status` | Legacy dashboard helper resolves the first workspace membership, which is no longer the canonical multi-organization operating context. |
| Canonical organization context | `user_dashboard_preferences.active_workspace_id` + `workspace_members` + `workspaces`, resolved by `lib/hv/active-workspace.ts` | Personal is `active_workspace_id = null`; stale/suspended/non-member workspace preferences resolve safely to no active workspace. |
| Evidence | `ia_sources`, `source_registry`, `jurisdiction_playbooks` | Active source registry and published-playbook verification exist. Existing Jurisdiction reduced this to `Evidence: Active`. |
| Change intelligence | `countryIntel.recentChanges` + `/api/dashboard/signals` | Existing data could answer “What changed?” but static Jurisdiction did not consume it. |
| Regulatory calendar | `countryIntel.calendarEvents` | Existing forward-looking source/effective-date records were not rendered in Jurisdiction. |
| Market data | `market_metrics` | Structured country metrics exist and were not loaded into the static Jurisdiction surface. |
| Trade routes | `trade_flows` | Origin, destination, product category, legal status, permit-required and permit-authority fields exist; they can support scoped route resolution without inference. |
| Operators | `cannabis_operators` | Country-scoped active public operator records exist; only records explicitly marked `verified` are promoted by Jurisdiction Command. |
| Professionals | `hv_professionals` | Country-scoped verified active professional records exist. |
| Marketplace | Public marketplace projection + Command Market section | Jurisdiction can route the operator into Market but does not claim a marketplace listing is a licensed route counterparty. |
| Introduction | Existing contained `introduction` tool | Requires a concrete marketplace/listing context; Jurisdiction Command therefore does not fabricate a direct introduction CTA without such context. |
| Watch | Existing `watchlist` page / watchlist data | Jurisdiction routes to the existing Watch surface; this change does not create a duplicate watch system. |
| Compare | `getComparisonCountryScores()` | Existing cross-country opportunity/access metadata can support an in-context comparison view. |

## New production contract

### Safe API

`GET /api/dashboard/jurisdiction-command`

Inputs:

- `country` — required ISO2 (subdivision forms are normalized to parent ISO2 by the Command model before the request)
- `role` — optional existing role id
- `activity` — `market-entry | import | export | medical | adult-use`
- `market` — optional reviewed counterparty-market ISO2 for trade routes
- `product` — optional product category drawn from existing `trade_flows`

The endpoint requires a signed-in user and returns an allowlisted `JurisdictionCommandDTO`; it does not return raw provenance/admin JSON.

### Access state

Country-level statuses are normalized only for presentation:

- available
- conditional
- restricted
- unavailable
- unknown

The original database value is preserved beside the normalized state.

For import/export, a product/counterparty-market selection is resolved only when an existing `trade_flows` row matches. If the selected combination has no reviewed row, the state becomes `unknown / unsupported` rather than falling back to an inferred transaction answer.

### All roles

`All roles` now keeps the country baseline active. It no longer produces the legacy dead-end “No access pathway is available for this context” state.

If country-role templates exist, their role ids are exposed as optional refinements. Harbourview does not select an arbitrary role on the operator's behalf.

### Dependency graph

Existing pathway steps and requirements are projected as dependency nodes.

Requirement evidence maps to:

- `verified | waived` → satisfied
- `pending` → missing
- `rejected` → blocked
- unreviewed/in-review/no active-organization evidence → unknown
- optional unassessed requirement → not applicable

Step state is aggregated with blockers taking precedence over missing, then unknown.

Organization-specific status is now read against the canonical `active_workspace_id` through `resolveActiveWorkspace()`, not the user's first workspace membership.

### Evidence health

Jurisdiction Command exposes:

- published-playbook verification state
- last verified date
- registered evidence-source count
- Tier-1 source count
- evidence source name/category/reliability/last-checked fields
- explicit data gaps

Claim-level conflict reconciliation is not present in the current jurisdiction data model. The UI explicitly says `Conflict assessment: Not modelled`; it does not translate absence of a conflict field into “no conflicts.”

### Commercial intelligence

The surface uses only existing structured data:

- market metrics
- reviewed trade-flow records
- country-scoped live intelligence signals
- verified cannabis operator records
- verified professional records
- comparison-country scores

Operator records are presented as verified market participants. Route capability matching is not asserted unless a future licence/capability contract supports it.

### Actions

- **Build route** — changes the current Jurisdiction activity scope.
- **Compare** — moves to the in-context comparison block.
- **Watch** — opens the existing Command watchlist surface.
- **Open intelligence** — opens existing Intel.
- **Open directories** — opens existing reviewed directories.
- **Open evidence** — opens existing evidence/review-gates surface.

No new marketplace, introduction, organization or watch subsystem is introduced.

## Canada correction

Historical migration `20260623100137_seed_content_depth_updates.sql` is intentionally unchanged.

Forward migration `20260815222000_jurisdiction_command_canada_refresh.sql` corrects the active Canada briefing using current Health Canada primary-source facts:

- the Expert Panel final Cannabis Act legislative-review report was tabled March 22, 2024, not “completed in 2023”;
- medical access is under the Cannabis Act/Cannabis Regulations, not ACMPR;
- March 12, 2025 streamlining amendments are reflected;
- the May 16–June 30, 2026 Industrial Hemp Regulations consultation is recorded as closed;
- import/export is framed as activity/product/purpose/permit-specific rather than a generic national label.

This migration is repository-only in this change. It is not applied to production by this PR.

## Explicit unsupported capabilities

These remain visible as gaps rather than being invented:

1. Claim-level evidence conflict detection for jurisdiction assertions.
2. A universal product taxonomy linking every country pathway requirement to every cannabis product/formulation.
3. Verified licence-capability matching proving that a specific operator can execute a selected import/export route.
4. Complete origin/destination route coverage where `trade_flows` has no reviewed record.
5. Automatic marketplace introduction without a concrete supported listing/counterparty context.
6. Organization-readiness status in Personal context where no active workspace is selected.

## Verification requirements

Required before production GO:

- focused Vitest contract tests
- existing Mobile Command Centre tests
- typecheck
- Next.js production build
- Security / Leakage gate
- migration SQL parse + migration-ledger checks
- authenticated mobile screenshots at 375×812, 390×844 and 430×932
- visual confirmation of All roles baseline, role-specific pathway, route unsupported state, and bottom-navigation safe area
- no production migration application or deployment from this work item
