#!/usr/bin/env python3
from pathlib import Path

ROOT = Path('.')


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8')


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    text = target.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'expected text not found in {path}')
    target.write_text(text.replace(old, new, 1), encoding='utf-8')


write(
    'lib/signals/feedbackScores.ts',
    '''/**
 * Load signed ranking effects from persisted signal relevance verdicts.
 *
 * The project exposes only the `api` schema through PostgREST, while the source
 * table lives in `public`. A narrow service-role-only RPC returns only
 * `signal_id` and `verdict`; the table itself remains unexposed.
 *
 * Fails open (empty map) so an unavailable feedback subsystem never breaks the
 * Digest response.
 */

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

// Supabase schema generics are invariant and callers use multiple exposed schemas.
// This boundary erases compile-time schema parameters only; runtime behavior is unchanged.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchemaSupabaseClient = SupabaseClient<any, any, any, any, any>

export const FEEDBACK_VERDICT_WEIGHTS = {
  helpful: 8,
  not_helpful: -12,
  stale: -6,
  wrong_country: -10,
} as const

export type FeedbackVerdict = keyof typeof FEEDBACK_VERDICT_WEIGHTS

function isFeedbackVerdict(value: unknown): value is FeedbackVerdict {
  return typeof value === 'string' && value in FEEDBACK_VERDICT_WEIGHTS
}

export async function loadFeedbackScores(
  _userClient: AnySchemaSupabaseClient,
  signalIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (signalIds.length === 0) return out

  const unique = [...new Set(signalIds)].slice(0, 400)
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString()

  try {
    let client: AnySchemaSupabaseClient = _userClient
    try {
      const { createSupabaseServiceClient } = await import('@/lib/supabase/server')
      client = await createSupabaseServiceClient()
    } catch {
      /* fall back to caller client; the RPC remains service-role-only */
    }

    const { data, error } = await client.rpc('signal_relevance_feedback_for_ranking', {
      p_signal_ids: unique,
      p_since: since,
    })

    if (error || !Array.isArray(data)) return out

    for (const row of data) {
      if (!row || typeof row !== 'object') continue
      const record = row as Record<string, unknown>
      const id = typeof record.signal_id === 'string' ? record.signal_id : ''
      const verdict = record.verdict
      if (!id || !isFeedbackVerdict(verdict)) continue
      out.set(id, (out.get(id) ?? 0) + FEEDBACK_VERDICT_WEIGHTS[verdict])
    }
  } catch {
    return out
  }

  return out
}
''',
)

write(
    'app/api/signals/feedback/route.ts',
    '''// POST /api/signals/feedback
// Authenticated operators mark a signal helpful / not_helpful / stale / wrong_country.
// Writes through a narrow api-schema RPC; public.signal_relevance_feedback remains unexposed.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const VERDICTS = new Set(['helpful', 'not_helpful', 'stale', 'wrong_country'])
const SURFACES = new Set(['digest', 'signals', 'search', 'email'])

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: {
    signalId?: unknown
    verdict?: unknown
    note?: unknown
    surface?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const signalId = typeof body.signalId === 'string' ? body.signalId.trim() : ''
  const verdict = typeof body.verdict === 'string' ? body.verdict.trim() : ''
  const surface =
    typeof body.surface === 'string' && SURFACES.has(body.surface) ? body.surface : 'digest'
  const note =
    typeof body.note === 'string' && body.note.trim()
      ? body.note.trim().slice(0, 500)
      : null

  if (!signalId || signalId.length > 120) {
    return NextResponse.json({ error: 'signalId required' }, { status: 400 })
  }
  if (!VERDICTS.has(verdict)) {
    return NextResponse.json(
      { error: 'verdict must be helpful | not_helpful | stale | wrong_country' },
      { status: 400 },
    )
  }

  const { data: feedbackId, error } = await supabase.rpc('submit_signal_relevance_feedback', {
    p_signal_id: signalId,
    p_verdict: verdict,
    p_note: note,
    p_surface: surface,
  })

  if (error) {
    console.error('signals/feedback RPC failed', { code: error.code })
    return NextResponse.json({ error: 'Unable to record feedback' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    feedbackId: typeof feedbackId === 'string' ? feedbackId : null,
    message:
      verdict === 'helpful'
        ? 'Thanks — this helps the daily brief learn what matters.'
        : 'Recorded. We’ll use this to improve ranking and coverage.',
  })
}
''',
)

