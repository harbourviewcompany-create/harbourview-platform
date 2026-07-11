// app/api/admin/backfill-tier-metadata/route.ts
// ONE-SHOT: backfills app_metadata.subscription_tier for all paid users
// whose tier in user_profiles doesn't match their JWT app_metadata.
//
// Auth: CRON_SECRET bearer token (same as cron routes — admin-only).
// Safe to call multiple times — idempotent. Delete this file after running.
//
// Usage:
//   curl -X POST \
//     -H "Authorization: Bearer $CRON_SECRET" \
//     https://your-domain.com/api/admin/backfill-tier-metadata

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic   = 'force-dynamic'
export const maxDuration = 300

interface UserProfileRow {
  id: string
  tier: 'free' | 'intel' | 'operator'
  email: string | null
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // Fetch all non-free users
  const { data: profiles, error: profilesErr } = await supabase
    .from('user_profiles')
    .select('id, tier, email')
    .in('tier', ['intel', 'operator'])

  if (profilesErr) {
    return NextResponse.json({ error: profilesErr.message }, { status: 500 })
  }

  const rows = (profiles as UserProfileRow[] | null) ?? []
  console.info(`backfill_tier: ${rows.length} paid users to backfill`)

  if (rows.length === 0)
    return NextResponse.json({ ok: true, backfilled: 0, failed: 0, message: 'No paid users found' })

  let backfilled = 0
  let failed = 0
  const failures: Array<{ id: string; error: string }> = []

  for (const row of rows) {
    const { error } = await supabase.auth.admin.updateUserById(row.id, {
      app_metadata: { subscription_tier: row.tier },
    })

    if (error) {
      console.error(`backfill_tier: failed for ${row.id} (${row.email ?? 'no email'}):`, error.message)
      failures.push({ id: row.id, error: error.message })
      failed++
    } else {
      console.info(`backfill_tier: set ${row.tier} for ${row.email ?? row.id}`)
      backfilled++
    }
  }

  return NextResponse.json({
    ok:         failed === 0,
    total:      rows.length,
    backfilled,
    failed,
    failures:   failures.length > 0 ? failures : undefined,
  })
}
