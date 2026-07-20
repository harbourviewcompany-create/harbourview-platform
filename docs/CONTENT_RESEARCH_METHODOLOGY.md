# Content Research Methodology

How education content claims get researched, sourced, and confidence-rated before human review. Built after a manual pass on the Germany "Pharmacy Dispensing Controls" clinical module (2026-07) surfaced that AI-drafted content was shipping as generic filler with zero verifiable claims -- this is the fix for that, made repeatable.

## When to use this

- Any module with `requires_clinical_signoff = true` on `education_modules`. These cannot be publicly read until `reviewed_by` is set (enforced by RLS, not just convention) -- see the migration `enforce_clinical_signoff_gate_in_rls`.
- Any other education content making specific, checkable factual claims (regulatory status, statistics, named legal instruments). Lower stakes than clinical content, but the same discipline produces better content.

## The process

1. **Identify checkable claims, not vibes.** Read the draft and mark every sentence that asserts something a reader could look up -- a mechanism, a statistic, a legal fact, a recommendation. Generic framing ("this matters because compliance is important") is not a claim and does not need a citation; "CBD inhibits CYP2C19" is.
2. **Prefer Harbourview's own verified data first.** For regulatory/jurisdictional claims, check `regulatory_pathways` and `regulatory_citations` before web search -- that data is already verified against primary sources with a tracked `last_verified_at`. Web search is the fallback for what Harbourview does not already have, and the only option for clinical/pharmacological content, since there is no equivalent verified table for that today.
3. **Search multiple independent sources per claim where possible.** One source finding something is a lead, not a fact. Two or more independent sources (not two articles citing the same original study) is what earns `moderate_evidence` or `well_established`.
4. **Rate every claim honestly:**
   - `well_established` -- consensus across independent sources, or a named consensus body/guideline
   - `moderate_evidence` -- credible sources (case reports, pharmacokinetic studies), but not broad consensus
   - `theoretical_mechanistic` -- the mechanism is plausible/documented but no direct case-level evidence found
   - `single_source` -- exactly one source found, however credible it looks
5. **Flag `open_question = true`** on anything rated `single_source` or `theoretical_mechanistic`, and on anything where getting it wrong has real consequences (dosing, interactions, contraindications) even if the evidence looked decent. This is a signal for the reviewer's judgment, not just a fact-check gap.
6. **Record every claim in `education_content_citations`** (module_id, section_id, claim, source_type, source_url, confidence_tier, open_question, notes). This is what lets a reviewer query "show me what needs my judgment" and get exactly that, instead of re-reading every paragraph.
7. **Do not silently drop a caveat you found.** If a source hedges ("emerging evidence," "case reports only," "authors note this is correlational"), that hedge belongs in the content and in the `notes` field. Confident-sounding prose built on hedged sources is exactly the failure mode this process exists to prevent.

## What this does not do

It does not replace clinical review. A fully-cited, honestly-rated draft is what a reviewer starts from -- it turns their job from "research and fact-check from scratch" into "confirm, adjust, sign off," which is a real speedup, but `reviewed_by` on `education_modules` still has to be set by an actual licensed clinician before `requires_clinical_signoff` content goes live. No amount of research quality changes what that field is for: professional accountability, not accuracy.

## Worked example

The Germany "Pharmacy Dispensing Controls" clinical module (`education_modules.id = 597d69e8-f48e-4ad0-9cb7-d6a0b4554cd0`) and its `education_content_citations` rows are a real worked example of this process -- 10 claims, split well_established / moderate_evidence / theoretical_mechanistic / single_source, three flagged `open_question`. Still gated behind `requires_clinical_signoff` pending an actual reviewer as of this writing.
