import Link from 'next/link'
import type { PublicGeneticsDropCard as PublicGeneticsDropCardData } from '@/lib/marketplace/genetics/publicProjection'

export function CurrentDropCard({ drop }: { drop: PublicGeneticsDropCardData }) {
  return (
    <div className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/72">
          {drop.type}
        </p>

        <span className="rounded-full border border-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/52">
          {drop.accessLevel}
        </span>
      </div>

      <h3 className="mb-3 text-xl font-semibold text-[#f4f1eb]">{drop.name}</h3>
      <p className="text-sm leading-7 text-white/58">{drop.summary}</p>

      <div className="mt-5 text-xs leading-6 text-white/46">
        <p>Program: {drop.profileName}</p>
        <p>Markets: {drop.targetMarkets.join(', ')}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {drop.signals.map((signal) => (
          <span key={signal} className="rounded-full border border-gold/10 px-3 py-1 text-xs text-white/56">
            {signal}
          </span>
        ))}
      </div>

      <Link
        href="/dashboard?page=genetics"
        className="mt-7 inline-flex text-sm font-medium text-gold/85 hover:text-gold-light"
      >
        {drop.cta}
      </Link>
    </div>
  )
}
