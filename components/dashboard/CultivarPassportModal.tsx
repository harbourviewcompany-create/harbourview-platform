'use client'

import { useEffect } from 'react'
import { CreatePassportForm } from '@/app/dashboard/genetics/cultivars/new/CreatePassportForm'

interface Props {
  open: boolean
  onClose: () => void
}

// Wraps the existing CreatePassportForm (app/actions/genetics/createPassport —
// a real, auth-gated server action, owner_user_id: user.id) in the same modal
// chrome as GeneticsProgramModal, so cultivar registration renders natively
// inside Command Centre instead of only at the orphaned /dashboard/genetics/
// cultivars/new route.
export function CultivarPassportModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(3,7,13,0.9)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[620px] max-h-[720px] overflow-y-auto rounded-2xl mx-4"
        style={{ background: 'var(--hv-bg-900, #06101B)', border: '1px solid rgba(198,165,90,0.22)' }}
      >
        <div
          className="sticky top-0 px-5 py-5"
          style={{ background: 'var(--hv-bg-900, #06101B)', borderBottom: '1px solid rgba(198,165,90,0.18)' }}
        >
          <button onClick={onClose} className="float-right text-lg transition-opacity hover:opacity-60" style={{ color: 'rgba(243,240,234,0.4)' }} aria-label="Close">✕</button>
          <p className="mb-1 text-[9px] uppercase tracking-[0.18em]" style={{ color: 'var(--hv-champagne-400)' }}>Genetics workspace</p>
          <h2 className="font-serif text-[22px] leading-tight" style={{ color: 'var(--hv-text-primary)' }}>
            Create Cultivar Passport
          </h2>
          <p className="mt-2 text-[12px]" style={{ color: 'rgba(245,241,230,.5)' }}>
            Registers a new cultivar under your ownership. Starts private, moves to public only
            after admin claim review. No seed, clone, or material transfer is implied.
          </p>
        </div>
        <div className="p-5">
          <CreatePassportForm />
        </div>
      </div>
    </div>
  )
}
