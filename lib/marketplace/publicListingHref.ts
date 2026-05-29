type ListingHrefInput = {
  id?: string | null
  slug?: string | null
}

export function getPublicListingHref(listing: ListingHrefInput, type: string) {
  const slug = listing.slug?.trim()
  if (slug) return `/marketplace/listings/${encodeURIComponent(slug)}`

  const params = new URLSearchParams()
  const ref = listing.id?.trim()
  if (ref) params.set('ref', ref)
  if (type.trim()) params.set('type', type.trim())

  const query = params.toString()
  return query ? `/intake?${query}` : '/intake'
}
