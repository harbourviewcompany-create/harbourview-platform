# Stage 2 — Content Classifier (`hv-classify`)

Per `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` Stage 2 / §6.1. Replaces the inverted
`score_signal_from_snapshot` heuristic with an LLM classifier that judges **meaning**,
not keyword density.

## Contract (§6.1)
Input: a signal's `{ headline, summary }`. Output:
`{ quality_label, content_type, impact, confidence, reason }`
- `quality_label` ∈ signal | boilerplate | spam | nav | duplicate
- `content_type` ∈ regulatory | market | story | research | noise (noise iff not a signal)
- `impact` ∈ high | medium | low

Prompt definitions match `docs/control/INTEL_EVAL_SET_RUBRIC.md` so classifier and
ground truth use the same taxonomy.

## Components
- `supabase/functions/hv-classify/index.ts` — the classifier. Modes: ad-hoc `{text}`,
  single `{signalId}`, batch `{mode:"eval"}`.
- `public.intel_classify_review_queue` — the manual-review terminal fallback.
- `public.intel_eval_predictions` — one row per (run_id, signal) prediction.
- `api.intel_eval_rows_needing_prediction(run_id, limit)` — feeds the batch runner.
- `api.intel_eval_scoring` — per-run precision/recall/accuracy vs the eval set.

## Wired to NOTHING (the whole point)
Per spec §6.2 / guardrail #2, the classifier drives no promotion. Its only write is to
`intel_eval_predictions`. `source-engine-promote` and the orchestrator are untouched.
It gets wired to promotion (Stage 3) **only after** it clears the bar on the eval set.

## Fallbacks (there is always a plan for fallbacks)
Provider chain, configurable via `CLASSIFY_PROVIDER_ORDER` (default **`openai`** as of 2026-07-24 —
was `openai,gemini,anthropic`; changed per direction not to fund Anthropic/Gemini until the product
makes money, since OpenAI now carries 100% of classification traffic. Set `CLASSIFY_PROVIDER_ORDER`
explicitly to restore multi-provider fallback):
1. Try each provider **whose key is set**, in order. A failing or credit-exhausted provider
   is caught and skipped — it never blocks the chain.
2. **Anthropic, if configured, is ordered LAST** so an unfunded Anthropic key is never hit first and
   never blocks. (This is the fix for the flaw in `hv-extract`, which tries Anthropic first.)
3. If **all** configured LLM providers fail, the row falls back to **manual review**: it is written
   to `intel_classify_review_queue` for a human to label. Nothing is ever silently dropped.
4. On an OpenAI-only chain, a same-provider retry (plain mode — `json_object` mode intermittently
   returned unparseable empty content) plus 429 backoff-retry are the only fallback within the
   provider itself before falling to manual review.

So the classifier does not depend on any single paid provider when multi-provider mode is
configured, and specifically does not depend on Anthropic — but as currently deployed (OpenAI-only),
an OpenAI-wide outage falls straight to manual review with no LLM fallback.

## The gate
`api.intel_eval_scoring` computes, per run:
- `quality_accuracy`, `signal_precision`, `signal_recall`, `content_type_accuracy_on_signals`.
- These are computed on **human-truth rows** (`label_status in confirmed|corrected`) when
  they exist; until then they fall back to the assistant drafts and `n_human_truth` shows
  how much of the score is human-anchored. Provisional and human numbers are never mixed
  silently.
- Proposed bar (spec §10, **owner's call**): `signal_precision ≥ 0.9`, `signal_recall ≥ 0.7`.

## How to run a validation pass (after deploy)
1. Deploy `hv-classify` and ensure `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) is set.
2. `POST /functions/v1/hv-classify { "mode": "eval", "runId": "v1", "limit": 250 }`
   (repeat until `requested` is 0 — it only fetches rows lacking a prediction).
3. `select * from api.intel_eval_scoring where run_id = 'v1';`
4. Compare to the bar. Re-run on any prompt/model change as a regression.

Because the eval sample oversamples minority languages/bands, reweight by true stratum
population before reading pool-level precision/recall as a headline number.

## Status (2026-07-15)
Built with the full fallback chain above; **not deployed and not validated live yet**.
Anthropic being out of credit is *not* a blocker — the chain runs on OpenAI/Gemini first
and Anthropic last, with manual review as the terminal fallback. A live run still needs
(a) at least one funded non-Anthropic provider key set in the edge-function env
(`OPENAI_API_KEY` and/or `GEMINI_API_KEY`), and (b) the 202-row human labelling pass so the
gate is measured against real ground truth rather than assistant drafts. I could not test
providers from the build sandbox (its network only reaches Anthropic), so the first real run
happens on deploy — hence deploy is held for your go, not merged blind.

Note on the earlier alarm: `hv-extract` already falls back across providers, so the live
pipeline degrades rather than dies when Anthropic is down — but it wastes a failed Anthropic
call first. Reordering it the way `hv-classify` is ordered would remove that waste.

## Rollback
`drop view api.intel_eval_scoring; drop function api.intel_eval_rows_needing_prediction(text,int); drop table public.intel_eval_predictions;`
and remove the `hv-classify` function. Blast radius: none — nothing consumes these yet.
