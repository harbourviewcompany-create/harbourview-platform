import type { CountryDashboardSummary, DashboardSectionSlug, GlobeRouteSourceEventType, GlobeRoutingEventHandlers, GlobeRoutingEventPayload } from './contracts'
import { createGlobeRoutingPayload } from './countries'

export function dispatchGlobeRoutingEvent(
  handlers: GlobeRoutingEventHandlers | undefined,
  country: CountryDashboardSummary,
  sourceEventType: GlobeRouteSourceEventType,
  selectedDashboardSection?: DashboardSectionSlug,
): GlobeRoutingEventPayload {
  const payload = createGlobeRoutingPayload(country, sourceEventType, selectedDashboardSection)

  if (sourceEventType === 'hover') handlers?.onCountryHover?.(payload)
  if (sourceEventType === 'focus') handlers?.onCountryFocus?.(payload)
  if (sourceEventType === 'select') handlers?.onCountrySelect?.(payload)
  if (sourceEventType === 'overlay-open') handlers?.onCountryOverlayOpen?.(payload)
  if (sourceEventType === 'dashboard-intent') handlers?.onDashboardIntent?.(payload)
  if (sourceEventType === 'dashboard-enter') handlers?.onDashboardEnter?.(payload)
  if (sourceEventType === 'search-select') handlers?.onCountrySearchSelect?.(payload)

  return payload
}
