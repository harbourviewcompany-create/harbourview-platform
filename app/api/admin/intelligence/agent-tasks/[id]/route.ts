import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { updateIaAgentTaskStatus } from '@/lib/intelligence-automation/db'
import type { AgentTaskStatus } from '@/lib/intelligence-automation/types'

const VALID_STATUSES: AgentTaskStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'escalated',
  'deferred',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminAuth()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { status, notes } = body

    if (!status || !VALID_STATUSES.includes(status as AgentTaskStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    const result = await updateIaAgentTaskStatus(
      id,
      status as AgentTaskStatus,
      notes ?? undefined,
      auth.user.id,
    )

    if (!result.ok) {
      return NextResponse.json({ error: (result as any).error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, taskId: id, status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
