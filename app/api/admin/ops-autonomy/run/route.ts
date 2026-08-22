/**
 * Admin trigger for ops autonomy (no human review path).
 */
import { NextResponse } from 'next/server'
import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth'
import { runOpsAutonomyTick } from '@/lib/admin/opsAutonomyLoop'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
  const authError = await requireAdminApiAuth()
  if (authError) return authError
  try {
    const result = await runOpsAutonomyTick({
      autoApproveInScope: true,
      runCoverage: true,
    })
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
