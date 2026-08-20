'use client'
import React, { useState, useRef, useEffect } from 'react'

/** Shared helpers for modular CommandCentre split */

type SelectOpt = { value: string; label: string }

export type SignalGroup = 'REGULATORY' | 'MARKET ACCESS' | 'SUPPLY CHAIN' | 'TESTING & COMPLIANCE' | 'EXPORT / BUYER MOVEMENT' | 'EVIDENCE UPDATES'


function deriveSignalGroup(title: string): SignalGroup {
  const t = title.toLowerCase()
  if (/export|import|buyer|gacp|eu.gmp|international/.test(t)) return 'EXPORT / BUYER MOVEMENT'
  if (/test|coa|compliance|qa|quality|lab|microbial|pesticide|threshold/.test(t)) return 'TESTING & COMPLIANCE'
  if (/supply|packaging|shipping|logistics|lead.time|transport/.test(t)) return 'SUPPLY CHAIN'
  if (/retail|dispensary|demand|patient|consumer|pos|sales/.test(t)) return 'MARKET ACCESS'
  if (/study|evidence|research|clinical|terpene|data/.test(t)) return 'EVIDENCE UPDATES'
  return 'REGULATORY'
}

function derivePolicyArea(title: string): string {
  const t = title.toLowerCase()
  if (/tax/.test(t)) return 'Taxation'
  if (/packag|label/.test(t)) return 'Packaging & Labeling'
  if (/advertis/.test(t)) return 'Marketing & Advertising'
  if (/record|retention/.test(t)) return 'Recordkeeping & Compliance'
  if (/test|lab|coa|microbial|pesticide/.test(t)) return 'Laboratory Testing & QC'
  if (/licen|permit|cap|moratorium/.test(t)) return 'Licensing & Permits'
  if (/zon|local|municipal/.test(t)) return 'Local Zoning & Ordinance'
  if (/track|trace|system|software/.test(t)) return 'Track & Trace'
  return 'Regulatory & Policy'
}

function deriveImpact(conf: number): 'High' | 'Medium' | 'Low' {
  return conf >= 80 ? 'High' : conf >= 65 ? 'Medium' : 'Low'
}

function buildMunicipalData(country: { iso2: string; label: string }, region: string) {
  if (country.iso2 === 'US') {
    const base = region || 'Florida'
    return [
      { name: 'Miami-Dade County',      status: 'medium' as const, note: 'Dispensary caps in place' },
      { name: 'Orlando (Orange County)',status: 'high'   as const, note: 'Zoning moratorium active' },
      { name: 'Tampa (Hillsborough)',   status: 'high'   as const, note: 'Conditional approvals paused' },
      { name: 'Jacksonville (Duval)',   status: 'low'    as const, note: 'Accepting applications' },
      { name: 'Palm Beach County',      status: 'medium' as const, note: 'Case-by-case review' },
    ]
  }
  return [
    { name: `${country.label} Capital Region`, status: 'medium' as const, note: 'Review municipal requirements' },
    { name: `${country.label} Metro Areas`,    status: 'low'    as const, note: 'Contact local authorities' },
  ]
}

function buildAuthorities(country: { iso2: string; label: string }) {
  if (country.iso2 === 'US') {
    return {
      top: { name: 'Office of Medical Marijuana Use (OMMU)', role: 'Program Lead', type: 'primary' as const },
      mid: [
        { name: 'FL Dept of Health',                          role: 'Health Oversight',        type: 'primary' as const },
        { name: 'FL Dept of Agriculture & Consumer Services', role: 'Lab & Product Oversight', type: 'oversight' as const },
        { name: 'FL Office of Insurance Regulation',          role: 'Licensing & Compliance',  type: 'oversight' as const },
      ],
      bot: [
        { name: 'Division of Law Enforcement (MMJ Team)', role: 'Investigations & Enforcement', type: 'enforcement' as const },
        { name: 'Local Law Enforcement Agencies',         role: 'Local Enforcement',            type: 'enforcement' as const },
      ],
      keyList: [
        { name: 'Office of Medical Marijuana Use (OMMU)',            role: 'Program lead & licensure' },
        { name: 'Florida Department of Health',                      role: 'Health oversight' },
        { name: 'FL Dept of Agriculture & Consumer Services',        role: 'Lab & product oversight' },
        { name: 'Division of Law Enforcement (MMJ Enforcement Team)',role: 'Investigations & enforcement' },
      ],
    }
  }
  return {
    top: { name: `${country.label} National Regulator`, role: 'Primary Regulatory Body', type: 'primary' as const },
    mid: [
      { name: 'Health Ministry',    role: 'Health & Access Oversight',    type: 'primary' as const },
      { name: 'Licensing Body',     role: 'Licensing & Compliance',       type: 'oversight' as const },
      { name: 'Trade Enforcement',  role: 'Market Oversight',             type: 'oversight' as const },
    ],
    bot: [
      { name: 'Enforcement Agency', role: 'Investigations & Enforcement', type: 'enforcement' as const },
      { name: 'Local Authorities',  role: 'Local Enforcement',            type: 'enforcement' as const },
    ],
    keyList: [
      { name: `${country.label} National Regulator`, role: 'Primary regulatory body' },
      { name: 'Health Ministry',                     role: 'Health & access oversight' },
    ],
  }
}

