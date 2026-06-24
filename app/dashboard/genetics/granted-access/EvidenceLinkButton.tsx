'use client'

import { useState, useTransition } from 'react'
import { requestEvidenceSignedUrl } from './actions'

export function EvidenceLinkButton({ evidenceItemId, grantId, title }: { evidenceItemId: string; grantId: string; title: string }) {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<{ status: 'idle' | 'error'; message?: string } | { status: 'ready'; url: string; expiresInSeconds: number }>({ status: 'idle' })

  const handleClick = () => {
    startTransition(async () => {
      const result = await requestEvidenceSignedUrl(evidenceItemId, grantId)
      if (result.ok) {
        setState({ status: 'ready', url: result.signedUrl, expiresInSeconds: result.expiresInSeconds })
      } else {
        setState({ status: 'error', message: `Access denied (${result.reason.replace(/_/g, ' ')}).` })
      }
    })
  }

  if (state.status === 'ready') {
    return (
      <a
        href={state.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-full border border-[#C6A55A]/40 bg-[#C6A55A]/10 px-3 py-1 text-xs text-[#C6A55A]"
      >
        Open {title} (link expires in {Math.round(state.expiresInSeconds / 60)} min)
      </a>
    )
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#F5F1E8]/80 hover:border-[#C6A55A]/40 disabled:opacity-50"
      >
        {isPending ? 'Requesting…' : `Get link — ${title}`}
      </button>
      {state.status === 'error' && <p className="mt-1 text-[11px] text-red-400">{state.message}</p>}
    </div>
  )
}
