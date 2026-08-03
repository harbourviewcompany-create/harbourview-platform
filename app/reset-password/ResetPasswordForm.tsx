'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#F5F1E8] placeholder-[#F5F1E8]/25 outline-none transition-colors focus:border-[#C6A55A]/50 focus:bg-white/[0.06]'

export default function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function verifyRecoverySession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!active) return
      setHasRecoverySession(Boolean(user))
      setCheckingSession(false)
    }

    void verifyRecoverySession()
    return () => { active = false }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFeedback(null)

    if (password.length < 8) {
      setFeedback('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmation) {
      setFeedback('The passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setFeedback(error.message)
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  if (checkingSession) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#07111F] p-8 text-center text-sm text-[#F5F1E8]/60">
        Verifying reset link…
      </div>
    )
  }

  if (!hasRecoverySession) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-[#07111F] p-8 text-center">
        <p className="text-sm leading-6 text-red-300" role="alert">
          This reset link is invalid or has expired. Request a new reset email from the sign-in page.
        </p>
        <a
          href="/login"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#C6A55A] px-5 text-sm font-semibold text-[#07111F] transition-colors hover:bg-[#d4b468]"
        >
          Return to sign in
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-[#07111F] p-8">
      {feedback && (
        <div className="rounded-xl border border-red-500/20 bg-red-900/20 px-4 py-3 text-sm text-red-300" role="alert">
          {feedback}
        </div>
      )}

      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-xs font-medium text-[#F5F1E8]/50">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 characters"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-medium text-[#F5F1E8]/50">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="Repeat your new password"
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 min-h-12 w-full rounded-xl bg-[#C6A55A] py-3 text-sm font-semibold text-[#07111F] transition-colors hover:bg-[#d4b468] disabled:opacity-50"
      >
        {loading ? 'Updating password…' : 'Update password'}
      </button>
    </form>
  )
}
