'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { CommandPage } from '../types'
import {
  CustomSelect, fmtStatus, type SelectOpt,
} from '../sharedHelpers'


type OrgMeLicence = { id: string; licence_number: string; licence_type: string; jurisdiction_country: string; status: string; verified: boolean; expires_at: string }
type OrgMe = { id: string; name: string; legal_name: string; trade_name: string | null; org_type: string; jurisdiction_country: string; verification_status: string }

const LICENCE_TYPE_OPTIONS = [
  'Cultivation', 'Processing/Manufacturing', 'Extraction', 'Distribution',
  'Retail/Dispensing', 'Import', 'Export', 'Testing Laboratory', 'Research', 'Other',
]

export const OrganizationDashboard = React.memo(function OrganizationDashboard({
  countryOptions, justCreated,
}: { countryOptions: SelectOpt[]; justCreated?: boolean }) {
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<OrgMe | null>(null)
  const [licences, setLicences] = useState<OrgMeLicence[]>([])
  const [showForm, setShowForm] = useState(false)

  const [licNumber, setLicNumber] = useState('')
  const [licAuthority, setLicAuthority] = useState('')
  const [licType, setLicType] = useState('')
  const [licCountry, setLicCountry] = useState('')
  const [licRegion, setLicRegion] = useState('')
  const [licExpires, setLicExpires] = useState('')
  const [licSubmitting, setLicSubmitting] = useState(false)
  const [licError, setLicError] = useState<string | null>(null)
  const [licResult, setLicResult] = useState<{ auto_verified: boolean } | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/org/me')
      const json = await res.json()
      setOrg(json?.data?.org ?? null)
      setLicences(json?.data?.licences ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const submitLicence = async () => {
    setLicError(null)
    setLicResult(null)
    if (!licNumber.trim())        return setLicError('Licence number is required.')
    if (!licAuthority.trim())     return setLicError('Issuing authority is required.')
    if (!licType)                 return setLicError('Select a licence type.')
    if (licCountry.length !== 2)  return setLicError('Select a jurisdiction country.')
    if (!licExpires)              return setLicError('Expiry date is required.')

    setLicSubmitting(true)
    try {
      const res = await fetch('/api/org/licences/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licence_number: licNumber.trim(), issuing_authority: licAuthority.trim(),
          licence_type: licType, jurisdiction_country: licCountry,
          jurisdiction_region: licRegion.trim() || undefined, expires_at: licExpires,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setLicError(typeof json?.error === 'string' ? json.error : 'Could not submit licence.'); return }
      setLicResult({ auto_verified: !!json?.data?.auto_verified })
      setLicNumber(''); setLicAuthority(''); setLicType(''); setLicCountry(''); setLicRegion(''); setLicExpires('')
      await load()
    } catch {
      setLicError('Network error — please try again.')
    } finally {
      setLicSubmitting(false)
    }
  }

  return (
    <div className="cc-two-col-page">
      <div className="cc-two-main">
        <style>{`
.org-title { font-size: 1.3rem; font-weight: 700; color: #f5f0e8; }
.org-sub { font-size: .78rem; color: #8a8a9a; margin-top: 6px; }
.org-status-pill { display: inline-block; font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; padding: 3px 10px; border-radius: 999px; margin-top: 10px; }
.org-status-verified { background: rgba(16,185,129,.15); color: #10b981; }
.org-status-pending { background: rgba(212,168,75,.15); color: #d4a84b; }
.org-status-unverified { background: rgba(139,139,154,.15); color: #8a8a9a; }
.org-lic-card { border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 12px 14px; margin-top: 12px; }
.org-lic-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.org-lic-status { font-size: .68rem; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; }
.org-add-btn { margin-top: 18px; background: transparent; border: 1px solid #d4a84b; color: #d4a84b; font-weight: 600; font-size: .8rem; border-radius: 20px; padding: 8px 18px; cursor: pointer; }
.org-row { margin-bottom: 14px; }
.org-label { font-size: .72rem; color: #8a8a9a; margin-bottom: 5px; display: block; text-transform: uppercase; letter-spacing: .06em; }
.org-input, .org-select { width: 100%; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 9px 12px; color: #f5f0e8; font-size: .85rem; outline: none; box-sizing: border-box; }
.org-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.org-submit { background: #d4a84b; color: #050c18; font-weight: 600; font-size: .85rem; border: none; border-radius: 20px; padding: 10px 22px; cursor: pointer; margin-top: 4px; }
.org-submit:disabled { opacity: .55; cursor: default; }
.org-error { font-size: .78rem; color: #ef4444; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25); border-radius: 8px; padding: 9px 12px; margin-bottom: 14px; margin-top: 12px; }
.org-success { font-size: .78rem; color: #10b981; background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.25); border-radius: 8px; padding: 9px 12px; margin-top: 12px; }
        `}</style>

        {loading ? (
          <div className="org-sub">Loading your organization…</div>
        ) : !org ? (
          <div className="org-sub">Couldn't load your organization. Try refreshing.</div>
        ) : (
          <>
            <div className="org-title">{org.trade_name || org.legal_name}</div>
            {org.trade_name && <div className="org-sub">{org.legal_name}</div>}
            <span className={`org-status-pill ${
              org.verification_status === 'verified' ? 'org-status-verified' :
              org.verification_status === 'pending_review' ? 'org-status-pending' : 'org-status-unverified'
            }`}>
              {org.verification_status.replace('_', ' ')}
            </span>

            {justCreated && (
              <div className="org-success">Organization created. Add a licence below to move your Passport toward verification.</div>
            )}

            <div style={{ marginTop: 20, fontSize: '.72rem', color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Licences ({licences.length})
            </div>
            {licences.length === 0 && (
              <div className="org-sub" style={{ marginTop: 6 }}>No licences submitted yet.</div>
            )}
            {licences.map(l => (
              <div className="org-lic-card" key={l.id}>
                <div className="org-lic-row">
                  <div>
                    <div style={{ fontSize: '.85rem', color: '#f5f0e8' }}>{l.licence_type} — {l.jurisdiction_country}</div>
                    <div className="org-sub">#{l.licence_number} · expires {l.expires_at}</div>
                  </div>
                  <span className="org-lic-status" style={{
                    background: l.status === 'active' ? 'rgba(16,185,129,.15)' : l.status === 'revoked' ? 'rgba(239,68,68,.15)' : 'rgba(212,168,75,.15)',
                    color: l.status === 'active' ? '#10b981' : l.status === 'revoked' ? '#ef4444' : '#d4a84b',
                  }}>
                    {l.verified ? 'Auto-verified' : l.status}
                  </span>
                </div>
              </div>
            ))}

            {!showForm ? (
              <button className="org-add-btn" onClick={() => setShowForm(true)}>+ Add a licence</button>
            ) : (
              <div style={{ marginTop: 20 }}>
                {licError && <div className="org-error">{licError}</div>}
                {licResult && (
                  <div className="org-success">
                    {licResult.auto_verified
                      ? 'Matched the public regulator registry — verified automatically, no review needed.'
                      : 'Submitted. No automatic match was found, so this needs a quick manual review.'}
                  </div>
                )}
                <div className="org-row org-grid" style={{ marginTop: 12 }}>
                  <div>
                    <label className="org-label">Licence number *</label>
                    <input className="org-input" value={licNumber} onChange={e => setLicNumber(e.target.value)} placeholder="Licence number" />
                  </div>
                  <div>
                    <label className="org-label">Issuing authority *</label>
                    <input className="org-input" value={licAuthority} onChange={e => setLicAuthority(e.target.value)} placeholder="e.g. Health Canada" />
                  </div>
                </div>
                <div className="org-row">
                  <label className="org-label">Licence type *</label>
                  <select className="org-select" value={licType} onChange={e => setLicType(e.target.value)}>
                    <option value="">Select licence type</option>
                    {LICENCE_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="org-row org-grid">
                  <div>
                    <label className="org-label">Jurisdiction country *</label>
                    <select className="org-select" value={licCountry} onChange={e => setLicCountry(e.target.value)}>
                      <option value="">Select country</option>
                      {countryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="org-label">State / province</label>
                    <input className="org-input" value={licRegion} onChange={e => setLicRegion(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="org-row">
                  <label className="org-label">Expiry date *</label>
                  <input className="org-input" type="date" value={licExpires} onChange={e => setLicExpires(e.target.value)} />
                </div>
                <button className="org-submit" onClick={submitLicence} disabled={licSubmitting}>
                  {licSubmitting ? 'Submitting…' : 'Submit Licence'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})
