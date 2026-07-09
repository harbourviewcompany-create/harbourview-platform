# Country Education Overlay — Generation & Review Pipeline

**Status:** build-handoff spec. Companion to `EDUCATION_INTELLIGENCE_ARCHITECTURE.md`.
**Depends on:** `country_education_overlay` table (PR #984, `feat/education-country-overlay`).
**Prepared:** 2026-07 · sole reviewer/decision-maker: Tyler.

---

## 0. Why this exists

PR #984 shipped the *pipe*: a country/role-scoped overlay table whose rows only
render to clients when `review_status IN (verified_*)`, falling back to the
generic `MODULE_TOPICS` lookup (labelled "General guidance — not yet verified")
otherwise. It does not ship *content*.

Hand-authoring content does not scale: 5 topics x ~6 roles x every target
country is hundreds of rows, each needing current sourcing and a human pass,
and each going stale as the underlying regulation moves. The Mexico · Importer ·
"Compliance & Reg." seed (drafted 2026-07, staged `review_pending`) is the
template, not a task to repeat by hand.

This doc specifies two things:
1. A retrieval-augmented **generation pipeline** that drafts overlay rows for
   any country/role/module, always as `review_pending`, pre-populated with
   cited sources.
2. A **reviewer queue** that turns the existing `review_status` enum into an
   actual draft -> verify -> display workflow with an audit trail.

**The throughput ceiling is reviewer hours, not generation.** Generation fills
drafts; only a human publishes. "All countries" honestly means: all countries
*drafted* (non-displaying), verified ones *displayed*, coverage growing as
review capacity does — sequenced by live client demand, not alphabetically.

---

## 1. Schema deltas (additive; ships independent of #984 merge order)

```sql
alter table country_education_overlay add column generated_by text default 'manual';
alter table country_education_overlay add column priority int default 0;

-- Work queue: drives generation off prioritised targets, not the raw
-- country x role x module cartesian product. Gives backpressure + demand ordering.
create table country_education_gen_queue (
  id            uuid primary key default gen_random_uuid(),
  country_iso2  text not null,
  module_key    text not null,
  role_id       text,
  priority      int  default 0,
  status        text default 'queued',   -- queued | drafting | drafted | failed
  attempts      int  default 0,
  last_error    text,
  updated_at    timestamptz default now(),
  unique (country_iso2, module_key, role_id)
);
alter table country_education_gen_queue enable row level security;
-- service-role write only; no anon/authenticated policy.

-- Append-only review audit log. Regulatory content needs defensibility:
-- who published what, when, citing which sources.
create table country_education_overlay_review_log (
  id           uuid primary key default gen_random_uuid(),
  overlay_id   uuid references country_education_overlay(id),
  old_status   text,
  new_status   text,
  reviewer     text,
  source_ids   uuid[],
  created_at   timestamptz default now()
);
alter table country_education_overlay_review_log enable row level security;
-- service-role write only.
```

---

## 2. Generation pipeline

### 2.1 Move it out of plpgsql

`run_education_section_gen` runs in plpgsql because it is single-shot, no tools.
Retrieval-augmented generation is a multi-turn tool loop (web_search results ->
model continues -> emits JSON) plus source upserts and JSON parsing — all
painful in plpgsql. **Implement as a TypeScript worker** (Vercel cron route or
an invoked worker). pg_cron may remain as the trigger, or use Vercel cron
directly. Reuse the existing Vault-key + pg_net -> api.anthropic.com path only
for the model call auth pattern; the orchestration is TS.

### 2.2 Per-tick loop

1. Pull N `queued` rows from `country_education_gen_queue` ordered by
   `priority desc, updated_at asc`. Mark `drafting`.
2. For each target `{country_iso2, module_key, role_id}`:

   a. **One Anthropic API call, `web_search` tool enabled.** Prompt scoped to
      the target. System instruction: return JSON ONLY, no prose, no markdown
      fences:
      ```json
      {
        "topics":  ["<5 strings>"],
        "sources": [{ "url": "...", "title": "...", "why": "..." }],
        "confidence": 0.0
      }
      ```
      Honesty rules in the prompt (mirror run_education_section_gen):
      - Ground every regulatory specific in a retrieved source; do NOT invent
        figures, permit-class names, agency names, dates, or thresholds.
      - Where the framework is unstable/contested, say so in the topic text
        rather than asserting a clean specific.
      - Write for the specific role's decision (an importer's clearance /
        licence / retention obligations), not generic overview.

   b. Parse JSON (strip accidental fences defensively). On parse failure ->
      mark queue row `failed`, increment `attempts`, store `last_error`, skip.

   c. Upsert each cited source into `source_registry` (dedupe on URL). Collect
      resulting IDs. **Pre-populating `source_ids` is the point** — it turns
      review into verify-the-citations, not research-from-scratch, which is
      what raises reviewer throughput.

   d. Upsert the overlay row — **conditionally** (see 2.3).

   e. Mark queue row `drafted`.

