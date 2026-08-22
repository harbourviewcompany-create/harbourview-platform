'use client'

/**
 * Desktop Command Centre Clinical tab — embeds the same Clinical Workspace as mobile.
 * ClinicalEvidenceCommandPage remains available for dual-surface / summary experiments.
 */
import ClinicalWorkspacePage from './pages/ClinicalWorkspacePage'

export default function ClinicalCommandCase({
  countryIso2,
  roleLabel = '',
}: {
  countryIso2?: string | null
  roleLabel?: string
}) {
  const clinicalIso = (countryIso2 || '').trim().toUpperCase()
  return (
    <ClinicalWorkspacePage
      jurisdiction={clinicalIso || 'GLOBAL'}
      roleLabel={roleLabel}
    />
  )
}
