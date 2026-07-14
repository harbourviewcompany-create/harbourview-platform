# Intel Eval Set — Stage 0 Labeling Rubric

**Scope:** `public.intel_eval_set` (202 rows), the ground-truth set for
`docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` Stage 0. Every classifier/scorer is
validated against these human labels before it drives anything (spec §6.2, §9.2).

Two labels per row: **quality_label** (is this worth surfacing at all?) and, for
real signals only, **content_type** (which surface does it route to?). Plus an
**impact** tier used later for the Digest editorial bar.

## quality_label

| label | definition | tells |
|---|---|---|
| **signal** | A discrete, substantive real-world development — a specific actor doing a specific thing (a law, ruling, licence, price move, launch, study result). You could not have known it without reading past the headline. | "X did Y." |
| **boilerplate** | Generic site chrome repeated across pages: footers, contact/address blocks, author bylines, newsletter prompts, cookie notices. | Same text would appear on 100 other pages of the site. |
| **spam** | Content whose purpose is selling / affiliate / SEO-baiting, **or an article that is entirely off-topic to cannabis** (obituary, unrelated crime, travel) that only landed here because the source feed is topic-tagged. | Not trying to inform you about cannabis. |
| **nav** | Page furniture that isn't quite boilerplate: menus, breadcrumbs, pagination ("1 2 3 Next"), login/register links, index/teaser lists. | Navigation, not content. |
| **duplicate** | Same underlying event as another **sampled** row (syndicated wire copy re-published under a different outlet/country feed). Note the twin's id in `label_notes`. | "Already have this event." |

Boundary calls that recurred in this set:
- A gov/regulator page that is *only* a menu of report links → **nav**, not signal,
  even though it scores 99. Menus are the classic inverted-scorer false positive.
- A one-line real headline ("Virginia veto could boost hemp") → **signal**, even at
  score 27. The scorer under-rates clean one-liners.
- A crime blotter seizure ("100kg seized") → **signal / story / low**. It's a real
  event, just low-value for a B2B regulatory product. Keep it a signal; let impact
  and content_type carry the "not for Signals feed" decision.
- An off-topic article in a cannabis feed (rabies death, obituary) → **spam / noise**,
  regardless of score.

## content_type (real signals only)

Non-signal rows are automatically **noise** — no separate judgment needed.

| type | definition | routes to (spec §4.3) |
|---|---|---|
| **regulatory** | Government/agency action: law, rule, licensing, court ruling, gazette notice, enforcement policy. | Signals |
| **market** | Commercial activity: pricing, supply/demand, M&A, funding, trade flows, market-size data. | Signals + Digest |
| **story** | General news/culture coverage not fitting the above — business moves, human interest, seizures, politics-adjacent. | Digest |
| **research** | Academic/scientific findings, trial results, clinical registries, industry reports. | Digest (+ Signals if high impact) |
| **noise** | Anything whose quality_label ≠ signal. | Nowhere |

## impact

| tier | meaning |
|---|---|
| **high** | Moves a market or a regulatory regime; a founder/operator would want to know today. |
| **medium** | Meaningful but not urgent; context, not a headline. |
| **low** | Marginal — routine blotter, thin echo, evergreen reference. |

## Process

1. Assistant pre-fills `draft_*` on every row with a one-line `draft_reason`.
2. Operator confirms or corrects each row at `/admin/intel-eval`.
   - Agreeing with the draft → `label_status = confirmed`.
   - Changing any of the three → `corrected`.
   - Dead link / empty body → `unlabelable` (excluded from the gate).
3. **Precision/recall at Stage 2 is computed on `confirmed` + `corrected` rows
   only.** Drafts never count as ground truth; they exist to speed labeling and to
   measure draft-vs-human agreement.

## How this gates later stages

- **Stage 2 (classifier):** run `hv-classify` over every labeled row; compare its
  `quality_label` / `content_type` to the human columns. The classifier must clear
  the agreed bar (spec proposes precision on `signal` ≥ 0.9, recall ≥ 0.7 —
  **Tyler's call**, §10) before it may drive promotion. Re-run on every prompt/model
  change as a regression.
- **Stage 3 (promotion) & Stage 4 (dedup τ):** the confidence threshold and the
  cosine-duplicate threshold are tuned against this set, not eyeballed.

Because the sample deliberately oversamples minority languages and rare score
bands, pool-level precision/recall must be **reweighted by true stratum population**
before it is read as a headline number.
