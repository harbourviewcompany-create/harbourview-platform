import crypto from 'node:crypto'
import { usedSurplusListings } from '@/lib/fixtures/used-surplus'
import type { UsedSurplusListing } from '@/lib/fixtures/types'

export interface IntakeCandidate {
  title: string
  description: string
  price?: string
  location?: string
  condition?: 'used' | 'refurbished' | 'surplus'
  tags: string[]
  image_url?: string
  image_alt?: string
  image_status?: 'representative' | 'supplier-provided' | 'verified'
  review_status: 'pending' | 'approved' | 'rejected'
  publication_status: 'private' | 'published' | 'unpublished'
  expires_at?: string
  sourceUrl?: string
  sourceName?: string
  provenance?: string
  contactEmail?: string
  internal_notes?: string
  raw_scraped_text?: string
}

export function createSnapshotHash(payload: string) {
  return crypto.createHash('sha256').update(payload).digest('hex')
}

export function normalizeCandidate(candidate: IntakeCandidate) {
  return {
    candidate_hash: createSnapshotHash(`${candidate.title}-${candidate.location ?? ''}`),
    title: candidate.title.trim(),
    description: candidate.description.trim(),
    price: candidate.price,
    location: candidate.location ?? 'Location available on request',
    condition: candidate.condition ?? 'used',
    tags: [...new Set(candidate.tags)].slice(0, 12),
    image_url: candidate.image_url,
    image_alt: candidate.image_alt,
    image_status: candidate.image_status ?? 'representative',
    review_status: candidate.review_status,
    publication_status: candidate.publication_status,
    expires_at: candidate.expires_at,
    raw_candidate: {
      sourceUrl: candidate.sourceUrl,
      sourceName: candidate.sourceName,
      provenance: candidate.provenance,
      raw_scraped_text: candidate.raw_scraped_text,
    },
    internal_notes: candidate.internal_notes,
  }
}

export function isCandidateExpired(expiresAt?: string) {
  if (!expiresAt) return false

  return new Date(expiresAt).getTime() < Date.now()
}

export function toPublicUsedSurplusProjection(candidate: IntakeCandidate): UsedSurplusListing {
  return {
    id: createSnapshotHash(candidate.title).slice(0, 12),
    category: 'used-surplus',
    title: candidate.title,
    description: candidate.description,
    price: candidate.price,
    location: candidate.location ?? 'Location available on request',
    condition: candidate.condition ?? 'used',
    tags: candidate.tags,
    postedDate: new Date().toISOString().split('T')[0],
    image: candidate.image_url
      ? {
          src: candidate.image_url,
          alt: candidate.image_alt ?? candidate.title,
          status: candidate.image_status ?? 'representative',
        }
      : undefined,
  }
}

export async function getApprovedUsedSurplusListings(): Promise<UsedSurplusListing[]> {
  const approvedCandidates: IntakeCandidate[] = []

  const publishedListings = approvedCandidates
    .filter((candidate) => {
      return (
        candidate.review_status === 'approved' &&
        candidate.publication_status === 'published' &&
        !isCandidateExpired(candidate.expires_at)
      )
    })
    .map(toPublicUsedSurplusProjection)

  if (publishedListings.length === 0) {
    return usedSurplusListings.map((listing) => ({
      ...listing,
      contactEmail: undefined,
    }))
  }

  return publishedListings
}
