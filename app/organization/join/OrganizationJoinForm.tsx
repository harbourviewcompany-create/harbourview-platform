'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

function tokenLooksValid(value: string) {
  return /^[0-9a-f]{64}$/i.test(value.trim())
}

function safeInternalPath(value: string | null, fallback = '/dashboard') {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback
}

type Preview = {
  workspace: { id: string; name: string; slug: string; verification_status: string; status: string }
  role: string
  invited_at: string
  expires_at: string
}

const errorLabels: Record<string, string> = {
  INVITATION_EMAIL_MISMATCH: 'This invitation was issued to a different email address.',
  INVITATION_EXPIRED: 'This invitation has expired. Ask the organization to issue another.',
  INVITATION_NOT_FOUND: 'This invitation could not be found.',
  INVITATION_DECLINED: 'This invitation has already been declined.',
  INVITATION_REVOKED: 'This invitation has been revoked.',
  INVITATION_ACCEPTED: 'This invitation has already been accepted.',
  INVITATION_ALREADY_USED: 'This invitation has already been used.',
}

export default function OrganizationJoinForm() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'checking' | 'ready' | 'error'>('idle')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState('')

  const returnTo = useMemo(() => safeInternalPath(searchParams.get('returnTo')), [searchParams])
  const currentPath = useMemo(() => {
    const query = searchParams.toString()
    return `${pathname}${query ? `?${query}` : ''}`
  }, [pathname, searchParams])

  useEffect(() => {
    if (!tokenLooksValid(token)) {
      setPreview(null)
      setPreviewStatus('idle')
      return
    }

    let cancelled = false
    setPreviewStatus('checking')
    setError('')

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/org/invitations/preview?token=${encodeURIComponent(token.trim())}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        })
        const payload = await response.json().catch(() => ({}))
        if (cancelled) return
        if (response.status === 401) {
          router.replace(`/login?mode=signup&next=${encodeURIComponent(currentPath)}`)
          return
        }
        if (!response.ok) {
          setPreview(null)
          setPreviewStatus('error')
          setError(errorLabels[payload?.error] ?? 'This invitation could not be verified.')
          return
        }
        setPreview(payload.data as Preview)
        setPreviewStatus('ready')
      } catch {
        if (!cancelled) {
          setPreview(null)
          setPreviewStatus('error')
          setError('Could not verify the invitation. Check your connection and retry.')
        }
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [token, currentPath, router])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!preview || !tokenLooksValid(token)) {
      setError('Verify a valid invitation before joining.')
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
        setError(errorLabels[payload?.error] ?? 'The invitation could not be accepted.')
        setStatus('idle')
        return
      }

      setStatus('success')
      window.setTimeout(() => {
        window.location.replace(returnTo)
      }, 350)
    } catch {
      setError('The invitation could not be accepted. Check your connection and retry.')
      setStatus('idle')
    }
  }

  function resetInvitation() {
    setToken('')
    setPreview(null)
    setPreviewStatus('idle')
    setStatus('idle')
    setError('')
  }

  const roleLabel = preview?.role ? preview.role.replace(/_/g, ' ') : ''

  return (
    <main className="min-h-screen bg-[#020814] px-5 py-8 text-[#F5F1E8] sm:py-12">
      <div className="mx-auto max-w-lg">
        <Link href={returnTo} className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C6A55A]">← Command</Link>

        <header className="mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#C6A55A]">Harbourview organization</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Join organization</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Verify your invitation, review the organization and role, then accept. The invitation remains bound to the email address it was issued to.
          </p>
        </header>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-[24px] border border-white/10 bg-[#07111F] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:p-7">
          <section className="grid gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C6A55A]/78">Invitation</div>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/65">Invitation token</span>
              <input
                value={token}
                onChange={event => setToken(event.target.value.replace(/\s/g, ''))}
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 font-mono text-xs outline-none transition focus:border-[#C6A55A]/50"
                placeholder="Paste invitation token"
              />
            </label>
            <p className="text-[10px] leading-5 text-white/32">Harbourview verifies the token before showing organization details.</p>
          </section>

          {previewStatus === 'checking' ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 text-xs text-white/45">
              <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-[#C6A55A]" />
              Checking invitation…
            </div>
          ) : null}

          {previewStatus === 'ready' && preview ? (
            <section className="grid gap-4 rounded-2xl border border-[#C6A55A]/22 bg-[#C6A55A]/[0.045] p-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#C6A55A]/75">You’re invited</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{preview.workspace.name}</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-white/35">Role</div>
                  <div className="mt-1 text-sm font-semibold capitalize text-white/80">{roleLabel}</div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-white/35">Invitation</div>
                  <div className="mt-1 text-sm font-semibold text-emerald-300/85">Verified</div>
                </div>
              </div>
              <p className="text-xs leading-5 text-white/42">
                Accepting will add you to this organization and make it your active operating context.
              </p>
            </section>
          ) : null}

          {error ? <p role="alert" className="rounded-xl border border-red-500/20 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</p> : null}
          {status === 'success' ? <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-300">Organization joined. Opening Command Centre…</p> : null}

          <button
            type="submit"
            disabled={status === 'loading' || previewStatus !== 'ready' || !preview}
            className="w-full rounded-full bg-[#C6A55A] px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#07111F] transition hover:brightness-105 disabled:opacity-45"
          >
            {status === 'loading' ? 'Joining organization…' : 'Accept invitation'}
          </button>

          <button type="button" onClick={resetInvitation} className="w-full py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38 transition hover:text-white/65">
            Use another invitation
          </button>
        </form>
      </div>
    </main>
  )
}
