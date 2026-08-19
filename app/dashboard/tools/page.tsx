import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Operator tools · Command Centre | Harbourview',
  description:
    'Authenticated hub for corridor plans, landed cost, logistics simulator, briefings, genetics, and financing — without editing the main Command Centre shell.',
}

export const dynamic = 'force-dynamic'

const TOOLS = [
  {
    href: '/dashboard/corridor-plan',
    title: 'Corridor execution plan',
    blurb: 'Merged export/import playbooks, documentation checklist, trust metadata.',
  },
  {
    href: '/intelligence/corridor-coverage',
    title: 'Corridor coverage',
    blurb: 'Which tracked pairs have published playbooks on both ends (plan-ready).',
  },
  {
    href: '/intelligence/landed-cost?origin=CA&destination=DE&product=flower-premium&volume=10',
    title: 'Landed cost calculator',
    blurb: 'Orientation USD cost stack by origin, destination, product, and volume.',
  },
  {
    href: '/intelligence/logistics-simulator',
    title: 'Logistics corridor simulator',
    blurb: 'Filter tracked corridors by product, compliance, and risk.',
  },
  {
    href: '/dashboard?page=briefing',
    title: 'My briefings & cadence',
    blurb: 'Personal synthesis and daily/weekly cadence preferences.',
  },
  {
    href: '/marketplace/genetics',
    title: 'Genetics passports',
    blurb: 'Public cultivar catalog and access-request pathways.',
  },
  {
    href: '/marketplace/financing',
    title: 'Trade financing / BNPL',
    blurb: 'Partner embed slot (when configured) and Harbourview review inquiry.',
  },
  {
    href: '/education/cpd',
    title: 'CPD & certificates',
    blurb: 'Professional modules with nominal hours and certificate interest.',
  },
  {
    href: '/intelligence/corridor-plan?origin=CA&destination=DE',
    title: 'Public corridor plan',
    blurb: 'Shareable orientation surface for the same execution plan engine.',
  },
] as const

export default async function DashboardToolsPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login?next=/dashboard/tools')

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-zinc-100">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-500/90">Command Centre</p>
          <h1 className="mt-1 text-2xl font-semibold">Operator tools</h1>
          <p className="mt-2 text-sm text-zinc-400">
            High-leverage surfaces shipped alongside the main shell. Prefer these deep links until
            in-shell nav entries are added without a large CommandCentre edit.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-amber-400">
          ← Dashboard
        </Link>
      </div>

      <ul className="space-y-3">
        {TOOLS.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="block rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 transition hover:border-amber-700/50"
            >
              <span className="font-medium text-zinc-100">{t.title}</span>
              <p className="mt-1 text-sm text-zinc-500">{t.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-xs text-zinc-600">
        Install Harbourview as an app from your browser when the PWA manifest is available (Add to
        Home Screen / Install). Dashboard data always loads from the network. Ops: see{' '}
        <code className="text-zinc-500">docs/control/PHASE2_PRODUCTION_SMOKE.md</code>.
      </p>
    </main>
  )
}
