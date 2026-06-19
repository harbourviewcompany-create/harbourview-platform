import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listEnterpriseDealRooms } from '@/lib/enterprise/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function statusPill(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-950 text-emerald-400 border border-emerald-400/20'
    case 'ready_for_intro':
      return 'bg-blue-950 text-blue-400 border border-blue-400/20'
    case 'waiting_counterparty':
      return 'bg-amber-950 text-amber-400 border border-amber-400/20'
    case 'waiting_documents':
      return 'bg-orange-950 text-orange-400 border border-orange-400/20'
    case 'stalled':
      return 'bg-red-950 text-red-400 border border-red-400/20'
    case 'complete':
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
    default:
      return 'bg-zinc-900 text-zinc-400 border border-zinc-700'
  }
}

export default async function DealRoomsPage() {
  await requireAdminAuth()

  const result = await listEnterpriseDealRooms()
  const rooms = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Enterprise Coordination</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Deal Rooms</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Active deal rooms, introductions in progress, and stalled negotiations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FixtureBanner isFixture={isFixture} />
          <Link
            href="/admin/enterprise"
            className="text-xs text-zinc-500 hover:text-[#C6A55A] transition-colors"
          >
            ← Overview
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">
                {room.room_type.replace(/_/g, ' ')}
              </p>
              <h2 className="mt-1 text-sm font-semibold text-[#F5F1E8] leading-snug">{room.title}</h2>
            </div>

            <div className="space-y-1">
              {room.participants.map((p) => (
                <p key={p} className="text-xs text-zinc-400">• {p}</p>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="rounded px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-300">{room.market}</span>
              <span className="rounded px-1.5 py-0.5 text-xs bg-zinc-800/60 text-zinc-400">{room.category}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`rounded-full px-2 py-1 text-xs ${statusPill(room.status)}`}>
                {room.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-zinc-600">
                {new Date(room.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div className="border-t border-white/10 pt-2">
              <p className="text-xs text-zinc-500">
                <span className="text-zinc-600">Next: </span>
                {room.next_action}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
