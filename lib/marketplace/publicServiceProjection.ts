export interface PublicServiceCandidate {
  id: string
  title: string
  description: string
  serviceType: string
  deliveryMethod: 'remote' | 'on-site' | 'both'
  location: string
  tags: string[]
}

export function projectPublicServiceCandidate(candidate: PublicServiceCandidate) {
  return {
    id: candidate.id,
    title: candidate.title,
    description: candidate.description,
    serviceType: candidate.serviceType,
    deliveryMethod: candidate.deliveryMethod,
    location: candidate.location,
    tags: candidate.tags,
  }
}
