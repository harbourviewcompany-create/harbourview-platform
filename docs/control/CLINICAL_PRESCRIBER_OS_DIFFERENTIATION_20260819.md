# Prescriber OS — differentiation strategy (2026-08-19)

## The honest competitive picture

Direct and adjacent competitors, as of Aug 2026:

- **CannaScript** (UK, early access 2026) — terpene-level AI decision support, ranked
  recommendations, UK CBPM formulary. Closest direct competitor. Single-jurisdiction (UK only).
- **OpenEvidence** — AI-native, cited, peer-reviewed medical search; free/ad-supported;
  general medicine, not cannabis-specific; withdrew from EU/UK in April 2026.
- **InteractSafe / CANN-DIR / Drugs.com cannabis checker** — pharmacist- or FDA/NIH-sourced
  cannabis-drug interaction content. Static reference content, no workflow, no jurisdiction
  or supply awareness, consumer-facing.
- **Lexicomp / UpToDate-Lexidrug / Micromedex / Epocrates / Medscape** — general DDI checkers.
  Industry-documented weak point: a 2021 review of 8 major DDI resources found "extremely poor
  inter-source agreement" on severity and management — and none are cannabinoid-specialized.
- **Releaf** (UK) — vertically integrated prescribe-to-delivery platform, 25k+ patients,
  ~£38m revenue. Proves the commercial model for a full-stack cannabis health platform, but
  it's a telehealth/pharmacy business, not a deep evidence engine.

Regulatory context that matters right now: the FDA's Jan/March 2026 Clinical Decision Support
Software guidance excludes CDS from "device" regulation only when a clinician can independently
review the basis for a recommendation — i.e. citation-grounded, non-directive tools have a real
compliance advantage over black-box recommendation engines. Separately, the 2026 US cannabis
Schedule I→III move and the DEA's new Medical Marijuana Dispensary Registration Portal
(launched April 2026) mean the US market is mid-transition right now — most competitors above
are UK- or general-medicine-focused, not built for a multi-jurisdiction moment like this one.

## Where none of them can follow

Every competitor above is a content or workflow company. None of them run a real global trade
and regulatory intelligence operation. Harbourview does — a 6,000+-contact professional network,
a live market-intelligence signal pipeline (`signals`, `jurisdiction_briefings`, `dossiers`),
and a formulary/SKU registry already tracking per-country authorization status
(`clinical_formulary_skus.country_iso2` / `.authorization_status`).

That means Harbourview can answer a question no competitor's architecture can reach:
**not just "what does the evidence say," but "can this patient actually get this product,
right now, in their jurisdiction, and is that supply chain currently stable."**

CannaScript can out-polish a UI. OpenEvidence can out-scale general-medicine content. Neither
can bolt on a trade-intelligence network after the fact — it's not a feature, it's a different
company underneath. This is the moat to build on, not evidence-corpus size (a battle against
UpToDate/OpenEvidence's resources that isn't winnable head-on).

## Shipped this session: jurisdiction supply-continuity outlook

`clinical_jurisdiction_supply_outlook(country_iso2, lookback_days)` — a SECURITY DEFINER
Postgres function that reads the existing `signals` pipeline (reviewed rows only, filtered to
regulatory/supply/market/commercial/international categories) and returns a clinical-safe
aggregate: risk level (`elevated` / `watch` / `normal` / `insufficient-data`), signal counts,
and one representative recent headline + source. Raw signal rows, internal notes, and
unverified inference chains never cross into the clinical surface — only the aggregate does.

Exposed via `/api/clinical/supply-outlook?country=XX`, backed by
`lib/server/clinicalSupplyOutlookQuery.ts` (session-authenticated, same pattern as
`clinicalPrescriberWorkspaceQuery.ts`).

Verified against live data: e.g. Canada currently returns `elevated` (4 signals in 90 days,
top category `commercial`), most recent being Canopy Growth's EU-GMP renewal at Kincardine —
directly relevant to a prescriber or pharmacist evaluating Canadian-sourced product continuity
for European patients. This is real, already-collected intelligence with zero net-new data
entry required — the differentiation was sitting in the platform unused.

## Deliberately not done in this session

UI integration into `ClinicalWorkspacePage.tsx` / `ClinicalEvidenceExplorer.tsx` — both are under
active, fast-moving concurrent development (PRs through #1574 in the last day). The DB function
and API are stable, additive, and touch no contested file; wiring a supply-continuity badge onto
the SKU/regimen views is a natural next step for whichever session owns that UI next.

## Shipped: cross-border formulary portability check

`clinical_cross_border_formulary_check(destination_country_iso2, brand_name, cannabinoid_profile)`
— given a product (by brand and/or cannabinoid profile) and a destination country, reports
whether an equivalent *published* formulary entry exists there, plus that destination's
supply-continuity outlook in the same call. Stateless by design: takes product identity
directly rather than a `regimen_id`, so it has no dependency on `clinical_regimen_protocols`
(under active concurrent development) and works from any UI that already has product details
loaded — including before a regimen is finalised.

Verified against live data: `DE` + `CBD 100mg/mL` → `not-currently-available` (honest, no
false positive) with Germany's channel-rules signal attached anyway; `AU` + `Wide CBD/THC range`
→ `profile-equivalent-available` against the real TGA SAS-B pathway class, `watch` risk level,
with the DVA funding-reset signal (real, dated, sourced) attached. Brand-name matching is wired
and tested but currently has no live data to match against — `brand_name` is unpopulated in both
formulary feeds today. Not a blocker: cannabinoid-profile matching already covers the working
case, and brand matching activates automatically once the feed starts populating it.

Exposed via `/api/clinical/cross-border-check?destination=XX&brand=...&profile=...`. UI wiring
deliberately left undone this round — no natural existing insertion point yet (no "compare
destination" affordance exists in the workspace UI), and one shouldn't be forced in without a
design pass.

## Compliance framing (a positioning point, not a new build)

The credential-gated publication model shipped in the spine-reconcile migration — a
clinical-synthesis row can't be `published` without both an approved provenance review and a
credential-bound clinician/pharmacist review — already goes further than the FDA's Jan/March
2026 non-device-CDS bar requires (independently reviewable basis for a recommendation). Worth
using as an explicit sales/compliance point: "every published clinical claim in this system has
a named, credentialed reviewer and a checkable primary source" is a stronger claim than most
competitors can make, OpenEvidence included.

**Honest caveat, not yet true in practice:** `clinical_reviewer_credentials` and
`clinical_evidence_reviews` are both still empty (0 rows) as of this check. The governance
*mechanism* is real and enforced by a trigger, but no actual credentialed review has run yet —
that's why 20 of 23 evidence rows are still sitting in `under-review`. The compliance story is
accurate to make about the *architecture*; it isn't yet true about the *content*. Don't let this
get stated to a customer as "all published claims are credential-reviewed" until reviewer
onboarding actually happens — right now that's zero for zero, not most-for-most.

## Still just an idea (not started)

- **Supply-risk-aware regimen ranking**: when multiple SKUs satisfy a clinical spec, rank by
  supply-outlook risk level and source diversity, not just clinical fit — turns the outlook
  function into an active recommendation input, not just a badge. Needs a design decision on
  where "multiple SKUs satisfy a spec" ranking currently happens before it can be safely wired in.

