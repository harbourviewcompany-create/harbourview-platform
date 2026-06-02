import { projectPublicServiceCandidate } from '@/lib/marketplace/publicServiceProjection'
import { listApprovedServiceCandidates } from '@/lib/supabase/serviceCandidatesAdmin'

export type ServiceListingFeed = {
  listings: Array<{
    id: string
    title: string
    description: string
    serviceType: string
    deliveryMethod: string
    location: string
    tags: string[]
    postedDate: string
    category: 'services'
  }>
  source: 'live-approved' | 'empty'
  publicLabel: string
  reviewBoundary: string
}

export async function getLiveServiceListings(): Promise<ServiceListingFeed> {
  const approved = await listApprovedServiceCandidates()

  if (approved.ok && approved.data.length > 0) {
    return {
      source: 'live-approved',
      publicLabel: 'Approved service listings',
      reviewBoundary:
        'These public service summaries were projected from approved service candidates. Contact details, diligence evidence and availability remain private until reviewed routing.',
      listings: approved.data.map((candidate) => ({
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
      })),
    }
  }

  return {
    source: 'empty',
    publicLabel: 'Service listings',
    reviewBoundary: '',
    listings: [],
  }
}

