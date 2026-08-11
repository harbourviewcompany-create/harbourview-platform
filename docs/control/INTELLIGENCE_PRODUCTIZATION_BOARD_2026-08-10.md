# Intelligence Productization Board — 2026-08-10

**Status:** Active control document  
**Owner:** Tyler / platform agents  
**Horizon:** 2 weeks (no new product modules)  
**North star:** The intelligence already in Postgres must be the intelligence a customer sees.

**Related:**
- `docs/PLATFORM_OPTIMIZATION_REVIEW_2026-07-30.md`
- `docs/QUALITY_PIPELINE_HANDOFF.md`
- `docs/HARBOURVIEW_PUBLIC_PRIVATE_DTO_ALLOWLIST.md`
- `docs/control/PLATFORM_OPTIMIZATION_PLAN.md`
- Prior checklist PR #1308 (closed)

---

## 0. One-sentence constraint

**Do not build another surface.** Ship wiring, correctness, and outcome monitors so Pipeline B outputs (`quality_*`, translations, clusters, embeddings) reach Intel, search, and Digest.

Stack is already fit for 2026 (Next 16 / React 19 / Supabase / pgvector / Stripe). The gap is product completion, not a rewrite.

---

## 1. Current posture (as of 2026-08-10)

| Area | State |
|------|--------|
| Pipeline B quality columns on `public.signals` | Written; exposed via API views (#1294 era) |
| Mobile Intel as Command destination | Landed (#1295 era) |
| Feed / classify / promote | Recovered post Jul-30 restart (v2 classifier, vault key, dedup fix) |
| Customer confidence badges | Still risk of legacy `score` leakage in some mappers — verify `lib/regulatory-signals/public.ts` |
| Corroboration UI | Under-shipped |
| Translations in feed | Under-shipped |
| Semantic search UI on `public.signals` | Incomplete / historically orphaned |
| Digest ← `content_type` stories (Stage D) | Structural gap |
| Decision Intel Stage 0 | Track open PRs / HOLD on production apply |
| `public.jurisdictions` | Populate before dossier IDs are production-hard |
| Outcome freshness alerts | Prefer outcomes over cron green |

---

## 2. Tier 1 — Ship this week (customer-visible)

Each item is one small PR. Merge order: **PR-A → PR-B → PR-C → PR-D → PR-E**.

### PR-A — Classifier is the only public quality language

| Field | Detail |
|-------|--------|
| **Goal** | Customer-facing confidence / impact / content type come only from Pipeline B columns |
| **Primary files** | `lib/regulatory-signals/public.ts`, `lib/signals/quality.ts`, DTO types, Intel feed components |
| **Do** | Map `confidence_score` ← `quality_confidence` (0–100); impact ← classifier `impact`; never present inverted legacy `score` as confidence |
| **Acceptance** | Grep customer paths: no badge derivation from `signals.score`. Unit tests on mapper. Leakage suite still green |
| **Out of scope** | Classifier prompt changes, promotion thresholds |

### PR-B — Translations on by default

| Field | Detail |
|-------|--------|
| **Goal** | English-reading customers see global coverage |
| **Do** | `COALESCE(title_en, headline)` / `COALESCE(summary_en, summary)` in public mapper; surface `lang_detected` / translated flag per allowlist |
| **Acceptance** | Non-English sample rows show English title when `title_en` present; original language still available |
| **Out of scope** | New translation models, source-registry language expansion |

### PR-C — Corroboration affordance

| Field | Detail |
|-------|--------|
| **Goal** | "Reported by N sources" using cluster data |
| **Do** | Expose count from `cluster_rep_id` / `corroborating_count` (or window count); one UI line on Intel cards |
| **Acceptance** | Representative rows with multi-member clusters show N ≥ 2; singles omit or show 1 without noise |
| **Out of scope** | Re-running dedup algorithm |

### PR-D — Semantic search UI on the real corpus

| Field | Detail |
|-------|--------|
| **Goal** | Search box over `public.signals` + embeddings, not `ia_signals` orphan |
| **Do** | Point search route at canonical table; wire one authenticated UI entry (Intel or Command) |
| **Acceptance** | Query returns reviewed/promoted signals; empty/wrong-table path removed |
| **Out of scope** | Full RAG chat product |

### PR-E — Freshness outcome monitors

| Field | Detail |
|-------|--------|
| **Goal** | Silence is impossible |
| **Do** | Assert feed gained rows in 48h; digest published in 48h; classify backlog under threshold — notify on failure |
| **Acceptance** | Documented check + owner; does not rely solely on `cron.job` success |
| **Out of scope** | Full observability platform rewrite |

---

## 3. Tier 2 — Next week (structure)

### PR-F — Stage D Digest path

Wire `content_type IN ('story','research')` (or equivalent) into editorial/digest intake so story-class signals are not stranded.

### PR-G — Feed integrity pass

- Sweep residual spam/boilerplate from live feed if any remain  
- Country-tag correctness for high-visibility rows  
- Confirm geo fields (`country` / codes) on public DTOs where hard-coded nulls remain  

### PR-H — Medium-confidence review queue (admin)

Promote-or-drop is too coarse; borderline rows need a human middle tier writing to eval/review paths without demoting `human:%` rows.

### PR-I — Decision Intel / jurisdictions

- Resolve open Decision Intel PR vs HOLD  
- Populate `public.jurisdictions` before production dossier IDs  
- No parallel conductor that forks from Pipeline B without an explicit ADR  

### PR-J — Pipeline consolidation note + first cut

Document single conductor: edge workers canonical for LLM stages; SQL/`pg_net` shadow scheduled for retirement. First code cut only if low blast radius.

---

## 4. Tier 3 — Hold until a design partner is using Tier 1

Do **not** start these before someone is actively using a fresh, searchable, global Intel feed:

1. Full entity resolution + graph edges  
2. Interpretation layer (regulation → operator → trade flow → action)  
3. Source-registry non-English expansion at scale  
4. Engagement telemetry → ranking / learning loop  
5. Genetics / education CPD / full BNPL embeds (roadmap Phase 2 depth)  

---

## 5. Global rules (every PR on this board)

- [ ] No production migration apply without explicit HOLD lift  
- [ ] RLS / `api` view / allowlist unchanged unless the PR is *about* grants  
- [ ] Public DTO allowlist remains source of truth for customer fields  
- [ ] `hv_promote_signals` safety: promote only; never touch `reviewed_by LIKE 'human:%'`  
- [ ] Classifier changes require `intel_eval_set` gate (precision/recall)  
- [ ] Mobile Command: nine-width visual check if UI density changes  
- [ ] `typecheck` + relevant `test:*` scripts green; leakage suites if touch public surfaces  

---

## 6. Per-PR template

```markdown
## Board item
PR-A | PR-B | …

## Customer outcome
One sentence: what the user sees differently.

## Files
-

## Acceptance
- [ ]

## Explicit non-goals
-

## Risk / HOLD
- Migrations: none | shadow | apply HOLD
- Rollback: revert commit / feature flag
```

---

## 7. Suggested calendar

| Day | Deliverable |
|-----|-------------|
| 1–2 | PR-A merge |
| 2–3 | PR-B merge |
| 3–4 | PR-C merge |
| 4–6 | PR-D merge |
| 5–7 | PR-E live |
| 8–10 | PR-F + PR-G |
| 10–14 | PR-H / PR-I as capacity allows |

---

## 8. Definition of done for the board

A compliance-oriented design partner can open Command → Intel and see:

1. Fresh signals (not multi-day stale)  
2. Confidence/impact from the classifier, not the dead keyword scorer  
3. Translated headlines where `title_en` exists  
4. Corroboration when clusters exist  
5. Search that hits the real corpus  

Until those five are true, prefer this board over new modules.
