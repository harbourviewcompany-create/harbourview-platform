import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TIER_DISPLAY } from '@/lib/stripe/tierDisplay'
import UpgradeButton from '@/components/stripe/UpgradeButton'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing | Harbourview',
  description: 'Harbourview subscription tiers — Free, Intel Plus, and Operator.',
}

export const dynamic = 'force-dynamic'

/**
 * Superseded 2026-08-03: for signed-in users, subscription/billing, dashboard
 * preferences, and sign-out now render natively in Command Centre's Settings
 * section (CommandCentre.tsx SettingsPage / MobileCommandCentre.tsx
 * SettingsMobile) — no standalone authenticated account workspace.
 *
 * This route stays live ONLY as the public, logged-out pricing view — the
 * original /account page served that dual role (no auth gate previously
 * existed here) and there is no separate /pricing route to fall back to.
 * Removing this entirely would silently kill the only place an anonymous
 * visitor can see plan pricing before signing up.
 */
export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard?page=settings')
  }

  return (
    <main className="min-h-screen bg-[#02070D] text-[#F7F1E6]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }} className="sticky top-0 z-10 flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-lg font-semibold tracking-widest" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#D9A441', letterSpacing: '.155em' }}>
          HARBOURVIEW
        </Link>
        <Link href="/login" className="rounded-xl px-4 py-2 text-xs font-semibold" style={{ border: '1px solid rgba(217,164,65,.4)', color: '#D9A441', background: 'rgba(217,164,65,.09)' }}>
          Sign in →
        </Link>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.2em]" style={{ color: '#D9A441' }}>Pricing</p>
          <h1 className="font-serif text-3xl font-semibold" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#F2C46D' }}>
            Choose your Harbourview plan
          </h1>
          <p className="mt-3 text-sm" style={{ color: '#B8C0C8' }}>
            <Link href="/login" className="underline" style={{ color: '#D9A441' }}>Sign in</Link> or{' '}
            <Link href="/login?mode=signup" className="underline" style={{ color: '#D9A441' }}>create an account</Link> to subscribe and manage billing.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl p-5" style={{ background: '#08131F', border: '1px solid rgba(255,255,255,.08)' }}>
            <h3 className="mb-3 font-semibold" style={{ color: '#F7F1E6' }}>Free</h3>
            <ul className="mb-4 space-y-1.5">
              {['Weekly signal summaries', 'Marketplace browse', 'Country access overview', 'Education hub access'].map(f => (
                <li key={f} className="flex items-start gap-2 text-xs" style={{ color: '#B8C0C8' }}>
                  <span style={{ color: '#6FCF7D', marginTop: 1 }}>✓</span>{f}
                </li>
              ))}
            </ul>
          </div>

          {(['intel', 'operator'] as const).map(tierKey => (
            <div key={tierKey} className="rounded-2xl p-5" style={{ background: 'rgba(217,164,65,.06)', border: '1px solid rgba(217,164,65,.28)' }}>
              <h3 className="mb-1 font-semibold" style={{ color: '#F7F1E6' }}>{TIER_DISPLAY[tierKey].name}</h3>
              <p className="mb-3 text-xs" style={{ color: '#D9A441' }}>{TIER_DISPLAY[tierKey].monthly.label}</p>
              <ul className="mb-4 space-y-1.5">
                {TIER_DISPLAY[tierKey].features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: '#B8C0C8' }}>
                    <span style={{ color: '#D9A441', marginTop: 1 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <UpgradeButton
                priceKey={TIER_DISPLAY[tierKey].monthly.key}
                label={`Sign up for ${TIER_DISPLAY[tierKey].name}`}
                className="mt-auto w-full rounded-xl px-4 py-2 text-center text-xs font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg,#D9A441,#F2C46D)', color: '#06101A' }}
              />
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
