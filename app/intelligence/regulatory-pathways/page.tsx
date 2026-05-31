import type { Metadata } from 'next'
import IntelligenceModulePage from '@/app/intelligence/IntelligenceModulePage'

export const metadata: Metadata = {
  title: 'Regulatory Pathways | Harbourview Intelligence',
  description: 'Regulatory access pathway mapping across medical, pharmaceutical, research and adult-use frameworks in priority markets.',
}

export default function RegulatoryPathwaysPage() {
  return (
    <IntelligenceModulePage
      content={{
        eyebrow: 'Intelligence / Regulatory',
        title: 'Regulatory pathway mapping for cannabis market access.',
        description:
          'Harbourview regulatory pathway intelligence maps access model structures, licensing frameworks and competent authority roles across medical, pharmaceutical, research and adult-use markets — without providing legal advice, regulatory approval or market-entry guarantees.',
        requestLabel: 'Request Regulatory Pathway Intelligence',
        reviewItems: [
          'Medical access model mapping: prescription-only, authorised prescriber, specialist-only, named patient and pharmacy-direct pathway structures across priority medical cannabis markets.',
          'Pharmaceutical market authorisation pathways: the distinction between licensed medicine status, special access and unlicensed import models in jurisdictions applying pharmaceutical-grade standards.',
          'Research and clinical trial frameworks: ethics approval, IND or CTA equivalents, controlled drug research exemptions and institutional supply pathway requirements for cannabis research programmes.',
          'Regulatory body mapping: the competent authority structures — narcotics authority, medicines agency, agricultural authority and customs body — that govern cannabis across key import and export jurisdictions.',
          'Adult-use and industrial hemp frameworks: where adult-use legalisation, hemp-derived cannabinoid and CBD regulations intersect with or are separated from medical cannabis pathways in tracked markets.',
          'Access model evolution signals: publicly available signals of pending reclassification, access expansion, prescription restriction changes or market authorisation developments in priority jurisdictions.',
        ],
        boundaryItems: [
          'Regulatory pathway summaries are orientation and context only. They do not represent approvals, route guarantees, legal opinions, commercial clearance or regulatory authority endorsement.',
          'Specific regulatory pathway questions involving named products, submissions, licence applications or active regulatory engagements are handled through private intake.',
          'Harbourview does not provide legal advice or regulatory authority services. Operators should verify requirements with qualified local legal and regulatory advisors.',
        ],
      }}
    />
  )
}
