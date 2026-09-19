// lib/connectors/hubspot.ts
//
// Stub for HubSpot CRM integration.
// Primary use: store / sync user briefing preferences (markets, cadence,
// sensitivity) and optionally push digest delivery events back into the CRM.
//
// Env: HUBSPOT_ACCESS_TOKEN (private app token) or HUBSPOT_API_KEY

import 'server-only'

export interface BriefingPreference {
  email: string
  markets: string[]          // ISO2 or keywords
  frequency: 'daily' | 'weekly'
  minConfidence?: number     // 0-10 scale matching existing form
  sensitivity?: 'standard' | 'high'
  lastSyncedAt?: string
}

export interface HubSpotClient {
  getBriefingPreferences(email: string): Promise<BriefingPreference | null>
  upsertBriefingPreferences(pref: BriefingPreference): Promise<void>
  logDigestDelivery(email: string, meta: { signalCount: number; narrativeLength?: number }): Promise<void>
}

function getToken(): string | null {
  return process.env.HUBSPOT_ACCESS_TOKEN?.trim() || process.env.HUBSPOT_API_KEY?.trim() || null
}

export function createHubSpotClient(): HubSpotClient {
  const token = getToken()

  if (!token) {
    return {
      async getBriefingPreferences() {
        console.info('hubspot: not configured — returning null preferences')
        return null
      },
      async upsertBriefingPreferences() {
        console.info('hubspot: not configured — skip upsert')
      },
      async logDigestDelivery() {
        console.info('hubspot: not configured — skip delivery log')
      },
    }
  }

  return {
    async getBriefingPreferences(email) {
      // TODO: GET /crm/v3/objects/contacts/search or properties API
      console.info(`hubspot: would fetch preferences for ${email}`)
      return null
    },
    async upsertBriefingPreferences(pref) {
      // TODO: PATCH contact properties (custom briefing_* fields)
      console.info(`hubspot: would upsert preferences for ${pref.email}`)
    },
    async logDigestDelivery(email, meta) {
      // TODO: create engagement / timeline event
      console.info(`hubspot: would log delivery for ${email}`, meta)
    },
  }
}
