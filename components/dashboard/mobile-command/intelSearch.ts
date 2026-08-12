import type { MobileCommandCentreProps } from './props'
import {
  asRecord,
  readString,
  type DirectoryRecord,
  type NextAction,
  type NormalizedListing,
  type SectionId,
} from './contracts'

export type CommandSearchKind =
  | 'signal'
  | 'marketplace'
  | 'regulatory'
  | 'jurisdiction'
  | 'directory'
  | 'genetics'
  | 'action'
  | 'evidence'
  | 'talent'

export type CommandSearchRecord = {
  id: string
  kind: CommandSearchKind
  kindLabel: string
  title: string
  subtitle?: string
  jurisdiction?: string
  category?: string
  sourceLabel?: string
  dateLabel?: string
  status?: string
  destination: SectionId
  searchableText: string
  listing?: NormalizedListing
  /** Pipeline B quality display (signals only). */
  translated?: boolean
  originalLanguageLabel?: string | null
  corroborationCount?: number
  confidence?: number | null
}

type Signal = MobileCommandCentreProps['signals'][number]
type WatchItem = NonNullable<MobileCommandCentreProps['watchlistData']>['items'][number]
type LocalIntel = MobileCommandCentreProps['localIntel']

type BuildCommandSearchIndexInput = {
  signals: Signal[]
  listings: NormalizedListing[]
  watchItems: WatchItem[]
  localIntel: LocalIntel | null | undefined
  countryLabel: string
  countryIntel: MobileCommandCentreProps['countryIntel']
  directories: DirectoryRecord[]
  genetics: DirectoryRecord[]
  actions: NextAction[]
  evidenceDocuments: unknown[]
  talent: unknown[]
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function normalized(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function searchable(...values: unknown[]) {
  return normalized(values.map(text).filter(Boolean).join(' '))
}

function uniqueId(prefix: string, value: unknown, index: number) {
  const candidate = text(value)
  return candidate ? `${prefix}-${candidate}` : `${prefix}-${index}`
}

function recordFromGeneric(
  value: unknown,
  index: number,
  options: {
    prefix: string
    kind: CommandSearchKind
    kindLabel: string
    destination: SectionId
    countryLabel?: string
    titleKeys: string[]
    subtitleKeys?: string[]
    jurisdictionKeys?: string[]
    categoryKeys?: string[]
    sourceKeys?: string[]
    dateKeys?: string[]
    statusKeys?: string[]
  },
): CommandSearchRecord | null {
  const item = asRecord(value)
  const title = readString(item, options.titleKeys, '')
  if (!title) return null
  const subtitle = readString(item, options.subtitleKeys ?? [], '')
  const jurisdiction = readString(item, options.jurisdictionKeys ?? [], options.countryLabel ?? '')
  const category = readString(item, options.categoryKeys ?? [], '')
  const sourceLabel = readString(item, options.sourceKeys ?? [], '')
  const dateLabel = readString(item, options.dateKeys ?? [], '')
  const status = readString(item, options.statusKeys ?? [], '')
  const id = readString(item, ['id', 'slug', 'uuid'], '')

  return {
    id: uniqueId(options.prefix, id || title, index),
    kind: options.kind,
    kindLabel: options.kindLabel,
    title,
    ...(subtitle ? { subtitle } : {}),
    ...(jurisdiction ? { jurisdiction } : {}),
    ...(category ? { category } : {}),
    ...(sourceLabel ? { sourceLabel } : {}),
    ...(dateLabel ? { dateLabel } : {}),
    ...(status ? { status } : {}),
    destination: options.destination,
    searchableText: searchable(title, subtitle, jurisdiction, category, sourceLabel, status),
  }
}

export function buildCommandSearchIndex(input: BuildCommandSearchIndexInput): CommandSearchRecord[] {
  const records: CommandSearchRecord[] = []

  input.signals.forEach((signal, index) => {
    const item = asRecord(signal)
    const analysis = asRecord(item.analysis)
    // Prefer explicit English title fields when present; DashboardSignal.title is
    // already mapped via displayHeadline upstream, but older loaders may still
    // attach title_en / headline_en alongside a raw headline.
    const title = readString(
      item,
      ['title_en', 'headline_en', 'title', 'headline'],
      'Signal',
    )
    const jurisdiction = readString(item, ['market', 'jurisdiction', 'country'], '')
    const category = readString(item, ['type', 'signal_type', 'category'], '')
    const subtitle = readString(analysis, ['what_changed'], readString(item, ['commercialImpact', 'commercial_impact', 'summary', 'summary_en'], ''))
    const sourceLabel = readString(item, ['sourceName', 'source_name', 'sourceLabel', 'source_label'], '')
    const dateLabel = readString(item, ['published_at', 'observed_at', 'updated_at', 'timeAgo'], '')
    const status = readString(item, ['review_status', 'verification_status', 'status'], '')
    const translated = item.translated === true
    const originalLanguageLabel = readString(item, ['originalLanguageLabel', 'original_language_label'], '') || null
    const corroborationRaw = item.corroborationCount ?? item.corroboration_count
    const corroborationCount = typeof corroborationRaw === 'number' && Number.isFinite(corroborationRaw)
      ? Math.max(1, Math.round(corroborationRaw))
      : undefined
    const confidenceRaw = item.confidence
    const confidence = typeof confidenceRaw === 'number' && Number.isFinite(confidenceRaw)
      ? Math.max(0, Math.min(100, Math.round(confidenceRaw)))
      : null

    records.push({
      id: uniqueId('signal', item.id || title, index),
      kind: 'signal',
      kindLabel: 'Signal',
      title,
      ...(subtitle ? { subtitle } : {}),
      ...(jurisdiction ? { jurisdiction } : {}),
      ...(category ? { category } : {}),
      ...(sourceLabel ? { sourceLabel } : {}),
      ...(dateLabel ? { dateLabel } : {}),
      ...(status ? { status } : {}),
      destination: 'weekly-signals',
      searchableText: searchable(
        title,
        subtitle,
        jurisdiction,
        category,
        sourceLabel,
        status,
        originalLanguageLabel,
        readString(analysis, ['recommended_action'], ''),
      ),
      translated,
      originalLanguageLabel,
      ...(corroborationCount != null ? { corroborationCount } : {}),
      confidence,
    })
  })

  input.listings.forEach((listing, index) => {
    records.push({
      id: `marketplace-${listing.view}-${listing.id || index}`,
      kind: 'marketplace',
      kindLabel: 'Marketplace',
      title: listing.title,
      subtitle: listing.summary,
      jurisdiction: listing.jurisdiction,
      category: listing.category,
      status: listing.status,
      destination: 'marketplace',
      searchableText: searchable(listing.title, listing.summary, listing.jurisdiction, listing.category, listing.status, listing.channel),
      listing,
    })
  })

  input.watchItems.forEach((item, index) => {
    const record = recordFromGeneric(item, index, {
      prefix: 'watch',
      kind: 'regulatory',
      kindLabel: 'Regulatory watch',
      destination: 'regulatory',
      countryLabel: input.countryLabel,
      titleKeys: ['title'],
      subtitleKeys: ['latest_change_note', 'subtitle', 'next_action'],
      jurisdictionKeys: ['jurisdiction'],
      categoryKeys: ['item_type', 'category'],
      sourceKeys: ['source_name', 'source_label'],
      dateKeys: ['updated_at', 'last_changed_at', 'published_at'],
      statusKeys: ['status', 'watch_status'],
    })
    if (record) records.push(record)
  })

  const local = asRecord(input.localIntel)
  const authorities = array(asRecord(local.authorities).keyList)
  authorities.forEach((authority, index) => {
    const record = recordFromGeneric(authority, index, {
      prefix: 'authority',
      kind: 'jurisdiction',
      kindLabel: 'Authority',
      destination: 'local-intel',
      countryLabel: input.countryLabel,
      titleKeys: ['name', 'title'],
      subtitleKeys: ['role', 'mandate', 'description'],
      jurisdictionKeys: ['jurisdiction'],
      categoryKeys: ['level', 'type'],
      statusKeys: ['status', 'review_status'],
    })
    if (record) records.push(record)
  })

  array(local.municipalities).forEach((municipality, index) => {
    const record = recordFromGeneric(municipality, index, {
      prefix: 'subdivision',
      kind: 'jurisdiction',
      kindLabel: 'Local intelligence',
      destination: 'local-intel',
      countryLabel: input.countryLabel,
      titleKeys: ['name', 'title'],
      subtitleKeys: ['note', 'description'],
      jurisdictionKeys: ['jurisdiction'],
      categoryKeys: ['status', 'activity'],
      statusKeys: ['status'],
    })
    if (record) records.push(record)
  })

  ;['constraints', 'routes'].forEach(group => {
    array(local[group]).forEach((entry, index) => {
      const record = recordFromGeneric(entry, index, {
        prefix: `local-${group}`,
        kind: 'jurisdiction',
        kindLabel: group === 'routes' ? 'Market-access route' : 'Local constraint',
        destination: 'local-intel',
        countryLabel: input.countryLabel,
        titleKeys: ['label', 'title'],
        subtitleKeys: ['text', 'description'],
        jurisdictionKeys: ['jurisdiction'],
        categoryKeys: ['type', 'category'],
      })
      if (record) records.push(record)
    })
  })

  array(local.openQuestions).forEach((question, index) => {
    const title = text(question)
    if (!title) return
    records.push({
      id: `local-question-${index}`,
      kind: 'jurisdiction',
      kindLabel: 'Open question',
      title,
      jurisdiction: input.countryLabel,
      status: 'Unresolved',
      destination: 'local-intel',
      searchableText: searchable(title, input.countryLabel, 'open question unresolved'),
    })
  })

  if (input.countryIntel) {
    const intel = asRecord(input.countryIntel)
    const subtitle = readString(intel, ['commercial_pathway_summary', 'public_summary', 'briefing_regulatory_outlook'], '')
    const regulator = readString(intel, ['regulator_label', 'briefing_regulatory_body'], '')
    const status = readString(intel, ['review_status', 'market_access_status'], '')
    records.push({
      id: `jurisdiction-${normalized(input.countryLabel) || 'current'}`,
      kind: 'jurisdiction',
      kindLabel: 'Jurisdiction',
      title: input.countryLabel,
      ...(subtitle ? { subtitle } : {}),
      jurisdiction: input.countryLabel,
      ...(regulator ? { category: regulator } : {}),
      ...(status ? { status } : {}),
      destination: 'jurisdiction',
      searchableText: searchable(input.countryLabel, subtitle, regulator, status, readString(intel, ['region', 'regulatory_tier', 'import_status', 'export_status', 'medical_status', 'adult_use_status'], '')),
    })
  }

  input.directories.forEach((entry, index) => records.push({
    id: `directory-${entry.id || index}`,
    kind: 'directory',
    kindLabel: entry.kind || 'Directory',
    title: entry.title,
    subtitle: entry.subtitle,
    category: entry.kind,
    status: entry.status,
    destination: 'directories',
    searchableText: searchable(entry.title, entry.subtitle, entry.kind, entry.status),
  }))

  input.genetics.forEach((entry, index) => records.push({
    id: `genetics-${entry.id || index}`,
    kind: 'genetics',
    kindLabel: entry.kind || 'Genetics',
    title: entry.title,
    subtitle: entry.subtitle,
    category: entry.kind,
    status: entry.status,
    destination: 'genetics',
    searchableText: searchable(entry.title, entry.subtitle, entry.kind, entry.status),
  }))

  input.actions.forEach((action, index) => records.push({
    id: `action-${action.id || index}`,
    kind: 'action',
    kindLabel: 'Action',
    title: action.label,
    subtitle: action.detail,
    status: action.tone,
    destination: 'next-actions',
    searchableText: searchable(action.label, action.detail, action.tone),
  }))

  input.evidenceDocuments.forEach((entry, index) => {
    const record = recordFromGeneric(entry, index, {
      prefix: 'evidence',
      kind: 'evidence',
      kindLabel: 'Evidence',
      destination: 'review-gates',
      countryLabel: input.countryLabel,
      titleKeys: ['title', 'name', 'filename', 'file_name'],
      subtitleKeys: ['summary', 'description', 'document_type'],
      jurisdictionKeys: ['jurisdiction', 'country'],
      categoryKeys: ['document_type', 'type', 'category'],
      sourceKeys: ['source_name', 'source_label'],
      dateKeys: ['reviewed_at', 'updated_at', 'created_at'],
      statusKeys: ['review_status', 'verification_status', 'status'],
    })
    if (record) records.push(record)
  })

  input.talent.forEach((entry, index) => {
    const record = recordFromGeneric(entry, index, {
      prefix: 'talent',
      kind: 'talent',
      kindLabel: 'Talent',
      destination: 'talent',
      countryLabel: input.countryLabel,
      titleKeys: ['title', 'role', 'name'],
      subtitleKeys: ['company', 'description', 'summary'],
      jurisdictionKeys: ['country', 'jurisdiction', 'location'],
      categoryKeys: ['category', 'type'],
      statusKeys: ['status'],
    })
    if (record) records.push(record)
  })

  const deduped = new Map<string, CommandSearchRecord>()
  for (const record of records) {
    const key = `${record.kind}:${normalized(record.title)}:${normalized(record.jurisdiction ?? '')}`
    if (!deduped.has(key)) deduped.set(key, record)
  }
  return [...deduped.values()]
}

function rankRecord(record: CommandSearchRecord, query: string, activeCountry?: string) {
  const normalizedQuery = normalized(query)
  if (!normalizedQuery) return 0
  const title = normalized(record.title)
  const jurisdiction = normalized(record.jurisdiction ?? '')
  const category = normalized(record.category ?? '')
  const active = activeCountry ? normalized(activeCountry) : ''

  let score = -1
  if (title === normalizedQuery) score = 100
  else if (title.startsWith(normalizedQuery)) score = 85
  else if (jurisdiction === normalizedQuery) score = 75
  else if (category === normalizedQuery) score = 65
  else if (title.includes(normalizedQuery)) score = 55
  else if (record.searchableText.includes(normalizedQuery)) score = 30
  else {
    const tokens = normalizedQuery.split(' ').filter(Boolean)
    score = tokens.length > 1 && tokens.every(token => record.searchableText.includes(token)) ? 20 : -1
  }

  // Active Command Centre jurisdiction: boost true context matches so a
  // Germany-scoped session is not dominated by weak global string hits.
  if (score >= 0 && active && jurisdiction && (jurisdiction === active || jurisdiction.includes(active) || active.includes(jurisdiction))) {
    score += 18
  }

  return score
}

export function searchCommandRecords(
  records: CommandSearchRecord[],
  query: string,
  activeCountry?: string,
) {
  const normalizedQuery = normalized(query)
  if (!normalizedQuery) return []
  return records
    .map(record => ({ record, score: rankRecord(record, normalizedQuery, activeCountry) }))
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
    .map(item => item.record)
}

export function commandSearchKindCounts(records: CommandSearchRecord[]) {
  const counts = new Map<CommandSearchKind, number>()
  records.forEach(record => counts.set(record.kind, (counts.get(record.kind) ?? 0) + 1))
  return counts
}
