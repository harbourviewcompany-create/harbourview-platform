# Command Surface Spec — making the Command overview worth opening

**Status:** Proposed. No code changed by this document.
**Scope:** The mobile Command overview (`components/dashboard/mobile-command/CommandOverviewOperator.tsx`)
and the model that feeds it (`useMobileCommandModel.ts`), plus the one upstream
data defect that limits what any version of that surface can show.
**Author context:** Written after a read-only audit on 2026-09-16. Every live
claim below carries the query that produced it, per `CLAUDE.md` Rule 3.

---

## 1. Problem

The Command overview renders five stacked groups — pulse counters, Requires
attention, Recent intelligence, Commercial opportunity, Operating picture — and
almost nothing in it is derived from *who is looking* or *what changed*. Two
users in the same country see the same screen, and the same user sees the same
screen on consecutive days.

That is the whole of the "it's dull" problem, and it decomposes into six causes
plus one upstream supply defect that is larger than all of them.

---

## 2. Verified current state

All checks run 2026-09-16 against project `zvxdgdkukjrrwamdpqrg` (read-only).

### 2.1 The priority slot is hardcoded and role-blind

`useMobileCommandModel.ts:120-151` builds two corridor actions unconditionally
and prepends them to `nextActions`:

```
nextActions: [...corridorActions, ...organizationActions, ...commercialActions]
```

`MobileCommandCentreRebuild.tsx:57` then selects the attention list as
`model.nextActions.filter(item => item.tone === 'warn' || item.tone === 'gold')`,
and `CommandOverviewOperator.tsx` renders `.slice(0, 2)`. Both corridor actions
carry `tone: 'gold'` and sit at index 0 and 1, so they always win both slots.

Consequence, reproduced in the reference screenshots: a user whose role is
**Doctor / Prescriber** is shown "Open corridor execution plan" and "Run landed
cost + sensitivity" as their top two priorities. Those are export-trade tool
launchers. They are not attention items, they are not role-relevant, and they
are identical for every user in the product.

### 2.2 Nothing carries a time

`DashboardSignal` (`lib/dashboard/dashboardShared.ts:8-48`) carries `timeAgo`,
`freshnessAt`, `freshnessBasis`, `confidence`, `verificationStatus`,
`sourceLabel` and `sourceUrl`. The overview's `signalMeta()`
(`CommandOverviewOperator.tsx:22-27`) discards all of it and emits:

```
market · type · ("Active-country match" | "Broader watch")
```

"Active-country match" is internal scoping vocabulary. It tells the reader
nothing they did not already know from the country selector above it.

### 2.3 There is no per-user "since last time" state anywhere

Searched `lib/`, `components/`, `app/` for last-seen/read-state concepts. The
only matches are ingestion-side columns (`clinicalFormularyQuery.ts`,
`lib/signals/types.ts`, `lib/intelligence-engine/worker-node.ts`) — none is a
per-user view timestamp.

Confirmed live against the table that would hold it:

```sql
select column_name from information_schema.columns
where table_schema='public' and table_name='user_dashboard_preferences';
-- id, user_id, country_iso2, role_id, heatmap_layer, created_at,
-- updated_at, active_workspace_id
```

No `command_last_viewed_at`, and no separate read-state table exists
(`information_schema.tables` matching `%seen%`/`%read_state%`/`%last_view%`
returns nothing). Every visit therefore renders identically to the previous one.

### 2.4 The counters are inventory, not state

`Attention 9 / Recent intelligence 1 / Opportunities 2`. The 9 is
`nextActions.length` after the tone filter, largely generated CTAs. There is no
delta, direction, or threshold. "Recent intelligence: 1" is actively harmful —
it reads as a dead feed.

### 2.5 The best available personalization signal is built and unwired

`components/dashboard/mobile-command/watchRuleHits.ts` already matches a user's
active watch rules against loaded signals and returns matched keywords,
confidence and age per hit. It is imported only by `IntelligenceSections.tsx`
and `RegulatoryWatchWithCorpus.tsx`. The Command overview never reads
`watchlistData` at all.

**Constraint that must be designed around:** watch rules are *org-scoped*, not
user-scoped. `getWatchlistData()` (`lib/dashboard/dashboardLiveData.ts:607-645`)
resolves `org_id` from `workspace_members` and returns empty when the user has
no workspace. Live counts:

```sql
select (select count(*) from public.cc_watch_rules)                  as watch_rules,     -- 2
       (select count(*) from public.cc_watch_rules where is_active)  as active_rules,    -- 2
       (select count(*) from public.cc_watchlist_items)              as watchlist_items, -- 6
       (select count(*) from public.workspace_members
          where status='active')                                     as active_members;  -- 3
```

So this block will be empty for most users today. It is still worth building —
but it cannot be the primary fix, and it needs a designed empty state that
prompts rule creation rather than rendering a blank.

### 2.6 Role is cosmetic