old_hnsw = ROOT / 'supabase/migrations/20260731090000_hv_dedup_assign_restore_hnsw_knn.sql'
new_hnsw = ROOT / 'supabase/migrations/20260802073000_hv_dedup_assign_restore_hnsw_knn.sql'
if not old_hnsw.exists():
    raise SystemExit('source HNSW migration missing')
if new_hnsw.exists():
    raise SystemExit('target HNSW migration already exists')
hnsw_text = old_hnsw.read_text(encoding='utf-8')
hnsw_text = hnsw_text.replace(
    'Because this file sorts after 20260730110000, it lands last and wins',
    'Because this uniquely-versioned forward migration sorts after 20260730110000, it lands last and wins',
)
new_hnsw.write_text(hnsw_text, encoding='utf-8')
old_hnsw.unlink()

write(
    'supabase/migrations/20260802152500_signal_feedback_api_rpcs.sql',
    '''-- Controlled PostgREST boundary for Elite Digest operator feedback.
--
-- The project exposes only the `api` schema. The source table remains in
-- `public` and is deliberately not projected as a writable view.

create schema if not exists api;

grant usage on schema api to authenticated, service_role;

create or replace function api.submit_signal_relevance_feedback(
  p_signal_id text,
  p_verdict text,
  p_note text default null,
  p_surface text default 'digest'
)
returns uuid
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_signal_id text := btrim(coalesce(p_signal_id, ''));
  v_verdict text := btrim(coalesce(p_verdict, ''));
  v_surface text := btrim(coalesce(p_surface, 'digest'));
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 500), '');
  v_feedback_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_signal_id = '' or length(v_signal_id) > 120 then
    raise exception 'invalid signal id' using errcode = '22023';
  end if;
  if v_verdict not in ('helpful', 'not_helpful', 'stale', 'wrong_country') then
    raise exception 'invalid feedback verdict' using errcode = '22023';
  end if;
  if v_surface not in ('digest', 'signals', 'search', 'email') then
    raise exception 'invalid feedback surface' using errcode = '22023';
  end if;

  insert into public.signal_relevance_feedback (
    signal_id,
    user_id,
    verdict,
    note,
    surface
  ) values (
    v_signal_id,
    v_user_id,
    v_verdict,
    v_note,
    v_surface
  )
  returning id into v_feedback_id;

  return v_feedback_id;
end
$function$;

comment on function api.submit_signal_relevance_feedback(text, text, text, text) is
  'Authenticated operator feedback writer. Forces user_id from auth.uid(), validates the persisted verdict contract, and does not expose the public table.';

revoke all on function api.submit_signal_relevance_feedback(text, text, text, text) from public, anon;
grant execute on function api.submit_signal_relevance_feedback(text, text, text, text) to authenticated;

create or replace function api.signal_relevance_feedback_for_ranking(
  p_signal_ids text[],
  p_since timestamptz
)
returns table(signal_id text, verdict text)
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select f.signal_id, f.verdict
  from public.signal_relevance_feedback f
  where f.signal_id = any(coalesce(p_signal_ids, array[]::text[]))
    and f.created_at >= coalesce(p_since, now() - interval '90 days')
    and f.verdict in ('helpful', 'not_helpful', 'stale', 'wrong_country');
$function$;

comment on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) is
  'Service-role-only verdict projection for signed Digest ranking. Returns no notes, user IDs, or other operator data.';

revoke all on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) from public, anon, authenticated;
grant execute on function api.signal_relevance_feedback_for_ranking(text[], timestamptz) to service_role;
''',
)

