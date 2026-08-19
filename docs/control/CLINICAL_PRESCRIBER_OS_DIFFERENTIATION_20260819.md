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

## Bigger swings worth scoping next (not started)

- **Cross-border regimen portability check**: "is this patient's current regimen legal/available
  in destination country Z" — direct extension of the jurisdiction data Harbourview already has,
  and something no single-jurisdiction competitor (CannaScript=UK, Releaf=UK) can offer.
- **Supply-risk-aware regimen ranking**: when multiple SKUs satisfy a clinical spec, rank by
  supply-outlook risk level and source diversity, not just clinical fit — turns this outlook
  function into an active recommendation input, not just a badge.
- **FDA non-device-CDS compliance framing as a sales point**: the existing citation-grounded,
  credential-gated publication model (provenance review + clinical review before anything
  publishes) already matches the FDA's 2026 non-device criteria more rigorously than most
  competitors bother to. Worth stating explicitly in customer-facing materials, not just building
  quietly.
