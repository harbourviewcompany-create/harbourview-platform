import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ADMIN_NAV_GROUPS } from '@/lib/admin/navConfig'
import { hasAdminRole } from '@/lib/auth/adminRoles'

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('Admin Command Center Phase 0-4 contracts', () => {
  it('preserves the admin/operator authorization contract', () => {
    expect(hasAdminRole(['admin'])).toBe(true)
    expect(hasAdminRole(['operator'])).toBe(true)
    expect(hasAdminRole(['analyst'])).toBe(false)
    expect(hasAdminRole(['viewer'])).toBe(false)
  })

  it('keeps specialist admin routes reachable while adding canonical command routes', () => {
    const hrefs = new Set(ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href)))
    for (const href of [
      '/admin', '/admin/work', '/admin/signals', '/admin/inquiries', '/admin/candidates', '/admin/listings',
      '/admin/marketplace/intake-queue', '/admin/deal-dashboard', '/admin/applications', '/admin/counterparties',
      '/admin/orgs', '/admin/members', '/admin/sources', '/admin/intelligence-automation', '/admin/intelligence/briefings',
      '/admin/intelligence/health-canada', '/admin/agents', '/admin/proprietary-intelligence', '/clinical/review',
      '/admin/routing/genetics', '/admin/genetics/review', '/admin/pipeline-health', '/admin/stripe-health',
      '/admin/stripe-setup', '/admin/enterprise', '/admin/partners', '/admin/monetization',
      '/admin/reports', '/admin/governance', '/admin/global-expansion', '/admin/regulatory-pathways',
      '/admin/education', '/admin/network', '/admin/regulatory-signals', '/admin/hub',
    ]) expect(hrefs.has(href)).toBe(true)
  })

  it('locks the responsive shell contract and preserves legacy Hub parity without conditional hooks', () => {
    const shell = read('components/admin/AdminShell.tsx')
    expect(shell).toContain('min-h-dvh overflow-x-hidden')
    expect(shell).toContain('lg:hidden')
    expect(shell).toContain('lg:flex')
    expect(shell).toContain("env(safe-area-inset-top)")
    expect(shell).toContain("env(safe-area-inset-bottom)")
    expect(shell.indexOf("if (legacyHub) return")).toBeGreaterThan(shell.indexOf('useEffect('))
  })

  it('keeps new work adapters on the canonical api-schema service client', () => {
    const workServer = read('lib/admin/work/server.ts')
    const migration = read('supabase/migrations/20260818123000_admin_review_queue_api_rpc.sql')
    expect(workServer).toContain('createSupabaseServiceClient')
    expect(workServer).toContain("rpc('list_admin_review_queue'")
    expect(workServer).toContain(".from('marketplace_inquiries')")
    expect(workServer).toContain(".from('marketplace_candidates')")
    expect(workServer).not.toContain('fetchAdminSupabaseJson')
    expect(workServer).toContain("['received', 'reviewing', 'contacted', 'qualified']")
    expect(workServer).toContain("['needs_review', 'needs_verification']")
    expect(migration).toContain('service-role-only')
    expect(migration).toContain('grant execute on function api.list_admin_review_queue(boolean, integer) to service_role')
    expect(migration).toContain('revoke all on function api.list_admin_review_queue(boolean, integer) from public, anon, authenticated')
  })

  it('keeps the Hub and Stripe setup during parity and records exactly one runtime hub-proxy caller', () => {
    const parity = JSON.parse(read('docs/control/ADMIN_COMMAND_CENTER_HUB_PARITY.json'))
    expect(parity.base_sha).toBe('db692bceccdcf4dc263530b947b775c93fb6b535')
    expect(parity.navigation).toHaveLength(14)
    expect(parity.hub_proxy.runtime_caller_count).toBe(1)
    expect(parity.phase_0_4_disposition.legacy_hub).toBe('retained_at_/admin/hub_for_parity')
    expect(parity.phase_0_4_disposition.stripe_setup).toBe('retained_unchanged')
    expect(parity.parity_assertions.migration_required).toBe(true)
    expect(parity.parity_assertions.production_applied).toBe(false)
  })

  it('requires typed bulk signal auth and audit wiring and does not use hub-proxy for the new workflow', () => {
    const route = read('app/api/admin/signals/bulk/route.ts')
    const migration = read('supabase/migrations/20260818123000_admin_review_queue_api_rpc.sql')
    const workspace = read('components/admin/SignalReviewWorkspace.tsx')
    expect(route).toContain('requireAdminApiAuth')
    expect(route).toContain('createSupabaseServiceClient')
    expect(route).toContain("rpc('append_admin_signal_audit'")
    expect(route).toContain('idempotency_key')
    expect(route).not.toContain('hub-proxy')
    expect(migration).toContain('grant execute on function api.append_admin_signal_audit(text, text, text, text, jsonb) to service_role')
    expect(migration).toContain('revoke all on function api.append_admin_signal_audit(text, text, text, text, jsonb) from public, anon, authenticated')
    expect(workspace).toContain('/api/admin/signals/bulk')
    expect(workspace).not.toContain('hub-proxy')
  })
})
