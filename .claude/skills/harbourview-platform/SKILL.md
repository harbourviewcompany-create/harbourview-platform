---
name: harbourview-platform
description: Operating guide for the Harbourview Platform repo (harbourviewcompany-create/harbourview-platform) — a regulated global cannabis intelligence/compliance SaaS on Next.js 15 + Supabase + Vercel, covering all jurisdictions worldwide. Use this skill whenever working on this repo: committing code via the GitHub API, running Supabase MCP migrations/RPCs against the `zvxdgdkukjrrwamdpqrg` project, diagnosing Vercel build/TypeScript failures, working with the Command Centre dashboard, role profiles, jurisdiction/country architecture (191+ countries, all UN member states), or the signal ingestion pipeline. Always load this before touching this repo.
---

# Harbourview Platform — Operating Guide

Harbourview is a global, multi-jurisdiction cannabis intelligence and compliance SaaS. Every country and subnational jurisdiction matters equally — country/role coverage should never be treated as "edge cases" to skip.

## Repo & infra identifiers (use these exactly)
- GitHub repo: `harbourviewcompany-create/harbourview-platform`
- Supabase project ref: `zvxdgdkukjrrwamdpqrg` (region `us-west-2`)
- Vercel team slug: `harbourview`, project ID: `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`
- Stack: Next.js 15 (App Router), Supabase (Postgres + RPC + REST), Vercel hosting

## 0. Read AGENTS.md and docs/control/ first
This repo has a real governance layer:
- `AGENTS.md` defines repo-wide rules, QA command matrix per change type, and precedence for nested AGENTS.md files.
- `docs/control/` holds canonical compliance/policy copy (`BUILD_CONTROL.md`, `DESIGN_SYSTEM.md`, `PR_REVIEW_CHECKLIST.md`, `EVIDENCE_LOG.md`, `PROJECT_REGISTRY.md`, `FINAL_PRODUCTION_READINESS_AUDIT.md`).
- `docs/HARBOURVIEW_AIRTABLE_SUPABASE_CONTRACT.md` and `docs/HARBOURVIEW_PUBLIC_PRIVATE_DTO_ALLOWLIST.md` define the public/private data contract — check these before changing any DTO shape or exposing new fields.
- Run the QA command set matching your change type (docs / frontend / backend / data-model) from AGENTS.md before considering a change done.

## 1. GitHub commits — act immediately, no preamble
GitHub PATs given in chat are auto-revoked by secret scanning within seconds. **The very first tool call must be the API request using the PAT** — no explanatory text first.

Use Python `urllib.request`, not shell curl (large `-d` payloads silently fail with curl):

```python
import urllib.request, json, base64, urllib.parse

token = "<PAT>"
repo = "harbourviewcompany-create/harbourview-platform"

def gh(method, path, body=None):
    url = f"https://api.github.com/repos/{repo}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "claude"
    })
    return json.loads(urllib.request.urlopen(req).read())

# Always fetch existing SHA before overwriting a file
existing = gh("GET", f"/contents/{urllib.parse.quote('path/with(parens).ts', safe='/')}")
sha = existing["sha"]

content = base64.b64encode(b"...new file contents...").decode()
gh("PUT", f"/contents/{urllib.parse.quote('path/to/file.ts', safe='/')}", {
    "message": "fix: description of change",
    "content": content,
    "sha": sha,
    "branch": "feat/command-centre-jurisdiction-architecture"
})
```

- `urllib.parse.quote(path, safe='/')` for any path containing parentheses or special chars.
- Before appending to a TypeScript file, check for existing symbol declarations to avoid duplicate exports.
- Active feature branches to be aware of: `feat/command-centre-jurisdiction-architecture`, `feat/passport-mvp-p2-routes`.

## 2. Diagnosing Vercel build failures
1. `Vercel:list_teams` and `Vercel:list_projects` (teamId: `harbourview`) are reliable.
2. Deeper tools (`list_deployments`, `get_deployment_build_logs`) may report "Tool not found" — call `tool_search` with a Vercel-related query immediately before invoking them.
3. `get_deployment_build_logs` often returns empty events during/after a failure. **Prefer GitHub check-run annotations** for TypeScript errors:
   - `GET /repos/{owner}/{repo}/commits/{sha}/check-runs`
   - then `GET /repos/{owner}/{repo}/check-runs/{id}/annotations`
4. The CI workflow is named **"Verify marketplace category pages."**

### Known recurring TS failure classes
- Next.js 15 breaking change: `searchParams` in page components is now a `Promise` — must `await` it.
- Cascading failures from field removal on shared types (e.g. `source` removed from `AdminDataResult`, or `authority_level`/`lead_weeks` removed from `source_registry`) — search for all usages repo-wide before removing a shared field.

