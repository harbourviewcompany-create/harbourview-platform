import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listOperatorCommands } from '@/lib/proprietary-intelligence/admin'

export const dynamic = 'force-dynamic'

const urgencyColors: Record<string, string> = {
  today: 'bg-red-500/15 text-red-400 border border-red-500/25',
  this_week: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  when_possible: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
}

export default async function CommandCenterPage() {
  await requireAdminAuth()
  const result = await listOperatorCommands()
  const commands = result.ok ? (result.data ?? []) : []
  const isFixture = result.ok && result.source === 'fixture'

  const today = commands.filter((c) => c.urgency === 'today')
  const thisWeek = commands.filter((c) => c.urgency === 'this_week')
  const whenPossible = commands.filter((c) => c.urgency === 'when_possible')
  const ordered = [...today, ...thisWeek, ...whenPossible]

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Proprietary Intelligence</p>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-[#F5F1E8]">Command Center</h1>
          <Link href="/admin/proprietary-intelligence" className="text-xs text-[#C6A55A] hover:underline">
            ← Overview
          </Link>
        </div>
        <p className="text-sm text-[#F5F1E8]/60">Operator command items — highest-value actions and priority alerts.</p>
      </div>

      <FixtureBanner isFixture={isFixture} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ordered.map((cmd) => (
          <div key={cmd.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{cmd.command_type.replace(/_/g, ' ')}</p>
              <p className="mt-1 font-semibold text-[#F5F1E8]">{cmd.title}</p>
            </div>
            <p className="text-sm text-[#F5F1E8]/65">{cmd.description}</p>
            <div className="flex gap-2 text-xs text-[#F5F1E8]/50">
              <span>{cmd.market}</span>
              <span>·</span>
              <span>{cmd.category.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-xs text-[#F5F1E8]/40">Entity: <span className="text-[#F5F1E8]/70">{cmd.entity_label}</span></p>
            <div className="flex items-center justify-between pt-1">
              <span className="inline-block rounded-lg bg-[#C6A55A]/10 border border-[#C6A55A]/20 px-3 py-1.5 text-xs font-medium text-[#C6A55A]">
                {cmd.action_label}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${urgencyColors[cmd.urgency] ?? urgencyColors.when_possible}`}>
                {cmd.urgency.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
      {commands.length === 0 && (
        <p className="text-center text-sm text-[#F5F1E8]/40 py-8">No operator commands found.</p>
      )}
    </section>
  )
}