`ROLE_PROFILES` (`lib/dashboard/dashboardShared.ts:95-115`) is 20 roles of
`{ label, short }` — pure display strings, no behavioural config. Role affects
secondary-nav ordering (`lib/dashboard/roleNavPriority.ts`, 66 lines) and
nothing else on this surface. The role picker is the most prominent control on
the screen and changes almost nothing below it.

**However, the intended mechanism already exists in code and is dormant in
data.** `public.signals` carries `role_families text[]`, `routing_version` and
`routed_at`, and `lib/signals/routing.ts` is a fully written relevance layer
mapping signals onto the 15 role families in `lib/roles/`. Live:

```sql
select count(*) filter (where role_families is not null
                          and cardinality(role_families) > 0) as routed_rows,
       count(*) as total
from public.signals;
-- routed_rows: 0   total: 14169
```

**Zero of 14,169 signals have ever been routed.** The column, the vocabulary and
the classifier module exist; nothing has run. This is the single largest
structural reason role selection cannot change what Command shows.

---

## 3. The upstream defect: there is almost nothing to show

This is the finding that reorders everything else. Investigated because
"Recent intelligence: 1" for Canada looked implausible against a 14,169-row
signals table.

The feed path is: `/api/dashboard/signals` reads `signals_with_quality` (in the
`api` schema — `lib/supabase/client.ts:28` sets `db.schema = 'api'`), filters
`reviewed = true` and not-rejected, then
`canonicalizeDashboardSignals()` (`lib/dashboard/signalFreshness.ts:205-257`)
applies a 7-day window, a strict jurisdiction scope, and a URL-first dedupe
(`dedupeKey()`, lines 185-203).

Each stage checked live for Canada:

```sql
-- raw, in-window, CA
select count(*) from public.signals
where coalesce(source_published_at, event_effective_at, observed_at, date)
      >= now() - interval '7 days' and country_iso2='CA';                   -- 18

-- quality + action gates pass all 18 (none spam/boilerplate/nav/duplicate,
-- none action='rejected')

-- reviewed=true, as the API requires
select count(*) from api.signals_with_quality
where coalesce(source_published_at, event_effective_at, observed_at, date)
      >= now() - interval '7 days' and country='Canada' and reviewed;       -- 12

-- what the dedupe key actually collapses those 12 into
select count(*) as rows, count(distinct url) as distinct_urls,
       count(distinct coalesce(source_published_at, event_effective_at,
                               observed_at, date)) as distinct_timestamps
from api.signals_with_quality
where coalesce(source_published_at, event_effective_at, observed_at, date)
      >= now() - interval '7 days' and country='Canada' and reviewed;
-- rows: 12   distinct_urls: 2   distinct_timestamps: 1
```

**Twelve reviewed Canadian signals in the last seven days resolve to two source
URLs, all stamped with one identical timestamp
(`2026-09-15 06:50:00.205413+00`).** The read-side dedupe is behaving correctly;
it is collapsing genuine duplicates. The feed is thin because the supply into
any one country's 7-day window is ~2 distinct stories.

The pattern is global, not Canada-specific:

```sql
select count(*) as reviewed_7d_rows, count(distinct url) as distinct_urls,
       count(distinct country) as countries,
       count(distinct coalesce(source_published_at, event_effective_at,
                               observed_at, date)) as distinct_timestamps
from api.signals_with_quality
where coalesce(source_published_at, event_effective_at, observed_at, date)
      >= now() - interval '7 days' and reviewed;
-- 196 rows, 86 distinct urls, 41 countries, 12 distinct timestamps
```

196 reviewed rows across 41 countries in seven days, from 86 URLs, carrying 12
distinct timestamps between them. Per-country that averages under three distinct
stories per week. The United States has the deepest coverage at 129 rows / 38
URLs; Canada is second at 12 rows / 2 URLs; every other country is in low single
digits.

Two separate problems are visible here and should not be conflated:

- **Duplicate rows per source URL.** Many rows share one URL, so the read-side
  dedupe discards most of what ingestion produced. Whether that is correct
  (one URL genuinely is one story) or a fan-out defect is an ingestion-side
  question, and `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` governs it.
- **Batch-assigned timestamps.** 196 rows carrying 12 distinct timestamps means
  freshness reflects *when the pipeline ran*, not when anything happened. No
  recency display on any surface can be honest until this is fixed — which makes
  it a hard prerequisite for §4.2 below, not an optional cleanup.

**Consequence for this spec:** items 4.1–4.4 make Command feel live and personal,
but they cannot manufacture intelligence that is not there. If the supply stays
at ~2 distinct stories per country per week, a better-designed Command will
honestly report a quiet week. That may be the correct outcome; it is not the
outcome Tyler is expecting from these changes, so it is stated here explicitly
rather than discovered after the UI work lands.

---

## 4. Proposed changes

Ordered by impact per unit of work. Each is independently shippable.

### 4.1 Per-user "since last visit" state

**The single highest-leverage missing primitive.** Unlocks delta counters, NEW
markers on rows, and a reason for the page to look different today.