write(
    'tests/signals/feedbackScores.test.ts',
    '''import { describe, expect, it, vi } from 'vitest'

const serviceClientMock = vi.hoisted(() => vi.fn(async () => {
  throw new Error('service role unavailable in unit test')
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: serviceClientMock,
}))

import {
  FEEDBACK_VERDICT_WEIGHTS,
  loadFeedbackScores,
} from '@/lib/signals/feedbackScores'

function makeClient(rows: unknown[], error: unknown = null) {
  const rpc = vi.fn(async () => ({ data: rows, error }))
  return {
    client: { rpc } as unknown as Parameters<typeof loadFeedbackScores>[0],
    rpc,
  }
}

describe('loadFeedbackScores', () => {
  it('uses the persisted verdict contract and preserves signed effects', async () => {
    const { client, rpc } = makeClient([
      { signal_id: 'signal-a', verdict: 'helpful' },
      { signal_id: 'signal-a', verdict: 'not_helpful' },
      { signal_id: 'signal-a', verdict: 'stale' },
      { signal_id: 'signal-a', verdict: 'wrong_country' },
      { signal_id: 'signal-a', verdict: 'unknown' },
      { signal_id: '', verdict: 'helpful' },
    ])

    const scores = await loadFeedbackScores(client, ['signal-a', 'signal-a'])

    expect(rpc).toHaveBeenCalledWith('signal_relevance_feedback_for_ranking', {
      p_signal_ids: ['signal-a'],
      p_since: expect.any(String),
    })
    expect(scores.get('signal-a')).toBe(
      FEEDBACK_VERDICT_WEIGHTS.helpful
        + FEEDBACK_VERDICT_WEIGHTS.not_helpful
        + FEEDBACK_VERDICT_WEIGHTS.stale
        + FEEDBACK_VERDICT_WEIGHTS.wrong_country,
    )
    expect(scores.get('signal-a')).toBe(-20)
  })

  it('fails open when the controlled ranking RPC is unavailable', async () => {
    const { client } = makeClient([], { code: '42501' })
    await expect(loadFeedbackScores(client, ['signal-a'])).resolves.toEqual(new Map())
  })
})
''',
)

write(
    'tests/api/signal-feedback-route.test.ts',
    '''import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  })),
}))

import { POST } from '@/app/api/signals/feedback/route'

function request(body: unknown) {
  return new Request('http://localhost/api/signals/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/signals/feedback', () => {
  beforeEach(() => {
    mocks.getUser.mockReset()
    mocks.rpc.mockReset()
  })

  it('requires an authenticated user', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })
    const response = await POST(request({ signalId: 'signal-a', verdict: 'helpful' }))
    expect(response.status).toBe(401)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('writes through the controlled api-schema RPC and returns its row id', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mocks.rpc.mockResolvedValue({
      data: '11111111-1111-1111-1111-111111111111',
      error: null,
    })

    const response = await POST(request({
      signalId: ' signal-a ',
      verdict: 'wrong_country',
      note: '  mismatched jurisdiction  ',
      surface: 'signals',
    }))

    expect(response.status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith('submit_signal_relevance_feedback', {
      p_signal_id: 'signal-a',
      p_verdict: 'wrong_country',
      p_note: 'mismatched jurisdiction',
      p_surface: 'signals',
    })
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      feedbackId: '11111111-1111-1111-1111-111111111111',
    })
  })

  it('does not leak database error details', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'internal detail' } })

    const response = await POST(request({ signalId: 'signal-a', verdict: 'helpful' }))
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Unable to record feedback' })
  })
})
''',
)

