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
- `supabase/functions/hv-classify/index.ts` — the classifier. Providers: Anthropic
  `claude-haiku-4-5` primary, OpenAI `gpt-4o-mini` fallback (mirrors `hv-extract`).
  Modes: ad-hoc `{text}`, single `{signalId}`, batch `{mode:"eval"}`.
- `public.intel_eval_predictions` — one row per (run_id, signal) prediction.
- `api.intel_eval_rows_needing_prediction(run_id, limit)` — feeds the batch runner.
- `api.intel_eval_scoring` — per-run precision/recall/accuracy vs the eval set.

## Wired to NOTHING (the whole point)
Per spec §6.2 / guardrail #2, the classifier drives no promotion. Its only write is to
`intel_eval_predictions`. `source-engine-promote` and the orchestrator are untouched.
It gets wired to promotion (Stage 3) **only after** it clears the bar on the eval set.

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

## Status / blocker (2026-07-15)
Built but **not deployed and not validated live**. A live proof run was attempted from a
sandbox against the 15 sharpest inversion rows (score-99 nav/spam vs score-20-40 real
signals) but the **Anthropic API key returned `credit balance is too low`** (HTTP 400).
That blocks any LLM call on that key — **likely also affecting the live pipeline's
`hv-extract` and other LLM steps**; worth checking billing regardless of this stage.

Therefore Stage 2 ships as reviewed code with **no live apply and no deploy**: unlike the
Stage 0/1 data changes, this is runnable code that should not hit production untested.
Deploy + first validation run should happen once (a) API credits are restored and (b) the
202-row human labelling pass is done, so the gate is measured against real ground truth
rather than assistant drafts.

## Rollback
`drop view api.intel_eval_scoring; drop function api.intel_eval_rows_needing_prediction(text,int); drop table public.intel_eval_predictions;`
and remove the `hv-classify` function. Blast radius: none — nothing consumes these yet.
