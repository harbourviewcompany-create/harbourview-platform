import { getCapabilityStatusLabel, type CapabilityStatus, type ContentOrigin } from '@/lib/platform/contentStatus'

export function ContentStatusNotice({
  title,
  status,
  origin,
  children,
}: {
  title: string
  status: CapabilityStatus
  origin: ContentOrigin
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gold/30 bg-gold-pale p-5 text-sm leading-7 text-navy">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{title}</p>
        <span className="inline-flex rounded-full border border-gold/40 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-navy/70">
          {getCapabilityStatusLabel(status)}
        </span>
      </div>
      <p className="mt-3">{children}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-navy/50">Content source: {origin.replace(/-/g, ' ')}</p>
    </div>
  )
}

export function InlineStatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
      {label}
    </span>
  )
}