write(
    'tests/sql/elite_digest_forward_repair_dry_run.sql',
    r'''\set ON_ERROR_STOP on
begin;

create extension if not exists vector;
create schema if not exists auth;
create schema if not exists api;

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end
$roles$;

create table auth.users (id uuid primary key);
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

create table public.signals (
  id text primary key,
  embedding_1024 vector(1024),
  created_at timestamptz not null default now(),
  quality_confidence numeric,
  cluster_rep_id text,
  is_representative boolean,
  reviewed boolean,
  reviewed_at timestamptz,
  quality_label text
);

create table public.daily_digest (
  digest_date date,
  status text,
  headlines jsonb,
  editorial_headlines jsonb
);

create index idx_signals_embedding_1024_hnsw
  on public.signals using hnsw (embedding_1024 vector_cosine_ops);

\ir ../../supabase/migrations/20260730233000_intelligence_self_improve_loop.sql
\ir ../../supabase/migrations/20260802073000_hv_dedup_assign_restore_hnsw_knn.sql
\ir ../../supabase/migrations/20260802152500_signal_feedback_api_rpcs.sql

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.signals (
  id, embedding_1024, created_at, quality_confidence, cluster_rep_id, is_representative
) values
  (
    'signal-a',
    ('[1,' || repeat('0,', 1022) || '0]')::vector,
    now() - interval '2 minutes',
    0.90,
    null,
    null
  ),
  (
    'signal-b',
    ('[1,' || repeat('0,', 1022) || '0]')::vector,
    now() - interval '1 minute',
    0.50,
    null,
    null
  );

-- Actual invocation catches lazy PL/pgSQL compilation and runtime failures.
select public.hv_dedup_assign(0.90, 120);

do $dedup_verify$
begin
  if not exists (
    select 1 from public.signals
    where id = 'signal-b' and cluster_rep_id = 'signal-a' and is_representative is false
  ) then
    raise exception 'hv_dedup_assign invocation did not produce the expected representative assignment';
  end if;
end
$dedup_verify$;

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select api.submit_signal_relevance_feedback('signal-a', 'helpful', 'fixture', 'digest');
select api.submit_signal_relevance_feedback('signal-a', 'not_helpful', null, 'signals');
select api.submit_signal_relevance_feedback('signal-a', 'stale', null, 'search');
select api.submit_signal_relevance_feedback('signal-a', 'wrong_country', null, 'email');
reset role;

do $feedback_verify$
declare
  v_score numeric;
  v_count integer;
begin
  select public.signal_feedback_score('signal-a') into v_score;
  if v_score <> -20 then
    raise exception 'signed feedback score mismatch: expected -20, got %', v_score;
  end if;

  select count(*) into v_count
  from api.signal_relevance_feedback_for_ranking(
    array['signal-a'], now() - interval '1 day'
  );
  if v_count <> 4 then
    raise exception 'ranking verdict projection expected 4 rows, got %', v_count;
  end if;

  if has_function_privilege(
    'anon',
    'api.submit_signal_relevance_feedback(text,text,text,text)',
    'EXECUTE'
  ) then
    raise exception 'anon must not execute feedback writer';
  end if;

  if has_function_privilege(
    'authenticated',
    'api.signal_relevance_feedback_for_ranking(text[],timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'authenticated must not execute ranking projection';
  end if;

  if not has_function_privilege(
    'service_role',
    'api.signal_relevance_feedback_for_ranking(text[],timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'service_role must execute ranking projection';
  end if;
end
$feedback_verify$;

rollback;
''',
)

write(
    '.github/workflows/elite-digest-forward-repair-verification.yml',
    '''name: Elite Digest Forward Repair Verification

on:
  pull_request:
    branches:
      - main
    paths:
      - 'app/api/signals/feedback/route.ts'
      - 'lib/signals/feedbackScores.ts'
      - 'supabase/migrations/20260802073000_hv_dedup_assign_restore_hnsw_knn.sql'
      - 'supabase/migrations/20260802152500_signal_feedback_api_rpcs.sql'
      - 'tests/signals/feedbackScores.test.ts'
      - 'tests/api/signal-feedback-route.test.ts'
      - 'tests/sql/elite_digest_forward_repair_dry_run.sql'
      - 'docs/ops/ELITE_DIGEST_DEPLOY.md'
      - 'docs/control/DATABASE_CONTROL.md'
      - 'docs/control/EVIDENCE_LOG.md'
      - '.github/workflows/elite-digest-forward-repair-verification.yml'
      - '.github/workflows/supabase-migrate.yml'

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 50
    services:
      postgres:
        image: pgvector/pgvector:pg17
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 20
    env:
      PGHOST: 127.0.0.1
      PGPORT: 5432
      PGUSER: postgres
      PGPASSWORD: postgres
      PGDATABASE: postgres
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Migration filename uniqueness
        run: node scripts/check-migration-filenames.mjs
      - name: Targeted feedback regressions
        run: npx vitest run tests/signals/feedbackScores.test.ts tests/api/signal-feedback-route.test.ts
      - name: Lint
        run: npm run lint
      - name: Typecheck
        run: npm run typecheck
      - name: Full tests
        run: npm run test
      - name: Production build
        run: npm run build
      - name: Public boundary checks
        run: |
          npm run test:visibility
          npm run test:security
      - name: PostgreSQL 17 + pgvector migration fixture
        run: psql -v ON_ERROR_STOP=1 -f tests/sql/elite_digest_forward_repair_dry_run.sql
''',
)

