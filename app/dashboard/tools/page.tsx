import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import {
  buildCorridorPlanToolHref,
  buildLandedCostToolHref,
} from '@/components/dashboard/mobile-command/contracts'

export const metadata: Metadata = {
  title: 'Operator tools · Command Centre | Harbourview',
  description: 'Command Centre tools — corridor plan, landed cost, logistics, briefings.',
}

export const dynamic = 'force-dynamic'

export default async function DashboardToolsPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login?next=/dashboard/tools')

  const TOOLS = [
    {
      href: buildCorridorPlanToolHref({ origin: 'CA', destination: 'DE' }),
      title: 'Corridor execution plan',
      blurb: 'In-shell route with permanent Command Centre tabs.',
      primary: true,
    },
    {
      href: buildLandedCostToolHref({ origin: 'CA', destination: 'DE' }),
      title: 'Landed cost + sensitivity',
      blurb: 'In-shell route — orientation USD ranges, not a commercial quote.',
      primary: true,
    },
    {
      href: '/dashboard?page=logistics&section=supply',
      title: 'Logistics module',
      blurb: 'Native logistics section in the main Command Centre shell.',
    },
    {
      href: '/dashboard?page=trade-calc&section=financing',
      title: 'Trade calculator module',
      blurb: 'Native trade-calc section in the main shell.',
    },
    {
      href: '/dashboard?page=briefing',
      title: 'Briefing room',
      blurb: 'Personal synthesis and cadence.',
    },
    {
      href: '/dashboard?page=genetics',
      title: 'Genetics',
      blurb: 'In-shell genetics module.',
    },
  ] as const

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-zinc-100">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-500/90">Harbourview Command Centre</p>
          <h1 className="mt-1 text-2xl font-semibold">Operator tools</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Primary tools open as <strong className="text-zinc-200">/dashboard/tools/*</strong> routes
            with permanent bottom navigation.
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
              <p className="mt-2 font-mono text-[10px] text-zinc-600 break-all">{t.href}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
