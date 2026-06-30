import { NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = await createSupabaseServiceClient()
  const { data, error } = await svc
    .from('marketplace_candidates')
    .select('id, title_public_draft, marketplace_category, listing_type, status, created_at, country')
    .eq('submitted_by', user.id)
    .eq('submission_source', 'self_serve')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[my-submissions] query error', error)
    return NextResponse.json({ error: 'Failed to load submissions' }, { status: 500 })
  }

  return NextResponse.json({ submissions: data ?? [] })
}
