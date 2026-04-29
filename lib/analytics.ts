type AnalyticsEvent =
  | 'page_view'
  | 'cta_start_with_harbourview_click'
  | 'cta_confidential_inquiry_click'
  | 'cta_book_call_click'
  | 'nav_click'
  | 'form_start'
  | 'form_submit'
  | 'form_error'
  | 'intake_type_selected'
  | 'preferred_next_step_selected'
  | 'contact_form_submit'
  | 'thank_you_page_view'
  | 'booking_link_click'

type EventProperties = Record<string, string | number | boolean | undefined>

export function trackEvent(event: AnalyticsEvent, properties?: EventProperties): void {
  if (typeof window === 'undefined') return

  // Stub: replace with your analytics provider (e.g. Segment, Plausible, PostHog)
  if (process.env.NODE_ENV === 'development') {
    console.debug('[Analytics]', event, properties)
  }

  // Example: window.analytics?.track(event, properties)
  // Example: window.plausible?.(event, { props: properties })
}
