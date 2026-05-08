import { GeneticsDrop, geneticsProfiles } from '@/lib/marketplace/geneticsProfiles'
import { canTriggerGeneticsIntroduction, scoreGeneticsAccessRequest } from './geneticsRouting'

export type GeneticsRoutingExecutionStatus =
  | 'new_request'
  | 'needs_qualification'
  | 'needs_buyer_permission'
  | 'needs_holder_permission'
  | 'ready_for_intro'
  | 'introduced'
  | 'declined'
  | 'archived'

export type GeneticsAccessSubmission = {
  profileSlug: string
  dropId: string
  company: string
  contactName: string
  email: string
  country: string
  intent: string
  targetMarket: string
  licenceStatus: string
  targetUse: string
  quantityOrScale?: string
  timeline?: string
  canShareInquiryWithGeneticsHolder: boolean
  message?: string
}

export type GeneticsRoutingRecord = {
  id: string
  profileSlug: string
  dropId: string
  requesterCompany: string
  requesterCountry: string
  requesterEmail: string
  intent: string
  targetMarket: string
  score: number
  scoreBand: string
  status: GeneticsRoutingExecutionStatus
  buyerPermissionApproved: boolean
  holderPermissionApproved: boolean
  introductionReady: boolean
  nextAction: string
  privateIntroDraft?: string
}

export function findGeneticsDrop(profileSlug: string, dropId: string): GeneticsDrop | null {
  const profile = geneticsProfiles.find((item) => item.slug === profileSlug)
  return profile?.currentDrops.find((drop) => drop.id === dropId) ?? null
}

export function createGeneticsRoutingRecord(input: GeneticsAccessSubmission): GeneticsRoutingRecord {
  const drop = findGeneticsDrop(input.profileSlug, input.dropId)
  const score = scoreGeneticsAccessRequest({
    intent: input.intent,
    targetMarket: input.targetMarket,
    licenceStatus: input.licenceStatus,
    hasClearUse: Boolean(input.targetUse),
    hasTimeline: Boolean(input.timeline),
    hasScale: Boolean(input.quantityOrScale),
    identityVerified: Boolean(input.company && input.email),
    credibleCompany: Boolean(input.company),
  })

  const holderPermissionApproved = drop?.geneticsHolderPermissionStatus === 'inquiry_routing_approved'
  const buyerPermissionApproved = input.canShareInquiryWithGeneticsHolder === true
  const introductionReady = Boolean(drop && buyerPermissionApproved && holderPermissionApproved && canTriggerGeneticsIntroduction(score.total, drop))

  return {
    id: `${input.profileSlug}-${input.dropId}-${Date.now()}`,
    profileSlug: input.profileSlug,
    dropId: input.dropId,
    requesterCompany: input.company,
    requesterCountry: input.country,
    requesterEmail: input.email,
    intent: input.intent,
    targetMarket: input.targetMarket,
    score: score.total,
    scoreBand: score.band,
    status: introductionReady
      ? 'ready_for_intro'
      : score.total < 55
        ? 'needs_qualification'
        : !buyerPermissionApproved
          ? 'needs_buyer_permission'
          : !holderPermissionApproved
            ? 'needs_holder_permission'
            : 'needs_qualification',
    buyerPermissionApproved,
    holderPermissionApproved,
    introductionReady,
    nextAction: introductionReady
      ? 'Draft controlled introduction for admin/operator approval.'
      : score.total < 55
        ? 'Request more qualification detail before routing.'
        : !buyerPermissionApproved
          ? 'Request buyer permission to share qualified teaser.'
          : !holderPermissionApproved
            ? 'Request genetics-holder routing permission.'
            : 'Operator review required.',
    privateIntroDraft: introductionReady
      ? `Controlled intro candidate: ${input.company} requested ${input.intent} access for ${input.targetMarket}. Review licence, pathway and holder permission before revealing contacts.`
      : undefined,
  }
}

export function approveControlledIntroduction(record: GeneticsRoutingRecord): GeneticsRoutingRecord {
  if (!record.introductionReady) return record
  return {
    ...record,
    status: 'introduced',
    nextAction: 'Log response and follow up on commercial fit.',
  }
}
