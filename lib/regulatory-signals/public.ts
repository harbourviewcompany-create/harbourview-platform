import { getAdminDataClient } from '@/lib/supabase/adminDataClient'

export async function getPublicRegulatorySignals() {
  try {
    const client = getAdminDataClient()
    return await client.fetch('/rest/v1/regulatory_signals.public_signals?order=signal_date.desc')
  } catch {
    return []
  }
}
