'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { CountryIntelProfile, PipelineCounts, WantedListing, EvidenceData, EvidenceSource, OrgEvidenceDoc, LiveEduTile, RecentEduModule, WatchlistData, PathwayData, SourceCoverageRow, RegistryCoverageSummary, LocalIntelData, JurisdictionPlaybook, EducationTrack, MarketMetric, TradeFlow, HvProfessional, CannabisOperator, CountryEducationOverlay, MySubmission } from '@/lib/dashboard/dashboardLiveData'
import { buildConfidenceLanes, overallConfidence as computeOverallConfidence, type ConfidenceLane } from '@/lib/dashboard/confidenceScoring'
import type { DashboardSignal, DigestWindow } from '@/lib/dashboard/dashboardShared'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'
import type { PublicCultivarPassportDTO } from '@/lib/genetics/dto'
import { formatOpportunityScore } from '@/lib/dashboard/opportunityScore'
import { getModuleContent } from '@/lib/dashboard/educationModuleContent'
import SignalSemanticSearch from '@/components/dashboard/SignalSemanticSearch'
import type { UserTier } from '@/lib/stripe/tier'
import { DesktopDecisionIntelBridge } from '@/components/dashboard/DesktopDecisionIntelBridge'
import { TIER_DISPLAY } from '@/lib/stripe/tierDisplay'
import UpgradeButton from '@/components/stripe/UpgradeButton'
import ManageBillingButton from '@/components/stripe/ManageBillingButton'
import { MyBriefingsPanel } from '@/components/dashboard/MyBriefingsPanel'
import type { CommandPage, MarketView, MarketRow, DashboardMarketplaceRows } from '../types'
import { NAV_SECTIONS, NAV_ITEMS_FLAT, BRIEFING_ROLE_MODULES } from '../navConfig'
import {
  deriveSignalGroup, derivePolicyArea, deriveImpact,
  buildMunicipalData, buildAuthorities, CustomSelect,
  COMPLIANCE_ROLE_FOCUS, fmtStatus, type SignalGroup,
} from '../sharedHelpers'
import { OrganizationDashboard } from './OrganizationDashboard'
import type { SelectOpt } from '../sharedHelpers'

const ORG_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'supplier',    label: 'Supplier / Cultivator' },
  { value: 'buyer',       label: 'Buyer / Importer' },
  { value: 'broker',      label: 'Broker / Trade Intermediary' },
  { value: 'lab',         label: 'Testing Laboratory' },
  { value: 'pharmacy',    label: 'Pharmacy' },
  { value: 'clinic',      label: 'Clinic' },
  { value: 'equipment',   label: 'Equipment / Technology Provider' },
  { value: 'service',     label: 'Professional Service Provider' },
  { value: 'financial',   label: 'Financial / Investment' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'exporter',    label: 'Exporter' },
  { value: 'importer',    label: 'Importer' },
]

export const OrganizationPage = React.memo(function OrganizationPage({
  hasOrg, countryOptions, onPageChange,
}: { hasOrg?: boolean; countryOptions: SelectOpt[]; onPageChange?: (page: CommandPage) => void }) {
  const [legalName,   setLegalName]   = useState('')
  const [tradeName,   setTradeName]   = useState('')
  const [orgType,     setOrgType]     = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [region,      setRegionField] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [done,        setDone]        = useState(false)

  const handleSubmit = async () => {
    setError(null)
    if (!legalName.trim())          return setError('Legal name is required.')
    if (!orgType)                   return setError('Select an organization type.')
    if (jurisdiction.length !== 2)  return setError('Select a jurisdiction country.')

    setSubmitting(true)
    try {
      const res = await fetch('/api/org/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_name: legalName.trim(),
          trade_name: tradeName.trim() || undefined,
          org_type: orgType,
          jurisdiction_country: jurisdiction,
          jurisdiction_region: region.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(
          json?.error === 'USER_ALREADY_HAS_ORG' ? 'You already belong to an organization.' :
          json?.error === 'SLUG_CONFLICT' ? 'A very similar organization name already exists — try a more specific legal name.' :
          typeof json?.error === 'string' ? json.error : 'Could not create your organization. Please try again.'
        )
        return
      }
      setDone(true)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (hasOrg || done) {
    return <OrganizationDashboard countryOptions={countryOptions} justCreated={done} />
  }

  return (
    <div className="cc-two-col-page">
      <div className="cc-two-main">
        <style>{`
.org-header { margin-bottom: 18px; }
.org-title { font-size: 1.3rem; font-weight: 700; color: #f5f0e8; }
.org-sub { font-size: .78rem; color: #8a8a9a; margin-top: 3px; }
.org-row { margin-bottom: 14px; }
.org-label { font-size: .72rem; color: #8a8a9a; margin-bottom: 5px; display: block; text-transform: uppercase; letter-spacing: .06em; }
.org-input, .org-select { width: 100%; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 9px 12px; color: #f5f0e8; font-size: .85rem; outline: none; box-sizing: border-box; }
.org-input:focus, .org-select:focus { border-color: #d4a84b; }
.org-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.org-note { font-size: .73rem; line-height: 1.6; color: #9090a0; background: rgba(212,168,75,.08); border: 1px solid rgba(212,168,75,.2); border-radius: 8px; padding: 10px 12px; margin-bottom: 16px; }
.org-error { font-size: .78rem; color: #ef4444; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25); border-radius: 8px; padding: 9px 12px; margin-bottom: 14px; }
.org-submit { background: #d4a84b; color: #050c18; font-weight: 600; font-size: .85rem; border: none; border-radius: 20px; padding: 10px 22px; cursor: pointer; }
.org-submit:disabled { opacity: .55; cursor: default; }
        `}</style>

        <div className="org-header">
          <div className="org-title">Create Your Organization</div>
          <div className="org-sub">Every counterparty on Harbourview operates through a verified organization. This starts your Passport.</div>
        </div>

        <div className="org-note">
          Created privately and unverified by default. Nothing is public until you submit for review. One organization per account at creation — teammates can be invited afterward.
        </div>

        {error && <div className="org-error">{error}</div>}

        <div className="org-row org-grid">
          <div>
            <label className="org-label">Legal name *</label>
            <input className="org-input" value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="Legal entity name" />
          </div>
          <div>
            <label className="org-label">Trade name</label>
            <input className="org-input" value={tradeName} onChange={e => setTradeName(e.target.value)} placeholder="If different from legal name" />
          </div>
        </div>

        <div className="org-row">
          <label className="org-label">Organization type *</label>
          <select className="org-select" value={orgType} onChange={e => setOrgType(e.target.value)}>
            <option value="">Select organization type</option>
            {ORG_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="org-row org-grid">
          <div>
            <label className="org-label">Country of registration *</label>
            <select className="org-select" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}>
              <option value="">Select country</option>
              {countryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="org-label">State / province (optional)</label>
            <input className="org-input" value={region} onChange={e => setRegionField(e.target.value)} placeholder="Region" />
          </div>
        </div>

        <button className="org-submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Organization'}
        </button>
      </div>
    </div>
  )
})
