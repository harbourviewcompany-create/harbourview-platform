import Link from 'next/link'
import { StatusBadge } from './StatusBadge'

export interface DashListingItem {
  id: string
  category: string
  title: string
  country: string
  status: string
  body: string
  hvScore: number
  age: string
  type: 'supply' | 'demand' | 'equipment' | 'opportunity'
  locked: boolean
  href: string
}

interface Props {
  item: DashListingItem
}

export function DashListingCard({ item }: Props) {
  return (
    <div
      className="group relative overflow-hidden rounded-[14px] p-4 transition-all"
      style={{
        background: 'rgba(13,32,55,0.65)',
        border: '1px solid rgba(198,165,90,0.18)',
      }}
    >
      {/* shimmer top line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(198,165,90,0.22),transparent)' }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--hv-champagne-400, #D8AD63)' }}>
            {item.category}
          </p>
          <h3 className="text-[13px] leading-snug" style={{ color: 'var(--hv-text-primary, #F3F0EA)' }}>
            {item.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em]"
              style={{ borderColor: 'rgba(198,165,90,0.22)', color: 'var(--hv-champagne-300)', background: 'rgba(198,165,90,0.07)' }}
            >
              {item.country}
            </span>
            <StatusBadge label={item.status} />
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="font-serif text-xl leading-none" style={{ color: 'var(--hv-champagne-300)' }}>
            {item.hvScore}
          </div>
          <div className="mt-0.5 text-[8px] uppercase tracking-[0.1em]" style={{ color: 'rgba(198,165,90,0.45)' }}>
            HV Score
          </div>
        </div>
      </div>

      {/* body */}
      <p
        className="mt-3 border-t pt-3 text-[11px] leading-relaxed"
        style={{ borderColor: 'rgba(255,255,255,0.05)', color: 'rgba(243,240,234,0.55)' }}
      >
        {item.locked
          ? 'Subscribe to access full listing detail, counterparty information, and direct contact.'
          : item.body}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px]" style={{ color: 'rgba(243,240,234,0.3)' }}>{item.age}</span>
        {item.locked ? (
          <Link
            href="/dashboard?page=marketplace"
            className="rounded-lg px-3 py-1.5 text-[11px] transition-all"
            style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}
          >
            Subscribe to access →
          </Link>
        ) : (
          <Link
            href={item.href}
            className="rounded-lg px-3 py-1.5 text-[11px] transition-all"
            style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}
          >
            Request intro →
          </Link>
        )}
      </div>

      {/* lock overlay */}
      {item.locked && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[14px]"
          style={{ background: 'rgba(3,7,13,0.6)', backdropFilter: 'blur(3px)' }}
        >
          <span className="text-xl" style={{ color: 'var(--hv-champagne-400)', opacity: 0.7 }}>🔒</span>
          <span className="max-w-[160px] text-center text-[11px] leading-relaxed" style={{ color: 'rgba(243,240,234,0.6)' }}>
            Subscribe to access full detail
          </span>
          <Link
            href="/dashboard?page=marketplace"
            className="rounded-lg px-3 py-1.5 text-[10px] transition-all"
            style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}
          >
            View plans →
          </Link>
        </div>
      )}
    </div>
  )
}
