# Launch release gates

Surface infrastructure (tokens, shared panels) is necessary but not sufficient for launch. This file tracks the **go/no-go** gates that must close before production promotion.

## Merge order (recommended)

| Priority | Gate | PR | What it proves |
|---------:|------|-----|----------------|
| 1 | **Deploy auth** | [#1487](https://github.com/harbourviewcompany-create/harbourview-platform/pull/1487) | Exact-deployment browser verification can authenticate against Vercel protection (automation bypass), without swapping mutable prod aliases |
| 2 | **CI pin hygiene** | [#1484](https://github.com/harbourviewcompany-create/harbourview-platform/pull/1484) | P0 identity workflow uses approved immutable `checkout` / `setup-node` SHAs (rebase if dirty) |
| 3 | **Jurisdiction release proof** | [#1488](https://github.com/harbourviewcompany-create/harbourview-platform/pull/1488) | Playwright evidence for reviewed / unsupported / recoverable routes; honest FRP wording (no invented dates) |
| 4 | **Clinical honesty** | [#1486](https://github.com/harbourviewcompany-create/harbourview-platform/pull/1486) | Multi-jurisdiction authority registry; **no Canada fallback**; `limited-coverage` state; cannabinoid scope notice |
| 5 | **Design system + surfaces** | [#1492](https://github.com/harbourviewcompany-create/harbourview-platform/pull/1492) | Token unification, shared sheets/cards, public + command shell adoption |
| 6 | **Globe intro continuity** | [#1485](https://github.com/harbourviewcompany-create/harbourview-platform/pull/1485) / [#1491](https://github.com/harbourviewcompany-create/harbourview-platform/pull/1491) | Metallic mid-reveal, angle orbit, CSS fallback; continuous gold mix |

## Clinical honesty criteria (must remain true)

- Authorities are **per country**; empty pack → `limited-coverage`, never silent CA substitution
- Copy states **cannabinoid / medical-cannabis scope only** — not a general medicines service
- Interaction checker / monitoring protocols are **not claimed** until reviewed datasets exist
- Primary links open **that jurisdiction’s** regulator, not a proxy country

## Auth / deploy criteria

- Immutable deployment host only
- Fail closed if bypass secret missing or rejected
- No production deploy/promote from design or fixture PRs

## After merges

1. Re-run production browser verification on the exact deployment
2. Smoke public routes, marketplace intake, command centre, clinical section with non-CA country
3. Confirm reduced-motion globe path

## Explicit non-gates

- Full Style Dictionary codegen
- Exhaustive hex purge in every admin tool
- Expanding clinical authority pack beyond registered core markets (iterate after #1486)
