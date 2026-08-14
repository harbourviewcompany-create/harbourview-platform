import 'server-only'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function resolveActiveWorkspace(userId: string) {
  const supabase = await createSupabaseServiceClient()
  const { data: prefs, error: prefsError } = await supabase
    .from('user_dashboard_preferences')
    .select('active_workspace_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (prefsError) {
    return { supabase, workspaceId: null as string | null, membership: null, stale: false, error: prefsError.message }
  }

  const requestedWorkspaceId = prefs?.active_workspace_id ?? null
  if (!requestedWorkspaceId) {
    return { supabase, workspaceId: null as string | null, membership: null, stale: false, error: null }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id,role,status')
    .eq('workspace_id', requestedWorkspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (membershipError || !membership) {
    return {
      supabase,
      workspaceId: null as string | null,
      membership: null,
      stale: true,
      error: membershipError?.message ?? null,
    }
  }

  return {
    supabase,
    workspaceId: membership.workspace_id as string,
    membership,
    stale: false,
    error: null,
  }
}
