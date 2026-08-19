type PublicListingHrefInput = {
  id?: string | null
  slug?: string | null
}

const TRADE_DOSSIER_CATEGORIES = new Set(['cannabis_inventory', 'services'])

export function getPublicListingHref(listing: PublicListingHrefInput, type: string) {
  if (listing.slug) {
    const normalizedType = type.replace(/-/g, '_')
    if (TRADE_DOSSIER_CATEGORIES.has(normalizedType)) {
      return `/marketplace/trading/${encodeURIComponent(listing.slug)}`
    }
    return `/marketplace/listings/${encodeURIComponent(listing.slug)}`
  }

  const params = new URLSearchParams({ type })
  if (listing.id) params.set('ref', listing.id)

  return `/intake?${params.toString()}`
}
