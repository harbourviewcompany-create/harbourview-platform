'use client'

import { useEffect, useRef } from 'react'
import { DynamicMarketplaceIntakeForm } from '@/components/marketplace/DynamicMarketplaceIntakeForm'
import FinancingInquiryForm from '@/app/marketplace/financing/FinancingInquiryForm'
import type { MarketView } from '../CommandCentre'
import {
  MOBILE_COMMAND_COPY,
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
  onViewSubmissions: () => void
}) {
  const workspaceRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (tool && tool !== 'financing-intake') workspaceRef.current?.focus()
  }, [tool])

  if (!tool || tool === 'financing-intake') return null

  const config = tool === 'wanted-intake'
    ? {
        eyebrow: 'Marketplace command / wanted demand',
        title: 'Post a wanted requirement',
        description: MOBILE_COMMAND_COPY.wantedIntakeDescription,
        defaultType: 'Wanted Request',
        defaultHeadline: '',
        defaultMarkets: '',
      }
    : tool === 'supply-intake'
      ? {
          eyebrow: 'Marketplace command / supply intake',
          title: 'Submit supply for controlled review',
          description: MOBILE_COMMAND_COPY.supplyIntakeDescription,
          defaultType: defaultListingTypeForView(activeMarketView),
          defaultHeadline: '',
          defaultMarkets: '',
        }
      : {
          eyebrow: 'Marketplace command / reviewed introduction',
          title: selectedListing ? `Request access to ${selectedListing.title}` : 'Request a reviewed introduction',
          description: MOBILE_COMMAND_COPY.introductionDescription,
          defaultType: 'Qualified Access Request',
          defaultHeadline: selectedListing ? `Reviewed introduction request: ${selectedListing.title}` : '',
          defaultMarkets: selectedListing?.jurisdiction ?? '',
        }

  return (
    <section
      ref={workspaceRef}
      tabIndex={-1}
      className="hvm2-workspace"
      data-mobile-command-tool={tool}
      aria-label={config.title}
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
        onViewSubmissions={onViewSubmissions}
      />
    </section>
  )
}

export function FinancingWorkspacePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const workspaceRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (open) workspaceRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <section
      ref={workspaceRef}
      tabIndex={-1}
      className="hvm2-workspace hvm2-financing-workspace"
      data-mobile-command-tool="financing-intake"
      aria-label="Trade financing inquiry"
    >
      <header className="hvm2-workspace-header">
        <div>
          <span>Trade finance command / structured inquiry</span>
          <h3>Request financing support</h3>
          <p>{MOBILE_COMMAND_COPY.financingInquiryDescription}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close financing workflow">Close</button>
      </header>
      <FinancingInquiryForm />
    </section>
  )
}