# Make production migration application manual-only. A merge must never imply
# authorization to write the live database.
workflow_path = ROOT / '.github/workflows/supabase-migrate.yml'
workflow = workflow_path.read_text(encoding='utf-8')
old_trigger = '''on:\n  push:\n    branches:\n      - main\n    paths:\n      - 'supabase/migrations/**'\n  workflow_dispatch:\n'''
new_trigger = '''on:\n  workflow_dispatch:\n    inputs:\n      production_action:\n        description: 'Explicit production migration authorization'\n        required: true\n        type: choice\n        default: HOLD\n        options:\n          - HOLD\n          - APPLY_PRODUCTION_MIGRATIONS\n'''
if old_trigger not in workflow:
    raise SystemExit('supabase-migrate trigger block changed unexpectedly')
workflow = workflow.replace(old_trigger, new_trigger, 1)
workflow = workflow.replace(
    '''  migrate:\n    name: Apply Supabase migrations\n''',
    '''  migrate:\n    if: inputs.production_action == 'APPLY_PRODUCTION_MIGRATIONS'\n    name: Apply Supabase migrations — explicit production authorization\n''',
    1,
)
workflow_path.write_text(workflow, encoding='utf-8')

write(
    'docs/ops/ELITE_DIGEST_DEPLOY.md',
    '''# Elite Digest deployment control

Status: **HOLD until explicitly authorized for production activation.**

Merging application or migration code is not authorization to apply migrations,
create a deployment, or move a production alias. The production migration
workflow is manual-dispatch only and requires the explicit
`APPLY_PRODUCTION_MIGRATIONS` selection.

## 1. Migration sequence

Reconcile exact filenames and definitions against the target migration ledger in
this version order:

```text
20260730230000_elite_digest_from_pipeline_b.sql
20260730233000_intelligence_self_improve_loop.sql
20260731090000_digest_rank_includes_feedback.sql
20260731100000_run_daily_digest_uses_feedback_rank.sql
20260731110000_feedback_service_aggregates.sql
20260731130000_elite_digest_release_hardening.sql
20260802073000_hv_dedup_assign_restore_hnsw_knn.sql
20260802152500_signal_feedback_api_rpcs.sql
```

The previous HNSW file shared `20260731090000` with the feedback-ranking
migration. It is replaced by the unique `20260802073000` forward version.

Use a Supabase preview branch for application tests. If a preview is unavailable,
keep production on HOLD. Do not use production as an automatic preview fallback.
Production application requires remote-ledger reconciliation, all documented
fixtures and checks, and separate explicit operator approval.

## 2. Environment names

Verify names and presence without copying values into logs or PRs:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `openai_api_key` or an approved alternative provider key in Vault
- `RESEND_API_KEY`
- `HARBOURVIEW_PIPELINE_REVIEW_NOTIFY_EMAIL`

## 3. Database verification

Before any deployment alias changes:

```sql
select public.run_daily_digest();
select public.hv_intelligence_outcome_check();
select pg_get_functiondef('public.hv_dedup_assign(double precision,integer)'::regprocedure);
select pg_get_functiondef('api.submit_signal_relevance_feedback(text,text,text,text)'::regprocedure);
select pg_get_functiondef('api.signal_relevance_feedback_for_ranking(text[],timestamptz)'::regprocedure);
```

Confirm the HNSW body retains `ORDER BY <=> LIMIT`, the feedback writer forces
`user_id` from `auth.uid()`, and the ranking projection is executable only by
`service_role`.

## 4. Product smoke

Run only against a verified unaliased artifact after database and environment
gates pass:

1. `GET /api/dashboard/digest` returns `curated-edition` or `elite-ranked-fallback`.
2. Corroboration, language, source confidence, and decoded text render correctly.
3. Select a designated test signal and record the authenticated verifier ID and
   UTC start time.
4. Submit each verdict through `POST /api/signals/feedback` and capture the exact
   returned `feedbackId` values.
5. Verify helpful is positive and `not_helpful`, `stale`, and `wrong_country` are
   negative ranking effects.
6. Delete only those captured rows through a separately authorized service-role
   cleanup action, then prove the IDs no longer exist. Verification feedback must
   not bias live ranking for 90 days.
7. Verify `/api/admin/intelligence-health` includes `product_outcome`.

## 5. Deployment and alias order

1. Reconcile and explicitly authorize migrations.
2. Verify environment names without exposing values.
3. Create an immutable deployment and keep it unaliased.
4. Run database and authenticated product smoke checks.
5. Record sanitized evidence.
6. Move the production alias only under separate explicit authorization.
7. Observe a successful daily `/api/cron/intelligence-health` invocation at
   `15 10 * * *`.

## 6. Guardrails

- Human `reviewed` flags are unchanged.
- Only actually selected Digest signals receive `used_in_digest_at`.
- Feedback effects remain signed: helpful `+8`, not helpful `-12`, stale `-6`,
  wrong country `-10`; the final ranking contribution remains clamped by the
  Digest ranker.
- The underlying feedback table is not exposed through PostgREST.
- No production migration or deployment action is implied by merge.
''',
)

