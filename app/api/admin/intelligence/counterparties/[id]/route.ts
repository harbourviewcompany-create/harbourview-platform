import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { logIaCounterpartyInteraction } from '@/lib/intelligence-automation/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAuth()
    const { id } = await params

    const body = await request.json()
    const { currentInteractionCount } = body

    if (typeof currentInteractionCount !== 'number') {
      return NextResponse.json({ error: 'currentInteractionCount must be a number' }, { status: 400 })
    }

    const result = await logIaCounterpartyInteraction(id, currentInteractionCount)

    if (!result.ok) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
