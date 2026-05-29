type PublicListingHrefInput = {
  id?: string | null
  slug?: string | null
}

export function getPublicListingHref(listing: PublicListingHrefInput, type: string) {
  if (listing.slug) return `/marketplace/listings/${encodeURIComponent(listing.slug)}`

  const params = new URLSearchParams({ type })
  if (listing.id) params.set('ref', listing.id)

  return `/intake?${params.toString()}`
}
