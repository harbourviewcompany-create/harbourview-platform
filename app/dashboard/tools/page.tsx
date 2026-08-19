import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Operator tools · Command Centre | Harbourview',
  description:
    'Command Centre operator tools hub — corridor plans, landed cost, logistics, briefings, genetics, financing.',
}

export const dynamic = 'force-dynamic'

const TOOLS = [
  {
    href: '/dashboard/corridor-plan?origin=CA&destination=DE',
    title: 'Corridor execution plan',
    blurb:
      'Full Command Centre plan: EU GMP recognition, workstreams, failure modes, checklist, playbook steps.',
    primary: true,
  },
  {
    href: '/intelligence/corridor-coverage',
    title: 'Corridor coverage',
    blurb: 'Which tracked pairs are plan-ready (published playbooks both ends).',
  },
  {
    href: '/intelligence/landed-cost?origin=CA&destination=DE&product=flower-premium&volume=10',
    title: 'Landed cost + sensitivity',
    blurb: 'Cost stack, freight/volume scenarios, explicit model assumptions.',
  },
  {
    href: '/intelligence/logistics-simulator',
    title: 'Logistics corridor simulator',
    blurb: 'Filter corridors → plan → cost → mediated intake.',
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
    blurb: 'Partner embed slot and Harbourview review inquiry.',
  },
  {
    href: '/education/cpd',
    title: 'CPD & certificates',
    blurb: 'Professional modules and certificate interest.',
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
            These are <strong className="font-medium text-zinc-200">Command Centre surfaces</strong>{' '}
            (auth-gated). The public{' '}
            <Link href="/intelligence/corridor-plan" className="text-amber-400 hover:underline">
              /intelligence/corridor-plan
            </Link>{' '}
            page is the shareable orientation twin — same engine, marketing-safe. In-shell nav inside
            the large CommandCentre component is deferred to avoid a high-risk edit; use this hub
            until then.
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
              className={`block rounded-xl border p-4 transition hover:border-amber-700/50 ${
                'primary' in t && t.primary
                  ? 'border-amber-800/60 bg-amber-950/20'
                  : 'border-zinc-800 bg-zinc-950/50'
              }`}
            >
              <span className="font-medium text-zinc-100">{t.title}</span>
              <p className="mt-1 text-sm text-zinc-500">{t.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