### 2.3 Two non-negotiable guardrails

- **Never overwrite human work.** The upsert on the
  `(country_iso2, module_key, role_id)` unique key MUST be conditional:
  ```sql
  on conflict (country_iso2, module_key, role_id) do update set ...
    where country_education_overlay.review_status = 'review_pending'
      and country_education_overlay.generated_by  = 'gen-pipeline'
  ```
  A row a reviewer has verified or edited is untouchable by the pipeline.

- **Everything lands `review_pending`. Never auto-`verified_*`.** The pipeline
  drafts; only a human publishes. Non-negotiable for regulatory/import/licensing
  content — this is the highest-liability category on the platform.

### 2.4 Staleness loop (ties into the signals pipeline)

When the signals pipeline detects a regulatory change for a country, flip
affected `verified_*` overlay rows to `stale_source` (stops them displaying)
and re-enqueue them in `country_education_gen_queue`. This is the mechanism that
prevents "all countries verified" from rotting the day after verification.
Match signals -> overlay rows via `country_iso2` + `module_key`/`topic_tag`.

---

## 3. Reviewer queue

Lives in the existing admin hub (OS-style admin interface). New
"Education Review" panel.

### 3.1 List

Rows where `review_status IN
('review_pending','stale_source','conflicting_sources','jurisdiction_unclear')`,
ordered by `priority desc` (client demand) then country/role. Each row shows
country · role · module, confidence, `generated_by`, age.

### 3.2 Detail + actions

- 5 topic strings, editable inline.
- Cited sources resolved from `source_ids -> source_registry`, clickable, so the
  reviewer checks the actual regulation rather than trusting the draft.
- **Publish:** set `review_status` to a `verified_*` value -> row goes live.
- **Hold:** `do_not_publish` / `legal_review_required` / `jurisdiction_unclear`.
- On any status change: stamp `reviewer` + `last_verified_at`, AND write a
  `country_education_overlay_review_log` row (old_status, new_status, reviewer,
  source_ids snapshot, ts).

### 3.3 Guardrails

- Admin/reviewer-role only (reuse existing admin auth guards).
- **All writes via a service-role server action, never client-side.** The
  overlay table's RLS blocks anon/authenticated writes by design, so the
  reviewer UI must write server-side.
- Review log is append-only. If a client ever challenges guidance, the trail
  shows who published what, when, citing which sources.

---

## 4. Ticket sequence

1. **Schema deltas** (section 1) — additive, ships independent of #984 merge.
2. **Review queue panel** (section 3) over the existing Mexico row — proves the
   draft -> verify -> display loop end-to-end before scaling generation. Do this
   FIRST: generation without a review path just produces drafts nobody can ship.
3. **Generation worker** (section 2) — queue-driven, web_search-enabled,
   `review_pending` output, conditional upsert.
4. **Signals -> staleness trigger** (section 2.4) — can lag; do after the queue
   works.

### Build-time verifications (could not confirm live — repo is multi-agent, verify against current main)
- Current name/location of `run_education_section_gen` and its Vault-key path.
- `source_registry` column names (for the source upsert + `source_ids` FK).
- Admin hub route path + the exact admin auth-guard helper name.
- Whether pg_cron trigger or Vercel cron is preferred for the worker.

---

## 5. Sequencing principle

Do NOT block on "all countries." Generate broadly as `review_pending`
(non-displaying, honest), but VERIFY only the country/role a real client deal
needs next. The generic labelled fallback covers everything not yet verified.
Coverage is a function of review capacity + live demand — not a map to fill in.
