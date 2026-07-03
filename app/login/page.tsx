import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign In | Harbourview',
  description: 'Sign in to your Harbourview account to access market intelligence, the reviewed marketplace, and your dashboard.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; message?: string; mode?: string }>
}) {
  const { error, next, message, mode } = await searchParams
  const initialMode = mode === 'signup' ? 'signup' : 'signin'
  return (
    <main className="min-h-screen bg-[#020814] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C6A55A]/60 mb-3">
            Harbourview
          </p>
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">
            {initialMode === 'signup' ? 'Create your account' : 'Sign in to your account'}
          </h1>
          <p className="mt-2 text-sm text-[#F5F1E8]/50">
            Regulated cannabis market intelligence and reviewed connections.
          </p>
        </div>

        <LoginForm
          error={error}
          next={next}
          message={message}
          initialMode={initialMode}
        />

        <p className="mt-8 text-center text-xs text-[#F5F1E8]/30">
          By signing in you agree to Harbourview&apos;s{' '}
          <a href="/legal/terms" className="text-[#C6A55A]/60 hover:text-[#C6A55A]">
            Terms of Use
          </a>{' '}
          and{' '}
          <a href="/legal/privacy" className="text-[#C6A55A]/60 hover:text-[#C6A55A]">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  )
}
