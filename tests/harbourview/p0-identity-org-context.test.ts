import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

const migration = read('supabase/migrations/20260814122000_p0_identity_org_context.sql')
const orgCreate = read('app/api/org/create/route.ts')
const orgMe = read('app/api/org/me/route.ts')
const preferences = read('app/api/dashboard/preferences/route.ts')
const invite = read('app/api/org/invitations/route.ts')
const inviteAccept = read('app/api/org/invitations/accept/route.ts')
const activeWorkspace = read('lib/hv/active-workspace.ts')
const watchRules = read('app/api/watchlist/rules/route.ts')
const watchItems = read('app/api/watchlist/items/route.ts')
const licenceSubmit = read('app/api/org/licences/submit/route.ts')
const globeReducer = read('components/globe/useGlobeRouterState.ts')
const globeResolver = read('lib/globe/route-resolver.ts')
const routingSearch = read('components/globe/CountrySearchOverlay.tsx')
const marketOverview = read('components/globe/MarketOverviewSheet.tsx')
const mobileCommand = read('components/dashboard/MobileCommandCentreRebuild.tsx')
const dashboardPage = read('app/dashboard/page.tsx')
const orgContext = read('components/dashboard/OrganizationContextControl.tsx')
const orgCreateForm = read('app/organization/new/OrganizationCreateForm.tsx')
const orgJoinForm = read('app/organization/join/OrganizationJoinForm.tsx')

describe('Harbourview P0 identity, organization, membership and operating context', () => {
  it('extends the canonical preference contract with nullable active workspace and RLS membership validation', () => {
    expect(migration).toContain('active_workspace_id uuid null references public.workspaces(id) on delete set null')
    expect(migration).toContain('active_workspace_id is null')
    expect(migration).toContain('wm.workspace_id = active_workspace_id')
    expect(migration).toContain("wm.status = 'active'")
    expect(migration).toContain('with (security_invoker = true)')
    expect(migration).toMatch(/updated_at,\s+active_workspace_id\s+from public\.user_dashboard_preferences;/)
  })

  it('keeps invitations private while workspace_members remains canonical after acceptance', () => {
    expect(migration).toContain('create table if not exists public.workspace_invitations')
    expect(migration).toContain('token_hash text not null unique')
    expect(migration).toContain('revoke all on table public.workspace_invitations from public, anon, authenticated')
    expect(migration).toContain('grant all on table public.workspace_invitations to service_role')
    expect(migration).toContain('create or replace view api.workspace_invitations')
    expect(migration).toContain('revoke all on api.workspace_invitations from public, anon, authenticated')
    expect(migration).toContain('grant select, insert, update, delete on api.workspace_invitations to service_role')
    expect(invite).toContain("createHash('sha256')")
    expect(invite).toContain("randomBytes(32)")
    expect(invite).not.toContain("schema('public')")
    expect(inviteAccept).not.toContain("schema('public')")
    expect(inviteAccept).toContain("from('workspace_members').upsert")
    expect(inviteAccept).toContain("onConflict: 'workspace_id,user_id'")
    expect(inviteAccept).toContain('INVITATION_EMAIL_MISMATCH')
    expect(inviteAccept).toContain('INVITATION_EXPIRED')
  })

  it('removes the one-organization API assumption and returns deterministic memberships', () => {
    expect(orgCreate).not.toContain('USER_ALREADY_HAS_ORG')
    expect(orgCreate).toContain('workspace_members')
    expect(orgCreate).toContain('active_workspace_id: ws.id')
    expect(orgMe).toContain('memberships')
    expect(orgMe).toContain('.sort((a, b) =>')
    expect(orgMe).toContain('active_mode: activeMembership ? "organization" : "personal"')
    expect(orgMe).toContain('stale_active_workspace_id')
    expect(orgMe).not.toContain('.eq("user_id", user.id).eq("status", "active").single()')
  })

  it('validates active workspace selection against active membership', () => {
    expect(preferences).toContain('active_workspace_id')
    expect(preferences).toContain(".eq('workspace_id', activeWorkspaceId)")
    expect(preferences).toContain(".eq('user_id', user.id)")
    expect(preferences).toContain(".eq('status', 'active')")
    expect(preferences).toContain('Active organization membership required.')
  })

  it('routes organization-scoped operations through the selected operating workspace', () => {
    expect(activeWorkspace).toContain("select('active_workspace_id')")
    expect(activeWorkspace).toContain(".eq('workspace_id', requestedWorkspaceId)")
    expect(activeWorkspace).toContain(".eq('status', 'active')")
    for (const source of [watchRules, watchItems, licenceSubmit]) {
      expect(source).toContain('resolveActiveWorkspace')
      expect(source).not.toContain(".select('workspace_id')\n    .eq('user_id', userId)\n    .limit(1)")
    }
  })

  it('makes role optional and represents All roles as null/empty rather than a fabricated role', () => {
    const marketEnter = globeReducer.slice(globeReducer.indexOf("case 'MARKET_ENTER':"), globeReducer.indexOf("case 'COUNTRY_CLEAR':"))
    expect(marketEnter).toContain("step: 'routing'")
    expect(marketEnter).not.toContain("step: 'role'")
    expect(globeResolver).toContain("href: appendGlobeQuery('/dashboard', input)")
    expect(mobileCommand).toContain('<option value="">All roles</option>')
    expect(mobileCommand).toContain('{ role_id: value || null }')
  })

  it('restores the signed-in saved role while allowing a no-role Command context', () => {
    expect(dashboardPage).toContain('const roleId = urlRole ?? storedRoleId')
    expect(dashboardPage).toContain(".select('country_iso2, role_id, active_workspace_id')")
    expect(dashboardPage).toContain("activeWorkspaceId ?? 'personal'")
  })

  it('surfaces identity and organization onboarding from Market Routing and preserves the selected market', () => {
    expect(routingSearch).toContain('Sign in')
    expect(routingSearch).toContain('Create account')
    expect(routingSearch).toContain('Create organization')
    expect(marketOverview).toContain('Create account')
    expect(marketOverview).toContain('Create organization')
    expect(marketOverview).toContain('commandReturn')
    expect(marketOverview).toContain('countryIso2')
    expect(orgCreateForm).toContain('mode=signup&next=')
    expect(orgCreateForm).toContain("fetch('/api/org/create'")
  })

  it('provides Personal, multi-organization switching, join and stale-context recovery in Command', () => {
    expect(orgContext).toContain('<option value="">Personal</option>')
    expect(orgContext).toContain('Create organization')
    expect(orgContext).toContain('Join organization')
    expect(orgContext).toContain('Your previous organization is no longer available')
    expect(orgContext).toContain('active_workspace_id: value || null')
    expect(mobileCommand).toContain('<OrganizationContextControl')
  })

  it('preserves invitation token return through account creation or sign-in', () => {
    expect(orgJoinForm).toContain('mode=signup&next=')
    expect(orgJoinForm).toContain("fetch('/api/org/invitations/accept'")
    expect(orgJoinForm).toContain('INVITATION_EMAIL_MISMATCH')
    expect(orgJoinForm).toContain('INVITATION_EXPIRED')
  })
})
