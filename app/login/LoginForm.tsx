'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#F5F1E8] placeholder-[#F5F1E8]/25 outline-none transition-colors focus:border-[#C6A55A]/50 focus:bg-white/[0.06]'

export default function LoginForm({
  error,
  next,
  message,
}: {
  error?: string
  next?: string
  message?: string
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    error
      ? { type: 'error', text: error === 'auth_callback_failed' ? 'Authentication failed. Please try again.' : decodeURIComponent(error) }
      : message
      ? { type: 'success', text: decodeURIComponent(message) }
      : null
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    const supabase = createClient()

    if (mode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setFeedback({ type: 'error', text: err.message })
        setLoading(false)
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
        setFeedback({ type: 'error', text: err.message })
        setLoading(false)
      } else {
        setFeedback({ type: 'success', text: 'Check your email to confirm your account.' })
        setLoading(false)
      }
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#07111F] p-8">
      {/* Tab toggle */}
      <div className="mb-6 flex rounded-xl border border-white/10 bg-[#0B1A2F] p-1">
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setFeedback(null) }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-[#C6A55A]/15 text-[#C6A55A]'
                : 'text-[#F5F1E8]/40 hover:text-[#F5F1E8]/70'
            }`}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`mb-5 rounded-xl px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border border-red-500/20 bg-red-900/20 text-red-300'
              : 'border border-emerald-500/20 bg-emerald-900/20 text-emerald-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#F5F1E8]/50">
            Email address
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#F5F1E8]/50">
            Password
          </label>
          <input
            type="password"
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Minimum 8 characters' : '••••••••'}
            minLength={8}
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-[#C6A55A] py-3 text-sm font-semibold text-[#07111F] transition-colors hover:bg-[#d4b468] disabled:opacity-50"
        >
          {loading
            ? mode === 'signin' ? 'Signing in…' : 'Creating account…'
            : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {mode === 'signin' && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={async () => {
              if (!email) { setFeedback({ type: 'error', text: 'Enter your email address first.' }); return }
              setLoading(true)
              const supabase = createClient()
              const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback`,
              })
              setLoading(false)
              setFeedback(err
                ? { type: 'error', text: err.message }
                : { type: 'success', text: 'Password reset email sent.' }
              )
            }}
            className="text-xs text-[#F5F1E8]/30 hover:text-[#C6A55A]/70 transition-colors"
          >
            Forgot password?
          </button>
        </div>
      )}
    </div>
  )
}
