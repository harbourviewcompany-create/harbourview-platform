'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Workspace = {
  id: string
  name: string | null
  legal_name: string | null
  trade_name: string | null
  verification_status: string
  status: string
}

type Membership = {
  workspace_id: string
  role: string
  status: string
  workspace: Workspace | null
}

type MemberRow = {
  user_id: string
  role: string
  status: string
  email: string | null
  joined_at: string | null
}

type Invitation = {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
}

export default function OrganizationManager() {
  const searchParams = useSearchParams()
  const createdId = searchParams.get('created') ?? ''
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeId, setActiveId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [members, setMembers] = useState<MemberRow[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [inviteLink, setInviteLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedMembership = useMemo(
    () => memberships.find(item => item.workspace_id === selectedId) ?? null,
    [memberships, selectedId],
  )
  const canManage = selectedMembership?.role === 'admin' || selectedMembership?.role === 'operator'

  async function loadMemberships() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/org/me', { cache: 'no-store', credentials: 'same-origin' })
      if (response.status === 401) {
        window.location.assign(`/login?next=${encodeURIComponent('/organization')}`)
        return
      }
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error ?? 'Organization lookup failed')
      const activeMemberships = (payload.data?.memberships ?? []).filter(
        (item: Membership) => item.status === 'active' && item.workspace?.status === 'active',
      )
      setMemberships(activeMemberships)
      const preferred =
        createdId && activeMemberships.some((m: Membership) => m.workspace_id === createdId)
          ? createdId
          : payload.data?.active_workspace_id || activeMemberships[0]?.workspace_id || ''
      setActiveId(payload.data?.active_workspace_id ?? preferred)
      setSelectedId(preferred)

      if (createdId) {
        const row = activeMemberships.find((m: Membership) => m.workspace_id === createdId)
        if (row) {
          const label = row.workspace?.trade_name || row.workspace?.name || row.workspace?.legal_name || 'Organization'
          setSuccess(`${label} is on your profile. You are admin. Operating context is set when available.`)
        } else {
          setSuccess('Organization create returned, but membership is not visible yet. Pull to refresh or reopen Organizations.')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Organization lookup failed')
    } finally {
      setLoading(false)
    }
  }

  async function loadTeam(workspaceId: string) {
    setMembers([])
    setInvitations([])
    setInviteLink('')
    if (!workspaceId) return
    const membership = memberships.find(item => item.workspace_id === workspaceId)
    if (!membership || !['admin', 'operator'].includes(membership.role)) return
    try {
      const [memberResponse, inviteResponse] = await Promise.all([
        fetch(`/api/org/members?workspace_id=${encodeURIComponent(workspaceId)}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        }),
        fetch(`/api/org/invitations?workspace_id=${encodeURIComponent(workspaceId)}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        }),
      ])
      if (memberResponse.ok) setMembers((await memberResponse.json()).data ?? [])
      if (inviteResponse.ok) setInvitations((await inviteResponse.json()).data ?? [])
    } catch {
      setError('Team data could not be loaded.')
    }
  }

  useEffect(() => {
    void loadMemberships()
  }, [createdId])

  useEffect(() => {
    void loadTeam(selectedId)
  }, [selectedId, memberships])

  async function setOperatingOrganization(workspaceId: string) {
    const response = await fetch('/api/dashboard/preferences', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ active_workspace_id: workspaceId || null }),
    })
    if (!response.ok) {
      setError('Operating organization could not be changed.')
      return
    }
    setActiveId(workspaceId)
  }

  async function invite(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setInviteLink('')
    const response = await fetch('/api/org/invitations', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workspace_id: selectedId, email, role }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(payload?.error ?? 'Invitation could not be created.')
      return
    }
    const path = payload.data?.accept_path as string | undefined
    if (path) setInviteLink(`${window.location.origin}${path}`)
    setEmail('')
    await loadTeam(selectedId)
  }

  if (loading) {
    return <main className="min-h-screen bg-[#020814] px-5 py-12 text-white/50">Loading organizations…</main>
  }

  return (
    <main className="min-h-screen bg-[#020814] px-5 py-10 text-[#F5F1E8]">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#C6A55A]">Harbourview</p>
            <h1 className="mt-2 text-3xl font-semibold">Organizations</h1>
            <p className="mt-1 text-sm text-white/45">Your organization memberships and operating profile.</p>
          </div>
          <Link href="/dashboard" className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C6A55A]">
            Command →
          </Link>
        </div>

        {success && (
          <p role="status" className="mt-6 rounded-xl border border-emerald-500/25 bg-emerald-900/15 px-4 py-3 text-sm text-emerald-100">
            {success}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-500/20 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#07111F] p-6">
          <h2 className="text-lg font-semibold">Operating context</h2>
          <p className="mt-1 text-sm text-white/45">
            Personal is valid. Choosing an organization sets your active operating profile for Command and licences.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <select
              value={activeId}
              onChange={event => void setOperatingOrganization(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0B1A2F] px-4 py-3"
            >
              <option value="">Personal</option>
              {memberships.map(item => (
                <option key={item.workspace_id} value={item.workspace_id}>
                  {item.workspace?.trade_name || item.workspace?.name || item.workspace?.legal_name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Link
                href="/organization/new?returnTo=%2Forganization"
                className="rounded-xl border border-[#C6A55A]/30 px-4 py-3 text-xs font-semibold text-[#C6A55A]"
              >
                Create
              </Link>
              <Link
                href="/organization/join"
                className="rounded-xl border border-[#C6A55A]/30 px-4 py-3 text-xs font-semibold text-[#C6A55A]"
              >
                Join
              </Link>
            </div>
          </div>
          {memberships.length === 0 && (
            <p className="mt-4 text-sm text-white/50">
              No organizations on this profile yet. Create one to attach an organization passport and operate as a
              company.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#07111F] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Organization membership</h2>
              <p className="mt-1 text-sm text-white/45">
                Select an organization on your profile to review role and manage invitations.
              </p>
            </div>
            <select
              value={selectedId}
              onChange={event => setSelectedId(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0B1A2F] px-3 py-2 text-sm"
            >
              <option value="">Select organization</option>
              {memberships.map(item => (
                <option key={item.workspace_id} value={item.workspace_id}>
                  {item.workspace?.trade_name || item.workspace?.name || item.workspace?.legal_name}
                </option>
              ))}
            </select>
          </div>

          {selectedMembership && (
            <div className="mt-5 rounded-xl border border-white/10 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-white/45">Your role</span>
                <strong>{selectedMembership.role}</strong>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-white/45">Verification</span>
                <span>{selectedMembership.workspace?.verification_status ?? 'unverified'}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-white/45">Legal name</span>
                <span>{selectedMembership.workspace?.legal_name ?? '—'}</span>
              </div>
            </div>
          )}

          {canManage && (
            <>
              <div className="mt-6">
                <h3 className="text-sm font-semibold">Team</h3>
                <div className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10">
                  {members.map(member => (
                    <div key={member.user_id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                      <div>
                        <p>{member.email ?? member.user_id}</p>
                        <p className="text-xs text-white/35">{member.status}</p>
                      </div>
                      <span className="text-xs uppercase tracking-wide text-[#C6A55A]">{member.role}</span>
                    </div>
                  ))}
                  {members.length === 0 && <p className="px-4 py-3 text-sm text-white/40">No team rows loaded.</p>}
                </div>
              </div>

              <form
                onSubmit={invite}
                className="mt-6 grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-[1fr_150px_auto]"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="colleague@example.com"
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                />
                <select
                  value={role}
                  onChange={event => setRole(event.target.value)}
                  className="rounded-lg border border-white/10 bg-[#0B1A2F] px-3 py-2 text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
                <button className="rounded-lg bg-[#C6A55A] px-4 py-2 text-sm font-semibold text-[#07111F]">Invite</button>
              </form>

              {inviteLink && (
                <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4">
                  <p className="text-xs font-semibold text-emerald-300">
                    Invitation created. Share this one-time acceptance link with the invited email address.
                  </p>
                  <input
                    readOnly
                    value={inviteLink}
                    onFocus={event => event.currentTarget.select()}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs"
                  />
                </div>
              )}

              {invitations.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold">Invitations</h3>
                  <div className="mt-2 divide-y divide-white/10 rounded-xl border border-white/10">
                    {invitations.map(invite => (
                      <div key={invite.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                        <div>
                          <p>{invite.email}</p>
                          <p className="text-xs text-white/35">
                            Expires {new Date(invite.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs text-white/50">
                          {invite.role} · {invite.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}
