import type { Metadata } from 'next'
import ClinicalWorkspacePage from '@/components/dashboard/pages/ClinicalWorkspacePage'

export const metadata: Metadata = {
  title: 'Clinical Workspace | Harbourview',
  description: 'Harbourview Prescriber Operating System workspace.',
}

export const dynamic = 'force-dynamic'

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function normalizeJurisdiction(value: string): string {
  const normalized = value.trim().toUpperCase()
  return /^[A-Z]{2}(?:-[A-Z0-9]{2,3})?$/.test(normalized) && normalized !== 'GLOBAL' ? normalized : ''
}

export default async function ClinicalWorkspaceRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const jurisdiction = normalizeJurisdiction(first(params.country) || first(params.jurisdiction))
  const roleLabel = first(params.role).trim()
  const initialQuery = first(params.q).trim()

  return (
    <ClinicalWorkspacePage
      jurisdiction={jurisdiction}
      roleLabel={roleLabel}
      initialQuery={initialQuery}
    />
  )
}
