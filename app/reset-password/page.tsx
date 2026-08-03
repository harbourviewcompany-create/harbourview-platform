import type { Metadata } from 'next'
import ResetPasswordForm from './ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Reset Password | Harbourview',
  description: 'Choose a new password for your Harbourview account.',
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#020814] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C6A55A]/60">
            Harbourview
          </p>
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">Choose a new password</h1>
          <p className="mt-2 text-sm text-[#F5F1E8]/50">
            Set a new password to restore access to your account.
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </main>
  )
}