**Schema decision (needs Tyler's call — see §6):** add
`command_last_viewed_at timestamptz` to `public.user_dashboard_preferences`.

Recommended over a new table because: the table is already per-user with
`user_id` as the upsert conflict target; RLS is already correct and
`auth.uid()`-scalar-subselect-hardened (`20260831011430`, `20260708214318`);
`/api/dashboard/preferences` already does a partial-field PATCH upsert that this
drops straight into; and there are 9 rows, so no migration-weight concern.

A separate `user_surface_view_state` table would be the right call only if we
expect per-section read state (Intel read separately from Market) soon. We do
not, yet.

**Write path:** extend the existing `PATCH /api/dashboard/preferences` with a
`command_last_viewed_at` field following the existing `normalize*` pattern.
Fire it once per Command mount, *after* computing the delta against the previous
value — read-then-write, so the current view still shows what changed since last
time rather than zeroing itself on arrival.

**Read path:** `dashboardServerData` already loads preferences; carry the
timestamp into `MobileCommandCentreProps`.

**Display:** replace the three inventory counters with a single delta line —
"Since Tuesday: 4 new signals · 2 new opportunities · 1 watch rule fired" — and
mark qualifying rows NEW. On first visit (null timestamp), fall back to the
current counters rather than showing a misleading zero.

**Migration caution:** per `docs/control/AGENT_OPERATING_FACTS.md` §1, merging a
migration does not apply it. This change is not done until
`supabase_migrations.schema_migrations` shows the version. Per §3/§3a of the same
document, the migration must ship in its own PR, separate from any
`EVIDENCE_LOG.md` or `DATABASE_CONTROL.md` edit, or `contracts-and-control` fails
by construction.

### 4.2 Evict the corridor actions from the attention slot

Attention should mean *actionable, yours, and time-bound*. Candidate sources,
all already loaded into the model: watch-rule hits (§4.4), `mySubmissions`
awaiting a response, `pipeline` rows where the user owes a reply, and review
gates not yet cleared.

Corridor plan and landed cost move to a distinct "Tools" affordance — they are
good tools, honestly labelled, in the wrong slot.

Keep a designed empty state. "Nothing requires action" is a legitimate and
useful answer, and with §3's supply reality it will often be the true one.

**Depends on §3's timestamp fix** for any freshness claim it makes.

### 4.3 Put real metadata on intelligence rows

Replace `signalMeta()`'s output with `timeAgo`, `sourceLabel` and
`confidence`, and delete "Active-country match" / "Broader watch". Where a row
resolves to a dossier (`decisionIntelEventId`), link it.

**Blocked on §3's batch-timestamp problem:** shipping `timeAgo` on top of
pipeline-run timestamps would display a confident falsehood. Either fix the
timestamps first, or render `freshnessBasis` honestly (`observed`/`ingested`
rendered as "observed", never as publication).

### 4.4 Wire `matchWatchRuleHits` into the overview

Add a watch-rule block above Commercial, reusing the existing util unchanged.
Given §2.5's org-scoping and the live count of 2 active rules, the empty state
is the majority path and must prompt rule creation rather than render blank.

### 4.5 (Separate track) Populate `role_families`

Not part of this spec's implementation, flagged as the dependency it is: until
`lib/signals/routing.ts` runs over `public.signals`, role can only reorder
navigation, never change content. Backfilling 14,169 rows and wiring the
classifier into ingestion belongs to
`docs/INTELLIGENCE_ARCHITECTURE_SPEC.md`'s staged plan and its §9 guardrails,
and needs its own spec.

---

## 5. Out of scope

- Desktop `CommandCentre.tsx` — mobile overview only.
- Any ingestion-side change to `public.signals` (§3, §4.5).
- Visual redesign beyond the row-metadata and hierarchy changes named above.
- The mobile rail contract. `AGENT_OPERATING_FACTS.md` §5 is binding: no
  `scroll-snap`, no `flex-wrap: wrap`. Nothing here touches the rail.

---

## 6. Open decision for Tyler

**One question, blocking §4.1 only:** column on `user_dashboard_preferences`, or
a new `user_surface_view_state` table?

Recommendation: the column. Rationale in §4.1. Everything else in §4 can proceed
without this answer.

---

## 7. Validation plan

Per `AGENTS.md` "Required QA Commands by Change Type":

- §4.1 is a data-model change: `npm run lint`, `npm run typecheck`,
  `npm run test`, `npm run build`, plus applied-migration confirmation against
  `supabase_migrations.schema_migrations` and a `DATABASE_CONTROL.md` update in
  a separate PR from the migration itself.
- §4.2–4.4 are frontend changes: `npm run lint`, `npm run typecheck`,
  `npm run test`, `npm run build`, plus `npm run test:mobile-intel` and
  `npm run test:command-centre-production`.
- Depth & competitive bar (`AGENTS.md`) applies to §4.2–4.4: the delta line and
  watch-rule block are the differentiators to show on the page itself.