# Append database control and preliminary evidence. Exact immutable run IDs are
# written after the final head finishes verification.
db_control = ROOT / 'docs/control/DATABASE_CONTROL.md'
db_text = db_control.read_text(encoding='utf-8')
section = '''\n\n## 2026-08-02 — Elite Digest feedback API boundary and HNSW forward version\n\n- Replaces the duplicate-prefix HNSW file with unique migration\n  `20260802073000_hv_dedup_assign_restore_hnsw_knn.sql`.\n- Adds `20260802152500_signal_feedback_api_rpcs.sql` with two narrow functions:\n  authenticated feedback insertion that forces `user_id = auth.uid()`, and a\n  service-role-only verdict projection for ranking. The public table remains\n  unexposed.\n- Converts `.github/workflows/supabase-migrate.yml` to explicit manual dispatch.\n  A push or merge is not production database authorization.\n- PostgreSQL verification must create pgvector storage, apply both migrations,\n  invoke `hv_dedup_assign`, submit all four persisted verdicts, verify the signed\n  aggregate is `-20`, and verify execute grants.\n- Live application remains HOLD pending separate operator authorization and\n  remote-ledger reconciliation. Rollback is a reviewed forward migration; never\n  delete ledger history.\n'''
if 'Elite Digest feedback API boundary and HNSW forward version' not in db_text:
    db_control.write_text(db_text.rstrip() + section, encoding='utf-8')

evidence = ROOT / 'docs/control/EVIDENCE_LOG.md'
evidence_text = evidence.read_text(encoding='utf-8')
row_anchor = '|---|---|---|---|---|---|\n'
row = '| 2026-08-02 | Elite Digest feedback/HNSW forward repair | Exact-head workflow evidence pending | Controlled API RPCs, unique migration versions, actual pgvector invocation, and manual-only production migration gate | Replacement PR — update with immutable run IDs before merge | **Current — merge HOLD pending exact-head evidence** |\n'
if row not in evidence_text:
    if row_anchor not in evidence_text:
        raise SystemExit('Build Evidence table anchor missing')
    evidence_text = evidence_text.replace(row_anchor, row_anchor + row, 1)
appendix = '''\n\n## 2026-08-02 — Elite Digest feedback/HNSW replacement repair\n\n- Clean base: `6fd3cb2a2f43fb4a998c52ae03f06e5d0cb14eb5`.\n- Required outcomes: persisted `verdict` scoring with signed effects; narrow\n  authenticated feedback writer; service-role-only ranking projection; unique\n  HNSW migration version; actual PostgreSQL 17 + pgvector invocation; sorted\n  migration controls; manual-only production migration application.\n- Production boundaries: no live migration, deployment, alias movement, secret\n  read, or secret persistence.\n- Merge remains HOLD until exact-head targeted tests, migration uniqueness, lint,\n  typecheck, full tests, build, public-boundary checks, PostgreSQL fixture, CI,\n  Branch Verification, and review-thread audit are all recorded with immutable\n  run IDs and zero unresolved material findings.\n'''
if 'Elite Digest feedback/HNSW replacement repair' not in evidence_text:
    evidence_text = evidence_text.rstrip() + appendix
evidence.write_text(evidence_text, encoding='utf-8')

print('Elite Digest forward repair files generated')
