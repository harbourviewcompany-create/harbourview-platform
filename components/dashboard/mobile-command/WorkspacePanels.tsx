'use client'

import type { MouseEvent as ReactMouseEvent } from 'react'
import { DynamicMarketplaceIntakeForm } from '@/components/marketplace/DynamicMarketplaceIntakeForm'
import FinancingInquiryForm from '@/app/marketplace/financing/FinancingInquiryForm'
import type { MarketView } from '../CommandCentre'
import {
  defaultListingTypeForView,
  type MobileCommandTool,
  type NormalizedListing,
} from './contracts'
import '../MobileCommandCentreWorkspaces.css'

export function MarketplaceWorkspacePanel({
  tool,
  selectedListing,
  activeMarketView,
  onClose,
  onViewSubmissions,
}: {
  tool: MobileCommandTool | null
  selectedListing: NormalizedListing | null
  activeMarketView: MarketView
  onClose: () => void
  onViewSubmissions?: () => void
}) {
  if (!tool || tool === 'financing-intake') return null

  const config = tool === 'wanted-intake'
    ? {
        eyebrow: 'Marketplace command / wanted demand',
        title: 'Post a wanted requirement',
        description: 'Create a buyer-led requirement without leaving Mobile Command. The submission remains review-gated before publication or counterparty routing.',
        defaultType: 'Wanted Request',
        defaultHeadline: '',
        defaultMarkets: '',
      }
    : tool === 'supply-intake'
      ? {
          eyebrow: 'Marketplace command / supply intake',
          title: 'Submit supply for controlled review',
          description: 'Add product, equipment, consumable, service or opportunity supply directly inside Mobile Command.',
          defaultType: defaultListingTypeForView(activeMarketView),
          defaultHeadline: '',
          defaultMarkets: '',
        }
      : {
          eyebrow: 'Marketplace command / reviewed introduction',
          title: selectedListing ? `Request access to ${selectedListing.title}` : 'Request a reviewed introduction',
          description: 'Harbourview reviews authorization, evidence, commercial fit and disclosure boundaries before any counterparty introduction.',
          defaultType: 'Qualified Access Request',
          defaultHeadline: selectedListing ? `Reviewed introduction request: ${selectedListing.title}` : '',
          defaultMarkets: selectedListing?.jurisdiction ?? '',
        }

  function keepSuccessNavigationInCommand(event: ReactMouseEvent<HTMLElement>) {
    const target = event.target
    if (!(target instanceof Element)) return
    const anchor = target.closest<HTMLAnchorElement>('a[href="/dashboard?page=marketplace"]')
    if (!anchor) return
    event.preventDefault()
    if (onViewSubmissions) onViewSubmissions()
    else onClose()
  }

  return (
    <section
      className="hvm2-workspace"
      data-mobile-command-tool={tool}
      aria-label={config.title}
      onClickCapture={keepSuccessNavigationInCommand}
    >
      <header className="hvm2-workspace-header">
        <div>
          <span>{config.eyebrow}</span>
          <h3>{config.title}</h3>
          <p>{config.description}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close marketplace workflow">Close</button>
      </header>

      {selectedListing && tool === 'introduction' && (
        <article className="hvm2-workspace-context">
          <span>{selectedListing.category} · {selectedListing.jurisdiction}</span>
          <strong>{selectedListing.title}</strong>
          <p>{selectedListing.summary}</p>
        </article>
      )}

      <DynamicMarketplaceIntakeForm
        defaultType={config.defaultType}
        defaultHeadline={config.defaultHeadline}
        defaultMarkets={config.defaultMarkets}
      />
    </section>
  )
}

export function FinancingWorkspacePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <section className="hvm2-workspace hvm2-financing-workspace" data-mobile-command-tool="financing-intake" aria-label="Trade financing inquiry">
      <header className="hvm2-workspace-header">
        <div>
          <span>Trade finance command / structured inquiry</span>
          <h3>Request financing support</h3>
          <p>Complete the reviewed financing inquiry without leaving Mobile Command. This creates an inquiry only; it does not approve credit.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close financing workflow">Close</button>
      </header>
      <FinancingInquiryForm />
    </section>
  )
}
