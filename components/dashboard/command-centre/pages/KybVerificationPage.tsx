'use client'
import React, { useState } from 'react'
import type { CommandPage } from '../types'
import { flagEmoji } from '@/lib/utils/flagEmoji'

export const KybVerificationPage = React.memo(function KybVerificationPage({
  country, region, role, hasOrg, onPageChange,
}: {
  country: { iso2: string; label: string }
  region: string
  role: string
  hasOrg?: boolean
  onPageChange?: (page: CommandPage) => void
}) {
  const [status] = useState(hasOrg ? 'in_progress' : 'not_started')

  return (
    <div className="cc-kyb">
      <div className="cc-page-header">
        <h1 className="cc-page-title">KYB Verification</h1>
        <p className="cc-page-sub">{flagEmoji(country.iso2)} {country.label} · {role}</p>
      </div>
      <section className="cc-kyb-status">
        <div className="cc-card-head">STATUS</div>
        <p className="cc-kyb-badge">{status.replace(/_/g, ' ')}</p>
        {!hasOrg && (
          <p className="cc-right-prose">Create or join an organisation first to start KYB.</p>
        )}
        <button type="button" className="cc-nba-btn" onClick={() => onPageChange?.('organization')}>
          {hasOrg ? 'Open organisation' : 'Set up organisation'} →
        </button>
      </section>
      <section className="cc-kyb-steps">
        <div className="cc-card-head">TYPICAL STEPS</div>
        <ol>
          <li>Organisation profile & legal entity</li>
          <li>Beneficial ownership disclosure</li>
          <li>Licence / registration evidence</li>
          <li>Director identity verification</li>
        </ol>
      </section>
    </div>
  )
})
