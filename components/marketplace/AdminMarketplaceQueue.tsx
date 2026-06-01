import type { MarketplaceAdminQueueItem } from '@/lib/server/marketplaceAdminQuery'

export function AdminMarketplaceQueue({ items }: { items: MarketplaceAdminQueueItem[] }) {
  if (!items.length) {
    return <div className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-8 text-sm text-[#F5F1E8]/55">No marketplace candidates are currently in this queue.</div>
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F]">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-[#061322] text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
          <tr><th className="p-3">Candidate</th><th className="p-3">Category</th><th className="p-3">Type</th><th className="p-3">Seller/source</th><th className="p-3">Verification</th><th className="p-3">Publication</th><th className="p-3">Monetization</th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-[#C6A55A]/10 text-[#F5F1E8]/70">
              <td className="p-3"><div className="font-medium text-[#F5F1E8]">{item.title || 'Untitled candidate'}</div><div className="text-xs text-[#F5F1E8]/40">{item.created_at}</div></td>
              <td className="p-3">{item.category_key || 'uncategorized'}<div className="text-xs text-[#F5F1E8]/40">{item.subcategory_key}</div></td>
              <td className="p-3">{item.record_type || item.listing_type_key || 'review'}</td>
              <td className="p-3">{item.seller_name_private || item.source_type || 'private review'}</td>
              <td className="p-3">{item.verification_status || 'unverified'}</td>
              <td className="p-3">{item.publication_status || 'not_publishable'}</td>
              <td className="p-3">{item.monetization_path || 'manual_review'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
