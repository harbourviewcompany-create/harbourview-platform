/**
 * Shared mapper: PublicRegulatorySignal → DashboardSignal
 * Carries Pipeline B quality-brain fields into every dashboard surface.
 */

import type { DashboardSignal } from '@/lib/dashboard/dashboardShared'
import type { PublicRegulatorySignal } from '@/lib/regulatory-signals/types'
import { SIGNAL_TAG_MAP, REG_TYPE_TO_TAG } from '@/lib/regulatory-signals/signalTags'
import { flagEmoji } from '@/lib/utils/flagEmoji'

function stripHtml(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/"/g, '"')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/'|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\/?\$[A-Z]{2,8}(?:\.[A-Z]{2,4})?/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 180)
}

function confidenceToScore(c: PublicRegulatorySignal['confidence']): number {
  switch (c) {
    case 'verified': return 99
    case 'high':     return 85
    case 'medium':   return 65
    case 'low':      return 42
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1)  return 'Just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

export function mapPublicToDashboardSignal(s: PublicRegulatorySignal): DashboardSignal {
  const tagKey = REG_TYPE_TO_TAG[s.signal_type] ?? 'regulatory_change'
  const tag    = SIGNAL_TAG_MAP[tagKey] ?? SIGNAL_TAG_MAP.regulatory_change
  const market = s.country_name ?? s.region ?? ''
  return {
    id:               s.id,
    slug:             s.slug,
    title:            stripHtml(s.headline),
    type:             tagKey,
    market,
    tag,
    timeAgo:          timeAgo(s.published_at ?? s.signal_date),
    confidence:       s.confidence_score ?? confidenceToScore(s.confidence),
    commercialImpact: s.public_implication,
    sourceLabel:      s.regulator_name || 'Harbourview Intelligence',
    flag:             flagEmoji(s.country_code),
    contentType:      'signal',
    corroborationCount: s.corroboration_count,
    translated: s.translated,
    originalLanguageLabel: s.original_language_label,
    signalContentType: s.content_type,
  }
}
