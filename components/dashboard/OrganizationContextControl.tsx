'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

type Membership = {
  workspace_id: string
  role: string
  status: string
  workspace: {
    id: string
    name: string | null
    legal_name: string | null
    trade_name: string | null
    verification_status: string
    status: string
  } | null
}

type OrgMeResponse = {
  data?: {
    active_workspace_id: string | null
    stale_active_workspace_id: string | null
    memberships: Membership[]
    invitations: Array<{ id: string; workspace_id: string; role: string; expires_at: string }>
  }
  error?: string
}

export default function OrganizationContextControl({ onDone }: { onDone?: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [state, setState] = useState<'loading' | 'ready' | 'anonymous' | 'error'>('loading')
  const [activeId, setActiveId] = useState<string>('')
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [invitationCount, setInvitationCount] = useState(0)
  const [stale, setStale] = useState(false)
  const [saving, setSaving] = useState(false)

  const returnTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const encodedReturnTo = encodeURIComponent(returnTo)

  async function load() {
    setState('loading')
    try {
      const response = await fetch('/api/org/me', { cache: 'no-store' })
      if (response.status === 401) {
        setState('anonymous')
        return
      }
      const payload = await response.json() as OrgMeResponse
      if (!response.ok || !payload.data) {
        setState('error')
        return
      }
      setActiveId(payload.data.active_workspace_id ?? '')
      setMemberships(payload.data.memberships.filter(item => item.status === 'active' && item.workspace?.status === 'active'))
      setInvitationCount(payload.data.invitations?.length ?? 0)
      setStale(Boolean(payload.data.stale_active_workspace_id))
      setState('ready')
    } catch {
      setState('error')
    }
  }

  useEffect(() => { void load() }, [])

  async function changeOrganization(value: string) {
    setSaving(true)
    try {
      const response = await fetch('/api/dashboard/preferences', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ active_workspace_id: value || null }),
      })
      if (!response.ok) throw new Error('save failed')
      setActiveId(value)
      setStale(false)
      onDone?.()
      window.location.reload()
    } catch {
      setState('error')
    } finally {
      setSaving(false)
    }
  }

  if (state === 'anonymous') {
    return (
      <div className="grid gap-2 rounded-xl border border-white/10 p-3">
        <span className="text-xs font-semibold text-white/60">Organization</span>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href={`/login?next=${encodedReturnTo}`} className="text-[#d8be76]">Sign in</Link>
          <Link href={`/login?mode=signup&next=${encodedReturnTo}`} className="text-[#d8be76]">Create account</Link>
          <Link href={`/organization/new?returnTo=${encodedReturnTo}`} className="text-[#d8be76]">Create organization</Link>
        </div>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="grid gap-2 rounded-xl border border-white/10 p-3">
        <span className="text-xs font-semibold text-white/60">Organization</span>
        <span className="text-xs text-white/45">Loading organization context…</span>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="grid gap-2 rounded-xl border border-red-400/20 p-3">
        <span className="text-xs font-semibold text-white/60">Organization</span>
        <button type="button" onClick={() => void load()} className="text-left text-xs text-red-200">
          Organization context unavailable. Tap to retry.
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-3 rounded-xl border border-white/10 p-3">
      <label className="grid gap-2">
        <span className="text-xs font-semibold text-white/60">Organization</span>
        <select
          value={activeId}
          disabled={saving}
          onChange={event => void changeOrganization(event.target.value)}
          className="min-h-11 rounded-lg border border-white/10 bg-[#0B1524] px-3 text-sm text-[#F5F1E8]"
        >
          <option value="">Personal</option>
          {memberships.map(item => (
            <option key={item.workspace_id} value={item.workspace_id}>
              {item.workspace?.trade_name || item.workspace?.name || item.workspace?.legal_name || item.workspace_id}
            </option>
          ))}
        </select>
      </label>

      {stale && <p className="text-xs leading-5 text-amber-200/80">Your previous organization is no longer available. Harbourview has fallen back to Personal mode.</p>}

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <Link href={`/organization/new?returnTo=${encodedReturnTo}`} className="text-[#d8be76]">Create organization</Link>
        <Link href={`/organization/join?returnTo=${encodedReturnTo}`} className="text-[#d8be76]">Join organization{invitationCount ? ` (${invitationCount})` : ''}</Link>
        <Link href={`/organization?returnTo=${encodedReturnTo}`} className="text-[#d8be76]">Manage</Link>
      </div>
    </div>
  )
}
