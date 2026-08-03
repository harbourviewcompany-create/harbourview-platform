import { NextResponse } from 'next/server'
import { checkFeatureAccess } from '@/lib/billing/entitlements'
import { loadPersonalBriefingsData } from '@/lib/dashboard/personalBriefingsData'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const access = checkFeatureAccess({ app_metadata: user.app_metadata }, 'watchlist')
  if (!access.granted) {
    return NextResponse.json(
      {
        error: `Personal briefings require the ${access.requiredTier} tier`,
        currentTier: access.currentTier,
        requiredTier: access.requiredTier,
      },
      { status: 403 },
    )
  }

  try {
    return NextResponse.json(await loadPersonalBriefingsData(user.id))
  } catch (error) {
    console.error('[personal-briefings] load failed', error)
    return NextResponse.json({ error: 'Personal briefings could not be loaded' }, { status: 500 })
  }
}
