import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const promoteRoute = readFileSync('app/api/admin/marketplace/matches/[id]/promote/route.ts', 'utf8')
const orgCreateRoute = readFileSync('app/api/org/create/route.ts', 'utf8')
const snapshotMigration = readFileSync(
  'supabase/migrations/20260813184000_restore_hv_org_snapshots_foundation.sql',
  'utf8',
).toLowerCase()

describe('commercial-graph baseline contract repairs', () => {
  it('keeps match promotion inside the production lifecycle', () => {
    expect(promoteRoute).not.toContain("status: 'deal_room_created'")
    expect(promoteRoute).toContain("status: 'introduced'")
    expect(promoteRoute).toContain('introduced_at: new Date().toISOString()')
  })

  it('uses the supported workspace membership role', () => {
    expect(orgCreateRoute).not.toContain('role: "owner"')
    expect(orgCreateRoute).not.toContain('.eq("role", "owner")')
    expect(orgCreateRoute).toContain('role: "admin"')
    expect(orgCreateRoute).toContain('.eq("user_id", user.id).eq("status", "active").maybeSingle()')
  })

  it('restores one private org snapshot per workspace', () => {
    expect(snapshotMigration).toContain('create table if not exists public.hv_org_snapshots')
    expect(snapshotMigration).toContain('org_id uuid primary key references public.workspaces(id) on delete cascade')
    expect(snapshotMigration).toContain('completeness_score double precision not null default 0')
    expect(snapshotMigration).toContain('marketplace_listing_count integer not null default 0')
    expect(snapshotMigration).toContain('has_export_licence boolean not null default false')
    expect(snapshotMigration).toContain('has_coa boolean not null default false')
  })

  it('uses RLS and a security-invoker api view for the existing service writer', () => {
    expect(snapshotMigration).toContain('alter table public.hv_org_snapshots enable row level security')
    expect(snapshotMigration).toContain('using (public.hv_is_org_member(org_id))')
    expect(snapshotMigration).toContain('using (public.hv_is_platform_staff())')
    expect(snapshotMigration).toContain('create or replace view api.hv_org_snapshots')
    expect(snapshotMigration).toContain('with (security_invoker = true)')
    expect(snapshotMigration).toContain('grant select, insert, update, delete on api.hv_org_snapshots to service_role')
  })
})
