import { redirect } from 'next/navigation'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'
import { MyListingsClient } from './MyListingsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Submissions | Harbourview',
  description: 'Track the status of your Harbourview marketplace submissions.',
}

export default async function MyListingsPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login?next=/marketplace/my-listings')

  const svc = await createSupabaseServiceClient()

  const { data: submissions, error } = await svc
    .from('marketplace_candidates')
    .select('id, title_public_draft, marketplace_category, listing_type, status, created_at, submission_images, country')
    .eq('submitted_by', user.id)
    .eq('submission_source', 'self_serve')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) console.error('[my-listings] query error', error)

  return (
    <MyListingsClient
      submissions={submissions ?? []}
      userEmail={user.email ?? ''}
    />
  )
}
