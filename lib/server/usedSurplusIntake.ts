import crypto from 'node:crypto'
import type { ListingImageStatus, UsedSurplusListing } from '@/lib/marketplace/listingTypes'

export interface IntakeCandidate {
  id?: string
  title: string
  description: string
  price?: string
  currency?: string
  location?: string
  condition?: 'used' | 'refurbished' | 'surplus'
  tags: string[]
  image_url?: string
  image_alt?: string
  image_status?: ListingImageStatus
  image_attribution?: string
  image_allowed_use?: boolean
  review_status: 'pending' | 'approved' | 'rejected'
  publication_status: 'private' | 'published' | 'unpublished'
  expires_at?: string | null
  discovered_at?: string
  source_id?: string
  snapshot_id?: string
  sourceUrl?: string
  sourceName?: string
  provenance?: string
  contactEmail?: string
  internal_notes?: string
  raw_scraped_text?: string
  raw_candidate?: Record<string, unknown>
}

export interface SourceSnapshotInput {
  source_id: string
  payload: string
  http_status?: number
  metadata?: Record<string, unknown>
}

export interface SourceRegistryInput {
  source_key: string
  category: 'used-surplus'
  name: string
  source_url: string
  parser_type?: string
  status?: 'enabled' | 'disabled' | 'needs-review'
  cadence_hours?: number
}

interface SupabaseConfig {
  url: string
  serviceRoleKey: string
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) return null

  return {
    url: url.replace(/\/$/, ''),
    serviceRoleKey,
  }
}

async function supabaseRest<T>(path: string, init?: RequestInit): Promise<T | null> {
  const config = getSupabaseConfig()

  if (!config) return null

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`,
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Supabase used surplus intake request failed: ${response.status}`)
  }

  if (response.status === 204) return null

  return (await response.json()) as T
}

export function createSnapshotHash(payload: string) {
  return crypto.createHash('sha256').update(payload).digest('hex')
}

export function isAllowedPublicImageUrl(value?: string) {
  if (!value) return false

  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeCandidate(candidate: IntakeCandidate) {
  return {
    source_id: candidate.source_id,
    snapshot_id: candidate.snapshot_id,
    candidate_hash: createSnapshotHash(
      `${candidate.title.trim().toLowerCase()}-${candidate.location ?? ''}-${candidate.price ?? ''}`
    ),
    title: candidate.title.trim(),
    description: candidate.description.trim(),
    price: candidate.price,
    currency: candidate.currency,
    location: candidate.location ?? 'Location available on request',
    condition: candidate.condition ?? 'used',
    tags: [...new Set(candidate.tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 12),
    image_url: isAllowedPublicImageUrl(candidate.image_url) ? candidate.image_url : undefined,
    image_alt: candidate.image_alt,
    image_status: candidate.image_status ?? 'representative',
    image_attribution: candidate.image_attribution,
    image_allowed_use: Boolean(candidate.image_allowed_use),
    review_status: candidate.review_status,
    publication_status: candidate.publication_status,
    expires_at: candidate.expires_at,
    raw_candidate: candidate.raw_candidate ?? {
      sourceUrl: candidate.sourceUrl,
      sourceName: candidate.sourceName,
      provenance: candidate.provenance,
      raw_scraped_text: candidate.raw_scraped_text,
    },
    internal_notes: candidate.internal_notes,
  }
}

export function isCandidateExpired(expiresAt?: string | null) {
  if (!expiresAt) return false

  return new Date(expiresAt).getTime() < Date.now()
}

export function toPublicUsedSurplusProjection(candidate: IntakeCandidate): UsedSurplusListing {
  const imageCanBePublic =
    candidate.image_allowed_use === true && isAllowedPublicImageUrl(candidate.image_url)

  return {
    id: candidate.id ?? createSnapshotHash(candidate.title).slice(0, 12),
    category: 'used-surplus',
    title: candidate.title,
    description: candidate.description,
    price: candidate.price,
    location: candidate.location ?? 'Location available on request',
    condition: candidate.condition ?? 'used',
    tags: candidate.tags,
    postedDate: (candidate.discovered_at ?? new Date().toISOString()).split('T')[0],
    image: imageCanBePublic
      ? {
          src: candidate.image_url,
          alt: candidate.image_alt ?? candidate.title,
          status: candidate.image_status ?? 'supplier-provided',
        }
      : undefined,
  }
}

export async function upsertSourceRegistry(source: SourceRegistryInput) {
  const rows = await supabaseRest<Array<{ id: string }>>('source_registry?on_conflict=source_key', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      parser_type: 'manual-html',
      status: 'needs-review',
      cadence_hours: 24,
      ...source,
      updated_at: new Date().toISOString(),
    }),
  })

  return rows?.[0] ?? null
}

export async function persistSourceSnapshot(input: SourceSnapshotInput) {
  const snapshot_hash = createSnapshotHash(input.payload)

  const rows = await supabaseRest<Array<{ id: string; snapshot_hash: string }>>(
    'source_snapshots?on_conflict=source_id,snapshot_hash',
    {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        source_id: input.source_id,
        snapshot_hash,
        http_status: input.http_status,
        raw_payload: input.payload,
        metadata: input.metadata ?? {},
      }),
    }
  )

  return rows?.[0] ?? null
}

export async function upsertUsedSurplusCandidate(candidate: IntakeCandidate) {
  const normalized = normalizeCandidate(candidate)

  const rows = await supabaseRest<Array<{ id: string; candidate_hash: string }>>(
    'used_surplus_candidates?on_conflict=candidate_hash',
    {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        ...normalized,
        updated_at: new Date().toISOString(),
      }),
    }
  )

  return rows?.[0] ?? null
}

export async function markExpiredUsedSurplusCandidates() {
  return supabaseRest<null>(
    `used_surplus_candidates?expires_at=lt.${encodeURIComponent(new Date().toISOString())}`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        publication_status: 'unpublished',
        updated_at: new Date().toISOString(),
      }),
    }
  )
}

async function getApprovedCandidatesFromSupabase(): Promise<IntakeCandidate[] | null> {
  const select = [
    'id',
    'title',
    'description',
    'price',
    'currency',
    'location',
    'condition',
    'tags',
    'image_url',
    'image_alt',
    'image_status',
    'image_allowed_use',
    'discovered_at',
    'expires_at',
    'review_status',
    'publication_status',
  ].join(',')

  const rows = await supabaseRest<IntakeCandidate[]>(
    `used_surplus_candidates?select=${select}&review_status=eq.approved&publication_status=eq.published&order=discovered_at.desc&limit=48`
  )

  return rows
}

function fallbackListings(): UsedSurplusListing[] {
  return []
}))
}

export async function getApprovedUsedSurplusListings(): Promise<UsedSurplusListing[]> {
  try {
    const approvedCandidates = await getApprovedCandidatesFromSupabase()

    if (!approvedCandidates) return fallbackListings()

    const publishedListings = approvedCandidates
      .filter((candidate) => !isCandidateExpired(candidate.expires_at))
      .map(toPublicUsedSurplusProjection)

    if (publishedListings.length === 0) return fallbackListings()

    return publishedListings
  } catch (error) {
    console.error('[Harbourview] Used surplus Supabase projection failed.', error)
    return fallbackListings()
  }
}
