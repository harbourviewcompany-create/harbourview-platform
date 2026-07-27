'use client'

import { useCallback, useEffect, useState } from 'react'
import { CLINICAL_DISCLAIMER, CLINICAL_ROLES, type ClinicalPatient } from '@/lib/clinical/types'

type MeResponse = {
  userId: string
  isVerifiedClinician: boolean
  professional: {
    id: string
    full_name: string
    verification_status: string | null
    clinical_role: string | null
    licence_number: string | null
    licence_jurisdiction: string | null
  } | null
  disclaimer: string
}

type Tab = 'overview' | 'patients' | 'calculate'

/**
 * Top-level Clinical surface for Command Centre.
 * Wire into desktop/mobile nav as page key `clinical`.
 */
export function ClinicalPanel() {
  const [tab, setTab] = useState<Tab>('overview')
  const [me, setMe] = useState<MeResponse | null>(null)
  const [patients, setPatients] = useState<ClinicalPatient[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [licence, setLicence] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [role, setRole] = useState<(typeof CLINICAL_ROLES)[number]>('doctor')

  const [newGiven, setNewGiven] = useState('')
  const [newFamily, setNewFamily] = useState('')
  const [newJur, setNewJur] = useState('')

  const [calcPatientId, setCalcPatientId] = useState('')
  const [weightKg, setWeightKg] = useState('70')
  const [mgPerKg, setMgPerKg] = useState('2.5')
  const [dosesPerDay, setDosesPerDay] = useState('2')
  const [calcResult, setCalcResult] = useState<unknown>(null)

  const loadMe = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/clinical/me')
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? `Status ${res.status}`)
      return
    }
    const data = (await res.json()) as MeResponse
    setMe(data)
  }, [])

  const loadPatients = useCallback(async () => {
    const res = await fetch('/api/clinical/patients')
    if (!res.ok) return
    const data = await res.json()
    setPatients(data.patients ?? [])
  }, [])

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  useEffect(() => {
    if (me?.isVerifiedClinician) void loadPatients()
  }, [me?.isVerifiedClinician, loadPatients])

  async function requestVerification() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/clinical/verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licence_number: licence,
          licence_jurisdiction: jurisdiction,
          clinical_role: role,
          professional_id: me?.professional?.id,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Request failed')
      await loadMe()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  async function createPatient() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/clinical/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          given_name: newGiven,
          family_name: newFamily,
          jurisdiction: newJur,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Create failed')

      // Core consents so downstream clinical actions are allowed
      const pid = body.patient.id as string
      for (const consent_type of ['treatment', 'data_processing'] as const) {
        await fetch(`/api/clinical/patients/${pid}/consent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jurisdiction: newJur,
            consent_type,
            lawful_basis: 'consent',
            method: 'electronic',
          }),
        })
      }

      setNewGiven('')
      setNewFamily('')
      await loadPatients()
      setTab('patients')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  async function runCalculation() {
    setBusy(true)
    setError(null)
    setCalcResult(null)
    try {
      const res = await fetch('/api/clinical/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: calcPatientId,
          jurisdiction: patients.find((p) => p.id === calcPatientId)?.jurisdiction ?? newJur || 'XX',
          calculator_key: 'cannabinoid.weight_based.v1',
          inputs: {
            weightKg: Number(weightKg),
            mgPerKgPerDay: Number(mgPerKg),
            dosesPerDay: Number(dosesPerDay),
          },
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Calculation failed')
      setCalcResult(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="hv-clinical-panel" style={{ padding: '1rem 1.25rem', maxWidth: 960 }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 600, margin: 0 }}>Clinical</h1>
        <p style={{ margin: '0.5rem 0 0', opacity: 0.75, fontSize: '0.85rem', lineHeight: 1.45 }}>
          {CLINICAL_DISCLAIMER}
        </p>
      </header>

      <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['overview', 'patients', 'calculate'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 6,
              border: tab === t ? '1px solid #d4a84b' : '1px solid rgba(255,255,255,0.12)',
              background: tab === t ? 'rgba(212,168,75,0.15)' : 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </nav>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: 6,
            background: 'rgba(220,80,80,0.15)',
            border: '1px solid rgba(220,80,80,0.35)',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {tab === 'overview' && (
        <section>
          <h2 style={{ fontSize: '1.05rem' }}>Clinician status</h2>
          {!me && <p style={{ opacity: 0.7 }}>Loading…</p>}
          {me && (
            <>
              <p style={{ fontSize: '0.95rem' }}>
                Verified clinician:{' '}
                <strong>{me.isVerifiedClinician ? 'Yes' : 'No'}</strong>
                {me.professional?.verification_status
                  ? ` · profile ${me.professional.verification_status}`
                  : ''}
              </p>
              {!me.isVerifiedClinician && (
                <div
                  style={{
                    marginTop: '1rem',
                    display: 'grid',
                    gap: '0.65rem',
                    maxWidth: 420,
                  }}
                >
                  <p style={{ fontSize: '0.85rem', opacity: 0.8, margin: 0 }}>
                    Submit licence details for admin review. You need a linked professional directory
                    profile.
                  </p>
                  <input
                    placeholder="Licence number"
                    value={licence}
                    onChange={(e) => setLicence(e.target.value)}
                    style={fieldStyle}
                  />
                  <input
                    placeholder="Jurisdiction (e.g. CA, DE, GB-ENG)"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    style={fieldStyle}
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as (typeof CLINICAL_ROLES)[number])}
                    style={fieldStyle}
                  >
                    {CLINICAL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button type="button" disabled={busy} onClick={() => void requestVerification()} style={btnStyle}>
                    Request verification
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {tab === 'patients' && (
        <section>
          <h2 style={{ fontSize: '1.05rem' }}>Patients</h2>
          {!me?.isVerifiedClinician && (
            <p style={{ opacity: 0.75 }}>Verified clinician access required.</p>
          )}
          {me?.isVerifiedClinician && (
            <>
              <div
                style={{
                  display: 'grid',
                  gap: '0.5rem',
                  maxWidth: 420,
                  marginBottom: '1.25rem',
                }}
              >
                <input placeholder="Given name" value={newGiven} onChange={(e) => setNewGiven(e.target.value)} style={fieldStyle} />
                <input placeholder="Family name" value={newFamily} onChange={(e) => setNewFamily(e.target.value)} style={fieldStyle} />
                <input placeholder="Jurisdiction" value={newJur} onChange={(e) => setNewJur(e.target.value)} style={fieldStyle} />
                <button type="button" disabled={busy} onClick={() => void createPatient()} style={btnStyle}>
                  Create patient + core consent
                </button>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {patients.map((p) => (
                  <li
                    key={p.id}
                    style={{
                      padding: '0.65rem 0',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      fontSize: '0.92rem',
                    }}
                  >
                    <strong>
                      {p.family_name}, {p.given_name}
                    </strong>{' '}
                    <span style={{ opacity: 0.65 }}>
                      · {p.jurisdiction} · {p.id.slice(0, 8)}
                    </span>
                  </li>
                ))}
                {patients.length === 0 && <li style={{ opacity: 0.65 }}>No patients in your care team yet.</li>}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === 'calculate' && (
        <section>
          <h2 style={{ fontSize: '1.05rem' }}>Dose calculator</h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.75 }}>
            Weight-based cannabinoid starting dose · algorithm {`2026.08.1`}. Requires consent +
            jurisdiction authority.
          </p>
          {!me?.isVerifiedClinician && <p style={{ opacity: 0.75 }}>Verified clinician access required.</p>}
          {me?.isVerifiedClinician && (
            <div style={{ display: 'grid', gap: '0.5rem', maxWidth: 420 }}>
              <select
                value={calcPatientId}
                onChange={(e) => setCalcPatientId(e.target.value)}
                style={fieldStyle}
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.family_name}, {p.given_name} ({p.jurisdiction})
                  </option>
                ))}
              </select>
              <input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="Weight kg" style={fieldStyle} />
              <input value={mgPerKg} onChange={(e) => setMgPerKg(e.target.value)} placeholder="mg/kg/day" style={fieldStyle} />
              <input value={dosesPerDay} onChange={(e) => setDosesPerDay(e.target.value)} placeholder="Doses per day" style={fieldStyle} />
              <button type="button" disabled={busy || !calcPatientId} onClick={() => void runCalculation()} style={btnStyle}>
                Compute & save
              </button>
              {calcResult != null && (
                <pre
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.35)',
                    fontSize: '0.78rem',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(calcResult, null, 2)}
                </pre>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

const fieldStyle: React.CSSProperties = {
  padding: '0.5rem 0.65rem',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(0,0,0,0.25)',
  color: 'inherit',
}

const btnStyle: React.CSSProperties = {
  padding: '0.55rem 0.85rem',
  borderRadius: 6,
  border: '1px solid #d4a84b',
  background: 'rgba(212,168,75,0.2)',
  color: 'inherit',
  cursor: 'pointer',
  fontWeight: 500,
}

export default ClinicalPanel
