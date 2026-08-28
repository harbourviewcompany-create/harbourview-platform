'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { UserTier } from '@/lib/stripe/tier'
import { TIER_DISPLAY } from '@/lib/stripe/tierDisplay'
import UpgradeButton from '@/components/stripe/UpgradeButton'
import ManageBillingButton from '@/components/stripe/ManageBillingButton'
import { ROLE_PROFILES } from '@/lib/dashboard/roleMetricsConfig'
import type { CommandPage } from '../types'
import { CustomSelect, fmtStatus, type SelectOpt } from '../sharedHelpers'

export const SettingsPage = React.memo(function SettingsPage({
  country, region, role, countryOptions, roleOptions, onCountryChange, onRoleChange, onPageChange, userTier = 'free',
}: {
  country:          { iso2: string; label: string }
  region:           string
  role:             string
  countryOptions:   SelectOpt[]
  roleOptions:      SelectOpt[]
  onCountryChange?: (iso2: string) => void
  onRoleChange?:    (role: string) => void
  onPageChange?:    (page: CommandPage) => void
  userTier?:        UserTier
}) {
  const [mapPref, setMapPref] = useState('auto')
  const [evidenceConf, setEvidenceConf] = useState('all')
  const [emailDigests, setEmailDigests] = useState(true)
  const [signalAlerts, setSignalAlerts] = useState(true)

  return (
    <div className="cc-page cc-settings">
      <div className="cc-settings-main">
        <h1 className="cc-page-title">Settings</h1>
        <p className="cc-page-sub">Jurisdiction, role, and workspace preferences</p>

        <section className="cc-settings-section">
          <h2>Context</h2>
          <div className="cc-settings-grid">
            <div>
              <label className="cc-settings-label">Role</label>
              <CustomSelect value={role} options={roleOptions} placeholder="Select role" onChange={v => onRoleChange?.(v)} className="cc-settings-sel" />
            </div>
            <div>
              <label className="cc-settings-label">Country</label>
              <CustomSelect value={country.iso2} options={countryOptions} onChange={v => onCountryChange?.(v)} className="cc-settings-sel" />
            </div>
          </div>
        </section>

        <section className="cc-settings-section">
          <h2>Display</h2>
          <div className="cc-settings-grid">
            <div>
              <label className="cc-settings-label">Map preference</label>
              <CustomSelect value={mapPref} onChange={setMapPref} className="cc-settings-sel" options={[
                { value: 'auto', label: 'Auto' },
                { value: 'globe', label: 'Globe' },
                { value: 'flat', label: 'Flat map' },
              ]} />
            </div>
            <div>
              <label className="cc-settings-label">Evidence confidence floor</label>
              <CustomSelect value={evidenceConf} onChange={setEvidenceConf} className="cc-settings-sel" options={[
                { value: 'all', label: 'Show all' },
                { value: '65', label: 'Medium+' },
                { value: '80', label: 'High only' },
              ]} />
            </div>
          </div>
        </section>

        <section className="cc-settings-section">
          <h2>Notifications</h2>
          <label className="cc-settings-check">
            <input type="checkbox" checked={emailDigests} onChange={e => setEmailDigests(e.target.checked)} />
            Email digests
          </label>
          <label className="cc-settings-check">
            <input type="checkbox" checked={signalAlerts} onChange={e => setSignalAlerts(e.target.checked)} />
            High-confidence signal alerts
          </label>
        </section>

        <section className="cc-settings-section">
          <h2>Plan</h2>
          <p className="cc-settings-plan">
            Current tier: <strong>{TIER_DISPLAY[userTier]?.label ?? userTier}</strong>
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <UpgradeButton />
            <ManageBillingButton />
          </div>
        </section>
      </div>

      <aside className="cc-settings-aside">
        <div className="cc-settings-card">
          <h3>Quick links</h3>
          <button type="button" onClick={() => onPageChange?.('organization')}>Organization →</button>
          <button type="button" onClick={() => onPageChange?.('licences')}>Licences →</button>
          <button type="button" onClick={() => onPageChange?.('notifications')}>Notifications →</button>
          <button type="button" onClick={() => { window.location.href = '/auth/signout' }} style={{ color: '#ef4444' }}>↗ Sign Out</button>
        </div>
      </aside>
    </div>
  )
})