function CustomSelect({ value, options, placeholder, onChange, className }: {
  value: string; options: SelectOpt[]; placeholder?: string
  onChange: (v: string) => void; className?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const label = options.find(o => o.value === value)?.label ?? placeholder ?? 'Select'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={rootRef} className={`cc-select${open ? ' open' : ''}${className ? ` ${className}` : ''}`}>
      <button type="button" className="cc-select-trigger" onClick={() => setOpen(o => !o)} aria-haspopup="listbox">
        <span>{label}</span>
        <span className="cc-select-arrow" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="cc-select-dropdown" role="listbox">
          {options.map(opt => (
            <button
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`cc-select-opt${opt.value === value ? ' selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const COMPLIANCE_ROLE_FOCUS: Record<string, { icon: string; items: string[] }> = {
  'Compliance': { icon: '◫',
    items: ['SOP frameworks and audit readiness', 'Licence portfolio and renewal calendar', 'Variance reporting and CAPA documentation', 'Regulatory change impact assessments'] },
  'Legal': { icon: '⊙',
    items: ['Legislative compliance and contract enforceability', 'AML and financial crime obligations', 'Director liability and corporate compliance', 'IP protection and trade secret protocols'] },
  'GMP/QA': { icon: '◎',
    items: ['EU-GMP, ICH Q7, and GACP certification requirements', 'QP-qualified batch release signatories', 'Deviations, OOS investigations, and CAPA', 'Product recall and controlled drug quarantine procedures'] },
  'Lab/QA': { icon: '⊞',
    items: ['ISO 17025 accreditation and scope of testing', 'COA format and potency testing methodology', 'Proficiency testing and inter-lab calibration', 'Chain-of-custody for controlled substance samples'] },
  'Regulator': { icon: '◷',
    items: ['Cross-jurisdictional standards comparison', 'Emerging regulatory frameworks and reform tracking', 'Evidence base for framework design', 'International treaty obligations (1961/1988 Conventions)'] },
  'Importer': { icon: '↓',
    items: ['Import permit requirements and customs documentation', 'GDP cold-chain compliance obligations', 'Country-of-origin and phytosanitary certification', 'Narcotics import certificate (S10/INCB)'] },
  'Exporter': { icon: '↑',
    items: ['Export licence and narcotics export certificate', 'EU GMP equivalency for destination market access', 'GACP and cultivation documentation requirements', 'Multi-market permitting strategy'] },
  'Cultivator': { icon: '⬡',
    items: ['GACP (Good Agricultural and Collection Practice)', 'Seed-to-sale track-and-trace obligations', 'Site security and access control requirements', 'Annual regulatory inspection readiness'] },
  'Processor': { icon: '⬟',
    items: ['GMP manufacturing authorization and facility certification', 'Solvent residue and extraction process validation', 'Batch documentation and QP batch release', 'Controlled substance destruction and disposal records'] },
  'Distributor': { icon: '◈',
    items: ['GDP (Good Distribution Practice) certification', 'Cold-chain monitoring and temperature excursion protocols', 'Controlled drug wholesale licence requirements', 'Chain-of-custody and batch traceability obligations'] },
}




export {
  deriveSignalGroup,
  derivePolicyArea,
  deriveImpact,
  buildMunicipalData,
  buildAuthorities,
  CustomSelect,
  COMPLIANCE_ROLE_FOCUS,
}
