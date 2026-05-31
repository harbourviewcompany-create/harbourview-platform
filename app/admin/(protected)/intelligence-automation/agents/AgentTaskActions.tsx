'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'escalated' | 'deferred'

const ACTIONS: Record<string, { label: string; next: TaskStatus; style: string }[]> = {
  pending: [
    { label: 'Start',   next: 'in_progress', style: 'border-sky-400/40 bg-sky-400/10 text-sky-400 hover:bg-sky-400/20' },
    { label: 'Defer',   next: 'deferred',    style: 'border-white/10 bg-white/5 text-[#F5F1E8]/40 hover:text-[#F5F1E8]/70' },
  ],
  in_progress: [
    { label: 'Complete',  next: 'completed',  style: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20' },
    { label: 'Escalate', next: 'escalated',  style: 'border-red-400/40 bg-red-400/10 text-red-400 hover:bg-red-400/20' },
  ],
  deferred: [
    { label: 'Resume', next: 'pending', style: 'border-[#C6A55A]/40 bg-[#C6A55A]/10 text-[#C6A55A] hover:bg-[#C6A55A]/20' },
  ],
  escalated: [
    { label: 'Resolve', next: 'completed', style: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20' },
  ],
}

export function AgentTaskActions({
  taskId,
  currentStatus,
}: {
  taskId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const actions = ACTIONS[currentStatus] ?? []

  if (!actions.length || currentStatus === 'completed') return null

  async function updateStatus(next: TaskStatus) {
    setError(null)
    const res = await fetch(`/api/admin/intelligence/agent-tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to update task')
      return
    }
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      {actions.map(action => (
        <button
          key={action.next}
          onClick={() => updateStatus(action.next)}
          disabled={isPending}
          className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${action.style}`}
        >
          {isPending ? '…' : action.label}
        </button>
      ))}
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  )
}
