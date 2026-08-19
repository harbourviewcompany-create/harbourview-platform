'use client'

/**
 * BNPL / trade-finance partner embed slot.
 * Renders only when NEXT_PUBLIC_HARBOURVIEW_BNPL_EMBED_URL is set to a trusted HTTPS URL.
 * Never invents a partner UI — empty state points operators to the inquiry form.
 */

export function PartnerEmbedSlot({
  embedUrl,
}: {
  embedUrl: string | null | undefined
}) {
  const url = embedUrl?.trim() ?? ''
  const safe =
    url.startsWith('https://') &&
    !url.includes('javascript:') &&
    url.length < 2000

  if (!safe) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 p-6 text-sm text-zinc-400">
        <p className="font-medium text-zinc-200">Partner embed not configured</p>
        <p className="mt-2 leading-relaxed">
          When a trade-finance or BNPL partner is live, their reviewed application flow appears here
          via <code className="text-xs text-zinc-500">NEXT_PUBLIC_HARBOURVIEW_BNPL_EMBED_URL</code>.
          Until then, use the structured inquiry form — Harbourview does not approve credit on-platform.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <p className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-2 text-xs text-zinc-500">
        Partner application (external) — Harbourview is not the lender and does not decide credit.
      </p>
      <iframe
        title="Trade finance partner application"
        src={url}
        className="h-[640px] w-full bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
