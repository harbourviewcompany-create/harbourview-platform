'use client'

import { createClient } from '@/lib/supabase/client'

export default function PasswordResetButton({
  email,
  disabled,
  onStart,
  onFinish,
}: {
  email: string
  disabled: boolean
  onStart: () => void
  onFinish: (result: { type: 'error' | 'success'; text: string }) => void
}) {
  async function handleReset() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      onFinish({ type: 'error', text: 'Enter a valid email address first.' })
      return
    }

    onStart()
    const recoveryRedirect = new URL('/auth/callback', window.location.origin)
    recoveryRedirect.searchParams.set('next', '/reset-password')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: recoveryRedirect.toString(),
    })

    onFinish(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Password reset email sent. Open the link in that email to choose a new password.' }
    )
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={disabled}
      className="min-h-11 rounded-lg px-3 text-sm font-medium text-[#C6A55A]/80 transition-colors hover:text-[#C6A55A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A55A] disabled:opacity-50"
    >
      {disabled ? 'Sending reset link…' : 'Forgot password? Send reset link'}
    </button>
  )
}
