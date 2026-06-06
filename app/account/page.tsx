import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { countries as ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { getUserTier } from '@/lib/stripe/tier'
import { TIER_DISPLAY } from '@/lib/stripe/server'
import UpgradeButton from '@/components/stripe/UpgradeButton'
import ManageBillingButton from '@/components/stripe/ManageBillingButton'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Account | Harbourview',
  description: 'Manage your Harbourview preferences, saved markets, and subscription.',
}

export const dynamic = 'force-dynamic'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/signals', label: 'Signals' },
  { href: '/education', label: 'Education' },
  { href: '/supplier-directory', label: 'Suppliers' },
  { href: '/intelligence', label: 'Intelligence' },
]

export default async function AccountPage() {
  let countryIso2: string | null = null
  let roleId: string | null = null
  let userEmail: string | null = null
  let isLoggedIn = false

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      isLoggedIn = true
      userEmail = user.email ?? null
      const { data: prefs } = await supabase
        .from('user_dashboard_preferences')
        .select('country_iso2, role_id')
        .eq('user_id', user.id)
        .single()
      countryIso2 = prefs?.country_iso2 ?? null
      roleId = prefs?.role_id ?? null
    }
  } catch {
    // No auth or prefs table not yet migrated
  }

  const userTier = await getUserTier()

  const country = countryIso2
    ? ALL_COUNTRIES.find(c => c.iso2 === countryIso2)
    : null

  const role = roleId
    ? ROLE_PROFILES[roleId as keyof typeof ROLE_PROFILES]
    : null

  return (
    <main className="min-h-screen bg-[#040814] text-[#d8e1e9]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(232,240,248,.115)', background: 'linear-gradient(180deg,rgba(5,10,20,.96),rgba(6,13,24,.9))' }} className="sticky top-0 z-10 flex items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="font-serif text-lg font-semibold tracking-widest" style={{ color: '#f3cf86', letterSpacing: '.155em' }}>
          HARBOURVIEW
        </Link>
        <nav className="flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} className="text-xs uppercase tracking-widest transition-colors hover:text-[#d9af63]" style={{ color: '#9aa8b6', letterSpacing: '.14em' }}>
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">

        {/* Page title */}
        <div className="mb-10">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.2em]" style={{ color: '#d9af63' }}>Account</p>
          <h1 className="font-serif text-3xl font-semibold" style={{ color: '#f3cf86' }}>
            {isLoggedIn ? userEmail : 'Your Harbourview account'}
          </h1>
          {!isLoggedIn && (
            <p className="mt-3 text-sm" style={{ color: '#9aa8b6' }}>
              No active session. <Link href="/admin/login" className="underline" style={{ color: '#d9af63' }}>Sign in</Link> to manage your preferences and subscription.
            </p>
          )}
        </div>

        {/* Preferences */}
        <section className="mb-8 rounded-2xl p-6" style={{ background: '#0b1929', border: '1px solid rgba(232,240,248,.115)' }}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold" style={{ color: '#f7efe1' }}>Dashboard preferences</h2>
              <p className="mt-1 text-xs" style={{ color: '#9aa8b6' }}>These are set automatically when you select a country and role from the dashboard.</p>
            </div>
            <Link href="/dashboard" className="rounded-xl px-4 py-2 text-xs font-semibold transition-colors" style={{ border: '1px solid rgba(217,175,99,.4)', color: '#d9af63', background: 'rgba(217,175,99,.09)' }}>
              Go to dashboard →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,.022)', border: '1px solid rgba(232,240,248,.115)' }}>
              <p className="mb-1 text-[10px] uppercase tracking-[.18em]" style={{ color: '#627282' }}>Active market</p>
              <p className="font-semibold" style={{ color: '#f7efe1' }}>
                {country ? country.displayName : <span style={{ color: '#627282' }}>Not set</span>}
              </p>
              {countryIso2 && (
                <p className="mt-1 text-xs" style={{ color: '#9aa8b6' }}>{countryIso2}</p>
              )}
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,.022)', border: '1px solid rgba(232,240,248,.115)' }}>
              <p className="mb-1 text-[10px] uppercase tracking-[.18em]" style={{ color: '#627282' }}>Active role</p>
              <p className="font-semibold" style={{ color: '#f7efe1' }}>
                {role ? role.label : <span style={{ color: '#627282' }}>Not set</span>}
              </p>
              {roleId && (
                <p className="mt-1 text-xs" style={{ color: '#9aa8b6' }}>{roleId.replace(/_/g, ' ')}</p>
              )}
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: '#f7efe1' }}>Subscription</h2>
            {userTier !== 'free' && <ManageBillingButton />}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Free */}
            <div className="rounded-2xl p-5" style={{ background: '#0b1929', border: userTier === 'free' ? '1px solid rgba(217,175,99,.5)' : '1px solid rgba(232,240,248,.115)' }}>
              {userTier === 'free' && (
                <span className="mb-3 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: 'rgba(116,210,142,.15)', color: '#74d28e' }}>
                  Current
                </span>
              )}
              <h3 className="mb-3 font-semibold" style={{ color: '#f7efe1' }}>Free</h3>
              <ul className="mb-4 space-y-1.5">
                {['Weekly signal summaries', 'Marketplace browse', 'Country access overview', 'Education hub access'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: '#9aa8b6' }}>
                    <span style={{ color: '#74d28e', marginTop: 1 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Intel Plus */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(217,175,99,.06)', border: userTier === 'intel' ? '2px solid rgba(217,175,99,.6)' : '1px solid rgba(217,175,99,.28)' }}>
              {userTier === 'intel' && (
                <span className="mb-3 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: 'rgba(116,210,142,.15)', color: '#74d28e' }}>
                  Current plan
                </span>
              )}
              <h3 className="mb-1 font-semibold" style={{ color: '#f7efe1' }}>Intel Plus</h3>
              <p className="mb-3 text-xs" style={{ color: '#d9af63' }}>USD $149 / mo</p>
              <ul className="mb-4 space-y-1.5">
                {TIER_DISPLAY.intel.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: '#9aa8b6' }}>
                    <span style={{ color: '#d9af63', marginTop: 1 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              {userTier === 'free' && (
                <UpgradeButton priceKey="intel_monthly" label="Upgrade to Intel Plus" className="mt-auto w-full rounded-xl px-4 py-2 text-center text-xs font-semibold transition-all" style={{ background: 'linear-gradient(135deg,#f3cf86,#d9af63)', color: '#07111d' }} />
              )}
            </div>

            {/* Operator */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(217,175,99,.06)', border: userTier === 'operator' ? '2px solid rgba(217,175,99,.6)' : '1px solid rgba(217,175,99,.28)' }}>
              {userTier === 'operator' && (
                <span className="mb-3 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: 'rgba(116,210,142,.15)', color: '#74d28e' }}>
                  Current plan
                </span>
              )}
              <h3 className="mb-1 font-semibold" style={{ color: '#f7efe1' }}>Operator</h3>
              <p className="mb-3 text-xs" style={{ color: '#d9af63' }}>USD $490 / mo</p>
              <ul className="mb-4 space-y-1.5">
                {TIER_DISPLAY.operator.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: '#9aa8b6' }}>
                    <span style={{ color: '#d9af63', marginTop: 1 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              {userTier !== 'operator' && (
                <UpgradeButton priceKey="operator_monthly" label="Upgrade to Operator" className="mt-auto w-full rounded-xl px-4 py-2 text-center text-xs font-semibold transition-all" style={{ background: 'linear-gradient(135deg,#f3cf86,#d9af63)', color: '#07111d' }} />
              )}
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section className="rounded-2xl p-6" style={{ background: '#0b1929', border: '1px solid rgba(232,240,248,.115)' }}>
          <h2 className="mb-4 font-semibold" style={{ color: '#f7efe1' }}>Quick navigation</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { href: '/marketplace/sell', label: 'Post a listing' },
              { href: '/marketplace/wanted', label: 'Post wanted demand' },
              { href: '/signals', label: 'View signals' },
              { href: '/intelligence', label: 'Intelligence hub' },
              { href: '/education', label: 'Education' },
              { href: '/contact', label: 'Contact Harbourview' },
            ].map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-4 py-3 text-xs font-medium transition-colors"
                style={{ border: '1px solid rgba(232,240,248,.115)', color: '#d8e1e9', background: 'rgba(255,255,255,.022)' }}
              >
                {l.label} →
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
