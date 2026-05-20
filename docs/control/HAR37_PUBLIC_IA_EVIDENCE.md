# HAR-37 Public IA Evidence

Date: 2026-05-16
Updated: 2026-05-17

## Track 2 reset status

PR: https://github.com/harbourviewcompany-create/harbourview-platform/pull/317

This PR is the active Track 2 / DSP-8 implementation path for HAR-37 and a public-surface architecture pass for HAR-39 and HAR-40.

The stale ChatGPT plan-transfer blocker was superseded in Notion and Linear. Active execution is controlled by Shared Memory, DSP-8, HAR-37/HAR-39/HAR-40, HAR-49 and PR #317.

Registry discipline note: this PR affects the Harbourview Platform registry row and does not require a PROJECT_REGISTRY.md row change because it does not change canonical project ownership, deployment ownership, database ownership, public/private boundaries or cleanup disposition. Project Registry Discipline run 25977399301 passed on head `64799c0e56812634e79e64fdd4926e3765524b96`.

## Changed files

- `app/intake/ConfidentialIntakeForm.tsx`
- `app/intake/page.tsx`
- `app/intelligence/IntelligenceModulePage.tsx`
- `app/intelligence/counterparty-intelligence/page.tsx`
- `app/intelligence/country-briefs/page.tsx`
- `app/intelligence/licensing-pathways/page.tsx`
- `app/intelligence/logistics-trade-routes/page.tsx`
- `app/intelligence/regulatory-pathways/page.tsx`
- `app/marketplace/consumables/page.tsx`
- `app/markets/page.tsx`
- `app/page.tsx`
- `app/platform/page.tsx`
- `app/professionals/page.tsx`
- `app/reviewed-connections/page.tsx`
- `app/source-methodology/page.tsx`
- `components/Nav.tsx`
- `components/PublicUi.tsx`
- `docs/control/HAR37_PUBLIC_IA_EVIDENCE.md`
- `lib/institutional/content.ts`
- `scripts/test-har37-public-ia.mjs`

## HAR-49 route-universe mapping

HAR-49 required public IA groups and PR #317 coverage:

- Home: implemented through `app/page.tsx`.
- Network: preserved through existing public route/content links; no runtime change needed in this PR.
- Exchange / Marketplace: preserved through existing marketplace route universe; `app/marketplace/consumables/page.tsx` copy aligned to reviewed-supply language.
- Intelligence: implemented/expanded through `app/intelligence/IntelligenceModulePage.tsx` and module routes for country briefs, licensing pathways, regulatory pathways, counterparty intelligence and logistics/trade routes.
- Source Engine / Source Methodology: implemented through `app/source-methodology/page.tsx`.
- Markets: implemented through `app/markets/page.tsx`.
- Education: preserved through existing education/compliance/policy route universe and linked from the public IA spine; HAR-40 deeper content remains a follow-on acceptance layer.
- Professionals: implemented through `app/professionals/page.tsx`.
- Trust / Governance: preserved through existing trust/governance route universe and public/private boundary copy in shared content; deeper HAR-47 proof remains outside this PR.
- Reviewed Connections: implemented through `app/reviewed-connections/page.tsx`.
- Intake / Contact: intake polished through `app/intake/page.tsx` and `app/intake/ConfidentialIntakeForm.tsx`; contact route preserved.
- Admin: intentionally untouched; admin/auth boundary is outside DSP-8 public IA scope.

## HAR-37 / HAR-39 / HAR-40 acceptance mapping

### HAR-37 — Public IA and role router spine

Verdict: GO for PR #317 merge after normal reviewer approval.

Met:

- Full-platform thesis visible from homepage and navigation.
- Public IA spine expanded through homepage, platform, markets, professionals, reviewed connections, source methodology, intelligence module routes and intake.
- Required visible role classes are covered by the route coverage script's role-path assertions.
- CTA destinations resolve to implemented routes or existing public routes.
- Public/private/admin boundary copy remains explicit.
- Intake page now uses the institutional visual system.
- Existing marketplace, signals, contact and sell/intake workflows are preserved except public copy/routing polish.

Deferred / not part of HAR-37 merge gate:

- Post-merge production smoke.
- Any Supabase/RLS/auth/admin/private-intelligence implementation.

### HAR-39 — Intelligence and source-engine platform surfaces

Verdict: PARTIAL GO for the public-surface architecture included in PR #317; HOLD for full HAR-39 closure.

Met in PR #317:

- Public intelligence module shell and public-safe subroutes exist for country briefs, licensing pathways, regulatory pathways, counterparty intelligence and logistics/trade routes.
- Source methodology is exposed as a public-safe route.
- Public copy separates orientation/brief requests from raw evidence, provenance, source records, sensitive methods and private counterparty details.
- Leakage checks passed against public visibility / services leakage / compliance visibility / visibility gates.

Still HOLD for full HAR-39 ticket closure:

- Protected intelligence access model, any admin/analyst cockpit, source-engine operational surface, watchlists, market-access briefing workflow and private request triage require separate implementation/evidence.
- No Supabase/RLS/auth/private intelligence surfaces were touched in this PR by instruction.

### HAR-40 — Compliance, education, policy and professional knowledge spine

Verdict: PARTIAL GO for the public IA / professional route spine included in PR #317; HOLD for full HAR-40 closure.

