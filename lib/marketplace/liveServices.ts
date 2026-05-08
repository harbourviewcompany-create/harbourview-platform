import { serviceListings } from '@/lib/fixtures/services'
import { projectPublicServiceCandidate } from '@/lib/marketplace/publicServiceProjection'
import { listApprovedServiceCandidates } from '@/lib/supabase/serviceCandidatesAdmin'

export async function getLiveServiceListings() {
  const approved = await listApprovedServiceCandidates()

  if (approved.ok && approved.data.length > 0) {
    return approved.data.map((candidate) => ({
      ...projectPublicServiceCandidate({
        id: candidate.id,
        title: candidate.title_public || 'Reviewed Service Listing',
        description: candidate.description_public || '',
        serviceType: candidate.service_type_public || 'General Services',
        deliveryMethod: candidate.delivery_method_public || 'both',
        location: candidate.location_public || 'Location on request',
        tags: candidate.tags_public || [],
      }),
      postedDate: candidate.created_at,
      category: 'services',
    }))
  }

  return serviceListings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    serviceType: listing.serviceType,
    deliveryMethod: listing.deliveryMethod,
    location: listing.location,
    tags: listing.tags,
    postedDate: listing.postedDate,
    category: 'services',
  }))
}
