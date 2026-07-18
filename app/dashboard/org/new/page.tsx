import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import CreateOrgForm from './CreateOrgForm'

export const metadata: Metadata = {
  title: 'Create Your Organization | Harbourview',
  description: 'Set up your Harbourview workspace and begin Passport verification.',
}

export const dynamic = 'force-dynamic'

export default async function CreateOrgPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login?redirect_to=/dashboard/org/new')

  // If this user already owns/belongs to a workspace, this page isn't for them —
  // org/create itself is a one-per-user path (see USER_ALREADY_HAS_ORG in the API route).
  const supabase = await createSupabaseServiceClient()
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (existing) redirect('/dashboard?notice=org_exists')

  const countryOptions = ALL_COUNTRIES.map(c => ({ iso2: c.iso2, name: c.displayName }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return <CreateOrgForm countryOptions={countryOptions} />
}
