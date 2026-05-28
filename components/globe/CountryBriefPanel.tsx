'use client'

import Link from 'next/link'
import type { CountryBrief } from '@/hooks/useCountryBrief'

const STATUS_DOT: Record<string, string> = {
  active:     'bg-emerald-400',
  open:       'bg-emerald-300',
  regulated:  'bg-sky-400',
  emerging:   'bg-amber-400',
  limited:    'bg-orange-400',
  restricted: 'bg-red-500',
  unknown:    'bg-white/20',
}

const STATUS_TEXT: Record<string, string> = {
  active:     'text-emerald-300',
  open:       'text-emerald-200',
  regulated:  'text-sky-300',
  emerging:   'text-amber-300',
  limited:    'text-orange-300',
  restricted: 'text-red-400',
  unknown:    'text-white/30',
}

function StatusBadge({ label, value }: { label: string; value: string }) {
  const dot = STATUS_DOT[value] ?? STATUS_DOT.unknown
  const text = STATUS_TEXT[value] ?? STATUS_TEXT.unknown
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`} />
      <span className="text-white/40">{label}</span>
      <span className={`capitalize ${text}`}>{value}</span>
    </span>
  )
}

export function CountryBriefPanel({ brief }: { brief: CountryBrief }) {
  return (
    <div className="mb-4 rounded-2xl border border-[#c6a55a]/18 bg-white/[0.04] px-4 py-3">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium tracking-wide">
        <StatusBadge label="Medical" value={brief.medical_status} />
        <StatusBadge label="Adult use" value={brief.adult_use_status} />
        <StatusBadge label="Import" value={brief.import_status} />
        <StatusBadge label="Export" value={brief.export_status} />
      </div>

      {brief.public_summary && (
        <p className="mt-2.5 text-xs leading-relaxed text-white/58">
          {brief.public_summary}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {brief.regulator_label && (
          <span className="text-[10px] text-white/30">Regulator: {brief.regulator_label}</span>
        )}
        <Link
          href={`/intelligence/country-briefs`}
          className="ml-auto text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c6a55a]/70 hover:text-[#c6a55a]"
          tabIndex={-1}
        >
          Brief index →
        </Link>
      </div>
    </div>
  )
}

export function CountryBriefPanelSkeleton() {
  return (
    <div className="mb-4 animate-pulse rounded-2xl border border-[#c6a55a]/10 bg-white/[0.03] px-4 py-3">
      <div className="flex gap-4">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-3 w-20 rounded bg-white/10" />
        <div className="h-3 w-16 rounded bg-white/10" />
      </div>
      <div className="mt-2.5 h-3 w-full rounded bg-white/[0.06]" />
      <div className="mt-1.5 h-3 w-3/4 rounded bg-white/[0.06]" />
    </div>
  )
}
