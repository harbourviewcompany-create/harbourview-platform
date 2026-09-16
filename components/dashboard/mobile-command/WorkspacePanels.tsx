'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { DynamicMarketplaceIntakeForm } from '@/components/marketplace/DynamicMarketplaceIntakeForm'
import { SellerContactForm } from './SellerContactForm'
import FinancingInquiryForm from '@/app/marketplace/financing/FinancingInquiryForm'
import type { MarketView } from '../CommandCentre'
import {
  MOBILE_COMMAND_COPY,
  defaultListingTypeForView,
  type MobileCommandTool,
  type NormalizedListing,
} from './contracts'
import '../MobileCommandCentreWorkspaces.css'

function useWorkspaceFocus(open: boolean, workspaceRef: RefObject<HTMLElement | null>) {
  const openingTriggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    const activeElement = document.activeElement
    openingTriggerRef.current = activeElement instanceof HTMLElement ? activeElement : null
    workspaceRef.current?.focus()

    return () => {
      const trigger = openingTriggerRef.current
      openingTriggerRef.current = null
      window.requestAnimationFrame(() => trigger?.focus())
    }
  }, [open, workspaceRef])
}

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
  const open = Boolean(tool && tool !== 'financing-intake')
  useWorkspaceFocus(open, workspaceRef)

  if (!tool || tool === 'financing-intake') return null

  const config = tool === 'wanted-intake'
    ? {
        eyebrow: 'Wanted demand',
        title: 'Post a wanted requirement',
        description: MOBILE_COMMAND_COPY.wantedIntakeDescription,
        defaultType: 'Wanted Request',
        defaultHeadline: '',
        defaultMarkets: '',
        useSellerForm: false,
      }
    : tool === 'supply-intake'
      ? {
          eyebrow: 'Supply intake',
          title: (activeMarketView === 'equipment' || activeMarketView === 'consumables' || activeMarketView === 'new-products' || activeMarketView === 'services')
            ? 'List consumables or equipment'
            : 'Submit supply for review',
          description: MOBILE_COMMAND_COPY.supplyIntakeDescription,
          defaultType: defaultListingTypeForView(activeMarketView),
          defaultHeadline: '',
          defaultMarkets: '',
          useSellerForm: false,
        }
      : (() => {
          const view = selectedListing?.view ?? activeMarketView
          const openTier = view === 'equipment' || view === 'consumables' || view === 'new-products' || view === 'services'
          const useSellerForm = Boolean(
            selectedListing &&
              openTier &&
              tool === 'introduction',
          )
          return {
            eyebrow: openTier ? 'Contact seller' : 'Reviewed introduction',
            title: useSellerForm
              ? 'Send inquiry'
              : selectedListing
                ? (openTier ? 'Contact seller' : 'Request access')
                : (openTier ? 'Contact seller' : 'Request introduction'),
            description: useSellerForm
              ? '' // form carries its own short lead copy
              : openTier
                ? 'Harbourview delivers your inquiry; contact details stay private until they respond.'
                : MOBILE_COMMAND_COPY.introductionDescription,
            defaultType: openTier ? 'Service' : 'Qualified Access Request',
            defaultHeadline: selectedListing
              ? (openTier
                  ? `Seller inquiry: ${selectedListing.title}`
                  : `Reviewed introduction request: ${selectedListing.title}`)
              : '',
            defaultMarkets: selectedListing?.jurisdiction ?? '',
            useSellerForm,
          }
        })()

  const formKey = [
    tool,
    activeMarketView,
    selectedListing?.id ?? 'none',
    config.defaultType,
    config.defaultHeadline,
    config.defaultMarkets,
  ].join(':')

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
          {config.description ? <p>{config.description}</p> : null}
        </div>
        <button type="button" onClick={onClose} aria-label={MOBILE_COMMAND_COPY.marketplaceWorkflowClose}>
          Close
        </button>
      </header>

      {selectedListing && tool === 'introduction' ? (
        <article className="hvm2-workspace-context">
          <span>
            {selectedListing.category} · {selectedListing.jurisdiction}
          </span>
          <strong>{selectedListing.title}</strong>
        </article>
      ) : null}

      {config.useSellerForm && selectedListing ? (
        <SellerContactForm listing={selectedListing} onDone={onClose} />
      ) : (
        <DynamicMarketplaceIntakeForm
          key={formKey}
          defaultType={config.defaultType}
          defaultHeadline={config.defaultHeadline}
          defaultMarkets={config.defaultMarkets}
          onViewSubmissions={onViewSubmissions}
        />
      )}
    </section>
  )
}

export function FinancingWorkspacePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const workspaceRef = useRef<HTMLElement>(null)
  useWorkspaceFocus(open, workspaceRef)

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
          <span>{MOBILE_COMMAND_COPY.financingWorkflowEyebrow}</span>
          <h3>{MOBILE_COMMAND_COPY.financingWorkflowTitle}</h3>
          <p>{MOBILE_COMMAND_COPY.financingInquiryDescription}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={MOBILE_COMMAND_COPY.financingWorkflowClose}>
          Close
        </button>
      </header>
      <FinancingInquiryForm />
    </section>
  )
}
