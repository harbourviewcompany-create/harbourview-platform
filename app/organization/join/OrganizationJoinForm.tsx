'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

function tokenLooksValid(value: string) {
  return /^[0-9a-f]{64}$/i.test(value.trim())
}

export default function OrganizationJoinForm() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState('')

  const currentPath = useMemo(() => {
    const query = searchParams.toString()
    return `${pathname}${query ? `?${query}` : ''}`
  }, [pathname, searchParams])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!tokenLooksValid(token)) {
      setError('Enter a valid Harbourview invitation token.')
      return
    }
    setStatus('loading')
    setError('')
    try {
      const response = await fetch('/api/org/invitations/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), action: 'accept' }),
      })
      const payload = await response.json().catch(() => ({}))
      if (response.status === 401) {
        router.replace(`/login?mode=signup&next=${encodeURIComponent(currentPath)}`)
        return
      }
      if (!response.ok) {
        const labels: Record<string, string> = {
          INVITATION_EMAIL_MISMATCH: 'This invitation was issued to a different email address.',
          INVITATION_EXPIRED: 'This invitation has expired. Ask the organization to issue another.',
          INVITATION_NOT_FOUND: 'This invitation could not be found.',
          INVITATION_DECLINED: 'This invitation has already been declined.',
          INVITATION_REVOKED: 'This invitation has been revoked.',
        }
        setError(labels[payload?.error] ?? payload?.error ?? 'The invitation could not be accepted.')
        setStatus('idle')
        return
      }
      setStatus('success')
      window.setTimeout(() => {
        router.replace('/dashboard')
        router.refresh()
      }, 500)
    } catch {
      setError('The invitation could not be accepted. Check your connection and retry.')
      setStatus('idle')
    }
  }

  return (
    <main className="min-h-screen bg-[#020814] px-5 py-12 text-[#F5F1E8]">
      <div className="mx-auto max-w-lg">
        <Link href="/dashboard" className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C6A55A]">← Command</Link>
        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#C6A55A]">Harbourview organization</p>
        <h1 className="mt-2 text-3xl font-semibold">Join organization</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">Invitation access is bound to the email address it was issued to. If you are not signed in, Harbourview will return you here after account creation or sign-in.</p>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-[#07111F] p-6">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/60">Invitation token</span>
            <input value={token} onChange={event => setToken(event.target.value)} autoComplete="off" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-xs outline-none focus:border-[#C6A55A]/50" placeholder="Paste invitation token" />
          </label>

          {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</p>}
          {status === 'success' && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-300">Invitation accepted. Opening Command…</p>}

          <button disabled={status === 'loading' || !tokenLooksValid(token)} className="w-full rounded-xl bg-[#C6A55A] px-5 py-3 text-sm font-semibold text-[#07111F] disabled:opacity-50">
            {status === 'loading' ? 'Accepting invitation…' : 'Join organization'}
          </button>
        </form>
      </div>
    </main>
  )
}
