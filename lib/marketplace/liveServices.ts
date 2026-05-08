import { serviceListings } from '@/lib/fixtures/services'

export async function getLiveServiceListings() {
  return serviceListings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    serviceType: listing.serviceType,
    deliveryMethod: listing.deliveryMethod,
    location: listing.location,
    tags: listing.tags,
    postedDate: listing.postedDate,
  }))
}
