// lib/connectors/google-calendar.ts
//
// Stub for Google Calendar integration.
// Primary use: schedule recurring briefing delivery windows or create
// calendar events when a high-impact personal briefing is generated.
//
// Env: GOOGLE_CALENDAR_CREDENTIALS (service-account JSON) or OAuth token flow.
// Also requires GOOGLE_CALENDAR_ID (primary or dedicated calendar).

import 'server-only'

export interface BriefingScheduleEvent {
  title: string
  description?: string
  start: Date
  end: Date
  attendees?: string[]
  recurrence?: string[]   // RRULE strings if recurring
}

export interface GoogleCalendarClient {
  createBriefingEvent(event: BriefingScheduleEvent): Promise<{ eventId: string } | null>
  listUpcomingBriefings(opts: { maxResults?: number }): Promise<BriefingScheduleEvent[]>
}

function isConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CALENDAR_ID?.trim() &&
      (process.env.GOOGLE_CALENDAR_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS)
  )
}

export function createGoogleCalendarClient(): GoogleCalendarClient {
  if (!isConfigured()) {
    return {
      async createBriefingEvent() {
        console.info('google-calendar: not configured — skip create')
        return null
      },
      async listUpcomingBriefings() {
        console.info('google-calendar: not configured — return empty')
        return []
      },
    }
  }

  return {
    async createBriefingEvent(event) {
      // TODO: use googleapis calendar.events.insert
      console.info(`google-calendar: would create event "${event.title}" at ${event.start.toISOString()}`)
      return { eventId: `stub-${Date.now()}` }
    },
    async listUpcomingBriefings(opts) {
      console.info('google-calendar: would list upcoming', opts)
      return []
    },
  }
}
