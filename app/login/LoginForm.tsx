'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PasswordResetButton from './PasswordResetButton'

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#F5F1E8] placeholder-[#F5F1E8]/25 outline-none transition-colors focus:border-[#C6A55A]/50 focus:bg-white/[0.06]'

const SIGNUP_BENEFITS = [
  'Weekly signal summaries',
  'Marketplace browse',
  'Country access overview',
  'Education hub access',
]

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'An account already exists for this email. Try signing in instead.'
  }
  if (lower.includes('invalid login credentials')) {
    return 'That email or password was not recognized.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email before signing in — check your inbox for the confirmation link.'
  }
  if (lower.includes('password should be at least') || lower.includes('at least 8')) {
    return 'Password must be at least 8 characters.'
  }
  if (lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  return message
}

export default function LoginForm({
  error,
  next,
  message,
  initialMode = 'signin',
}: {
  error?: string
  next?: string
  message?: string
  initialMode?: 'signin' | 'signup'
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupComplete, setSignupComplete] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    error
      ? { type: 'error', text: error === 'auth_callback_failed' ? 'Authentication failed. Please try again.' : decodeURIComponent(error) }
      : message
      ? { type: 'success', text: decodeURIComponent(message) }
      : null
  )

  const passwordLongEnough = password.length >= 8
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email])
  const canSubmit = emailValid && (mode === 'signin' ? password.length > 0 : passwordLongEnough)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      const supabase = createClient()

      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) {
          setFeedback({ type: 'error', text: friendlyAuthError(err.message) })
        } else {
          router.push(next ?? '/dashboard')
          router.refresh()
        }
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next ?? '/dashboard'}` },
        })
        if (err) {
          setFeedback({ type: 'error', text: friendlyAuthError(err.message) })
        } else {
          setSignupComplete(true)
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleResendConfirmation() {
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next ?? '/dashboard'}` },
    })
    setLoading(false)
    setFeedback(err
      ? { type: 'error', text: friendlyAuthError(err.message) }
      : { type: 'success', text: 'Confirmation email resent.' }
    )
  }

  if (signupComplete) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#07111F] p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#C6A55A]/30 bg-[#C6A55A]/10 text-xl text-[#C6A55A]">✓</div>
        <h2 className="text-lg font-semibold text-[#F5F1E8]">Check your inbox</h2>
        <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/50">
          We sent a confirmation link to <span className="text-[#F5F1E8]/80">{email}</span>. Follow it to activate your account and sign in.
        </p>

        {feedback && (
          <div className={`mt-5 rounded-xl px-4 py-3 text-left text-sm ${feedback.type === 'error' ? 'border border-red-500/20 bg-red-900/20 text-red-300' : 'border border-emerald-500/20 bg-emerald-900/20 text-emerald-300'}`}>
            {feedback.text}
          </div>
        )}

        <button
          type="button"
          onClick={handleResendConfirmation}
          disabled={loading}
          className="mt-5 text-xs font-medium text-[#C6A55A]/70 transition-colors hover:text-[#C6A55A] disabled:opacity-50"
        >
          {loading ? 'Resending…' : "Didn't get it? Resend confirmation email"}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#07111F] p-8">
      <div className="mb-6 flex rounded-xl border border-white/10 bg-[#0B1A2F] p-1">
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setFeedback(null) }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${mode === m ? 'bg-[#C6A55A]/15 text-[#C6A55A]' : 'text-[#F5F1E8]/40 hover:text-[#F5F1E8]/70'}`}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {mode === 'signup' && (
        <ul className="mb-5 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {SIGNUP_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-1.5 text-xs text-[#F5F1E8]/45">
              <span className="mt-0.5 text-[#C6A55A]/70">✓</span>{benefit}
            </li>
          ))}
        </ul>
      )}

      {feedback && (
        <div
          id="auth-feedback"
          className={`mb-5 rounded-xl px-4 py-3 text-sm ${feedback.type === 'error' ? 'border border-red-500/20 bg-red-900/20 text-red-300' : 'border border-emerald-500/20 bg-emerald-900/20 text-emerald-300'}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-[#F5F1E8]/50">Email address</label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-describedby={feedback ? 'auth-feedback' : undefined}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-[#F5F1E8]/50">Password</label>
          <input
            id="auth-password"
            type="password"
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Minimum 8 characters' : '••••••••'}
            minLength={8}
            aria-describedby={feedback ? 'auth-feedback' : undefined}
            className={inputCls}
          />
          {mode === 'signup' && password.length > 0 && (
            <p className={`mt-1.5 text-xs ${passwordLongEnough ? 'text-emerald-400/70' : 'text-[#F5F1E8]/35'}`}>
              {passwordLongEnough ? '✓ Meets minimum length' : `${8 - password.length} more character${8 - password.length === 1 ? '' : 's'} needed`}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="mt-2 w-full rounded-xl bg-[#C6A55A] py-3 text-sm font-semibold text-[#07111F] transition-colors hover:bg-[#d4b468] disabled:opacity-50"
        >
          {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in' : 'Create account')}
        </button>
      </form>

      {mode === 'signin' && (
        <div className="mt-4 text-center">
          <PasswordResetButton
            email={email}
            disabled={loading}
            onStart={() => { setLoading(true); setFeedback(null) }}
            onFinish={(result) => { setLoading(false); setFeedback(result.type === 'error' ? { type: 'error', text: friendlyAuthError(result.text) } : result) }}
          />
        </div>
      )}
    </div>
  )
}
