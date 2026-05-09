import { GeneticsDrop } from '@/lib/marketplace/geneticsProfiles'

export type GeneticsAccessRequest = {
  intent: string
  targetMarket: string
  licenceStatus: string
  hasClearUse: boolean
  hasTimeline: boolean
  hasScale: boolean
  identityVerified: boolean
  credibleCompany: boolean
}

export function scoreGeneticsAccessRequest(req: GeneticsAccessRequest) {
  let commercial = 0
  if (req.intent) commercial += 8
  if (req.hasClearUse) commercial += 5
  if (req.hasScale) commercial += 4
  if (req.hasTimeline) commercial += 4
  commercial += 4

  let pathway = 0
  if (req.targetMarket) pathway += 7
  if (req.licenceStatus) pathway += 6
  pathway += 4 + 4 + 4

  let quality = 0
  if (req.identityVerified) quality += 5
  if (req.credibleCompany) quality += 5
  quality += 4 + 4 + 2

  const strategic = 10

  let risk = 15
  if (!req.licenceStatus) risk -= 5
  if (!req.identityVerified) risk -= 3

  const total = commercial + pathway + quality + strategic + risk

  return {
    total,
    band: total >= 70 ? 'qualified' : total >= 55 ? 'review' : 'hold',
  }
}

export function canTriggerGeneticsIntroduction(score: number, drop: GeneticsDrop) {
  if (score < 70) return false
  if (drop.geneticsHolderPermissionStatus !== 'inquiry_routing_approved') return false
  return true
}
