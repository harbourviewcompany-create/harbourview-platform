import { MARKETPLACE_MEDIA_COPY, type DashboardMarketplaceProjection } from '@/lib/dashboard/marketplaceMediaProjection'

export default function MarketplaceMediaStatus({
  mediaStatus,
}: {
  mediaStatus: DashboardMarketplaceProjection['mediaStatus']
}) {
  if (mediaStatus !== 'degraded') return null

  return (
    <p
      role="status"
      aria-live="polite"
      data-marketplace-media-status="degraded"
      className="m-0 border-b border-[#c6a55a]/20 bg-[#07111f] px-4 py-3 text-sm text-[#f5f1e8]"
    >
      {MARKETPLACE_MEDIA_COPY.degradedNotice}
    </p>
  )
}
