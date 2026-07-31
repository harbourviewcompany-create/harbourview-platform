/**
 * Prefer `mapPublicToDashboardSignal` from this package for any
 * PublicRegulatorySignal → DashboardSignal conversion.
 *
 * `lib/dashboard/dashboardServerData.ts` still has a local
 * `regulatoryToSignal` helper for historical reasons. When that file is
 * next refactored, replace calls with:
 *
 *   import { mapPublicToDashboardSignal } from '@/lib/dashboard/mapPublicToDashboardSignal'
 *   // ...
 *   return prioritised.slice(0, limit).map(mapPublicToDashboardSignal)
 *
 * That carries corroborationCount, translated, originalLanguageLabel,
 * and signalContentType into SignalStrip / mobile CC without duplicating
 * mapping logic.
 */

export { mapPublicToDashboardSignal } from '@/lib/dashboard/mapPublicToDashboardSignal'