## 3. Environment variables
Confirmed-missing/required vars to check whenever debugging runtime errors (`Vercel:list_projects` env config or `.env.example`):
`HF_TOKEN_SERVER`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, Stripe price IDs, email config vars.

## 4. Supabase MCP usage

> **`apply_migration` writes to production and does NOT write a repository file.**
> Every call creates a `supabase_migrations.schema_migrations` row that exists in
> production and nowhere else — this is the single largest source of migration
> drift in this repo. On 2026-09-02 the drift gate was red with 30 such versions,
> 25 of them stamped `created_by = harbourviewcompany@gmail.com` (i.e. applied
> through this tool). **Applying a migration is only half the change.** The other
> half — committing the identical SQL to `supabase/migrations/<version>_<name>.sql`
> on a branch, in a PR — is not optional and is not a follow-up task. Do both in
> the same session or do neither.
>
> If you find yourself about to apply something to production that you have not
> already written to a file, stop and write the file first. Recovery afterwards is
> possible (`select statements[1] from supabase_migrations.schema_migrations where
> version = '<version>'` returns the applied SQL verbatim) but it is strictly worse:
> it costs a separate reconciliation PR, and comment/rationale content has been
> lost that way before.

- `execute_sql` and `apply_migration` are both reliable; **prefer `apply_migration`** for creating/replacing RPCs since it handles idempotency. It requires a `name` parameter.
- Use the **same** `version`/`name` for the committed file as the applied migration, so the drift gate reconciles them.
- Before pinning `search_path` on any function, check whether it depends on a type or operator from another schema (pgvector's `vector` lives in `extensions`). Pinning such a function to `public` alone breaks it at call time, not at apply time. Write the list unquoted — `set search_path to public, extensions` — since `set search_path = 'public, extensions'` quotes the whole list as one identifier and silently does not work. Both mistakes were made in production on 2026-09-01/02.
- Cron jobs: `SELECT cron.schedule(...)`.
- REST API base: `https://zvxdgdkukjrrwamdpqrg.supabase.co/rest/v1/`
  - Headers: `apikey: <service_role_key>` AND `Authorization: Bearer <service_role_key>`
  - Mutations: add `Prefer: return=representation` to get data back.
  - RPC calls: `POST /rest/v1/rpc/{function_name}`.

### Key RPCs / functions already in place
- `get_command_centre_metrics`, `get_country_status` — cover all 191 UN member-state countries, used by the role dashboards.
- `getMarketplaceRows()` — shapes approved listings into typed `MarketRow` tuples.
- `fetchDashboardSignals()`, `getWantedListings()` — accept country-filter params; wired into a single `Promise.all` in the role dashboard page for all 20 role profiles.
- Signal pipeline: `hv_ingest_snapshot_to_staging`, `promote_snapshot_to_signals`, `trg_auto_promote_snapshot` — watch for trigger recursion bugs and missing pg_cron jobs if snapshots get stuck in `pending`.

## 5. Command Centre / jurisdiction architecture
- Three-panel Command Centre dashboard, role-based views across **20 role profiles**.
- Country/jurisdiction-aware routing: globe view → market selection → Command Centre. Known open bug class: **subnational codes (e.g. `US-GA`) can render stale country-level defaults** instead of state-specific data — when touching routing/jurisdiction code, explicitly test subnational codes, not just top-level country codes.
- When adding/modifying country coverage, always seed/verify all 191 UN member states (plus any subnational jurisdictions in scope) — don't special-case a subset of "major" markets given the platform's global mandate.

## 6. Optimization checklist for this repo
When asked to "optimize Harbourview", interpret broadly across these axes and ask which the user cares about most if ambiguous:
- **Build health**: zero TypeScript errors, all QA commands in AGENTS.md passing for the change type.
- **Data freshness**: dashboard fetches replaced with live Supabase queries (not mocks), `Promise.all`-batched per page.
- **Coverage completeness**: all 20 role profiles × all jurisdictions (191 countries + subnational where applicable) have working module configs and non-stale routing.
- **Pipeline health**: no snapshots stuck in `pending`; cron jobs present and firing; no trigger recursion.
- **Compliance contract integrity**: public/private DTO allowlist (`docs/HARBOURVIEW_PUBLIC_PRIVATE_DTO_ALLOWLIST.md`) respected — no leakage of admin-only fields to public routes.
- **Env completeness**: no missing required env vars in Vercel project config.

Direct, low-ceremony communication is preferred — act on tasks/credentials immediately rather than narrating steps.