Met in PR #317:

- Professionals route exists.
- Homepage/navigation/content model now presents education, compliance, policy and professional roles as first-class platform pillars.
- Copy avoids legal, medical, investment and compliance-advice overclaiming on changed surfaces.
- Route coverage includes visible professional and knowledge-spine pathways.

Still HOLD for full HAR-40 ticket closure:

- Dedicated compliance education hub depth, export/import readiness education, pharmaceutical/medical knowledge hub, standards/readiness checklists, history/library surfaces and regulatory-change tracking remain follow-on work unless already satisfied by existing routes outside this PR.
- No claim is made that HAR-40 is fully complete from PR #317 alone.

## Route coverage

`node scripts/test-har37-public-ia.mjs`

Result:

```text
HAR-37 public IA route coverage passed for 37 public routes.
HAR-37 visible role coverage passed for 27 role-path terms.
```

This coverage maps to HAR-49's required public IA route universe for the HAR-37 slice. HAR-39 and HAR-40 are only partially covered where DSP-8 required public-safe route surfaces and public IA scaffolding.

## Leakage evidence for new public surfaces

The new / changed public surfaces are homepage, platform, markets, professionals, reviewed-connections, source-methodology, intake and intelligence module routes. The public-boundary checks passed on the latest head through Branch Verification run 25977385941, including Public visibility, Services public leakage, Compliance visibility and Visibility.

The following public-forbidden classes remain admin/private only and must not appear on public pages: `View source listing`, `sourceUrl`, `sourceName`, `Evidence captured`, `provenanceSummary`, `sourceEvidence`, `verificationStatus`, `availabilityStatus`, `sellerAuthorizationStatus`, `internalReviewNotes`, `reviewedBy`, `lastReviewedAt`, `nextReviewDueAt`, raw source URLs, private counterparty details, raw intelligence/evidence records and admin review metadata.

## Verification

Latest head: `64799c0e56812634e79e64fdd4926e3765524b96`.

Project Registry Discipline:

- Run 25977399301 — passed.

Branch Verification:

- Run 25977385941 — passed.
- Passed steps included Install dependencies, Typecheck, Intelligence fixtures projection, Intelligence OS extraction, Listing quality, Public images, Public visibility, Services public leakage, Build, Compliance visibility and Visibility.

Regulatory Signals Verify:

- Run 25977385947 — passed.

PR 166 New Products Equipment Verification:

- Run 25977385940 — passed.

Earlier evidence retained from Branch Verification run 25964975082:

`npm run typecheck`

Result: passed.

`npm run test:visibility`

Result:

```text
ok public listing render files and fixtures do not expose source/provenance/contactEmail fields
ok public listing projection omits internal source/provenance/contactEmail fields
ok admin listing review retains source/provenance/evidence fields
ok admin provenance route uses server-side role guard
ok business opportunities page uses reviewed live feed adapter
ok business opportunities adapter filters approved, published, public and unexpired records
ok business opportunities public render files omit source, contact, provenance, evidence, diligence and internal-note fields
ok business opportunities public projection does not map private source or review fields
```

`node scripts/test-public-copy.mjs`

Result:

```text
ok public copy: 11 public files passed Network terminology checks
```

`npm run test:listing-quality`

Result:

```text
ok marketplace listing quality: 37 listing(s) passed deal-trigger, buyer-type, scale-anchor, and access-model checks
```

`npm run test:admin-guard`

Result: passed admin role, workflow, conversion and smoke-route guard checks.

`npm run build`

Result: passed in Branch Verification runs 25964975082 and 25977385941. Existing warnings remained limited to non-blocking existing warnings already recorded in branch evidence.

`npm test`

Formal disposition: waived for PR #317 only. The repository does not define a `test` script, and package manager files were forbidden in this pass. This is not treated as a PR #317 merge blocker because equivalent available checks passed through named scripts and GitHub Branch Verification. Follow-up recommendation: create a separate package-script standardization ticket rather than modifying package files inside DSP-8.

## Responsive QA

Local URL recorded by previous verification: `http://127.0.0.1:3007`

Checked with browser DOM QA plus headless Chromium CDP screenshots:

- Desktop home: `1280x900`, `scrollW=1280`
- Tablet home: `900x900`, `scrollW=900`
- Mobile intake: `390x844`, `scrollW=390`

Observed outcome: desktop and tablet home preserve the full-platform hero, platform spine and mobile hamburger behavior at tablet width. Mobile intake keeps the institutional visual system, readable hero text, visible reviewed-handling panel and accessible intake form without horizontal overflow.

## GO/HOLD

PR #317 merge verdict: GO after normal reviewer/owner approval.

HAR-37 verdict: GO for merge of PR #317; HOLD only for post-merge deployment/production smoke.

HAR-39 verdict: PARTIAL GO for public intelligence/source-methodology route architecture in PR #317; HOLD for full ticket closure pending protected intelligence / source-engine / request workflow evidence.

HAR-40 verdict: PARTIAL GO for public IA/professional/knowledge-spine route architecture in PR #317; HOLD for full ticket closure pending deeper education/compliance/professional content and copy-safety evidence.

Track 2 verdict: GO to merge PR #317 as the active public IA reset slice if owner accepts the `npm test` waiver; HOLD on marking Track 2 complete.
