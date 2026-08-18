import Link from 'next/link'
import ClinicalEvidenceExplorer from '@/components/dashboard/mobile-command/ClinicalEvidenceExplorer'
import { CLINICAL_SCOPE_NOTICE, clinicalJurisdictionLabel, normalizeClinicalCountryIso2 } from '@/components/dashboard/mobile-command/clinicalCommandContract'

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function cleanParam(value: string): string {
  return value.trim().slice(0, 80)
}

export default async function ClinicalWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const rawCountry = cleanParam(firstParam(params.country))
  const rawRole = cleanParam(firstParam(params.role))
  const countryIso2 = normalizeClinicalCountryIso2(rawCountry || 'CA') || 'CA'
  const jurisdiction = clinicalJurisdictionLabel(countryIso2)

  const commandParams = new URLSearchParams({ page: 'clinical', country: countryIso2 })
  if (rawRole) commandParams.set('role', rawRole)
  const commandHref = `/dashboard?${commandParams.toString()}`

  return (
    <main className="hvc-workspace-page">
      <div className="hvc-workspace-shell">
        <header className="hvc-workspace-header">
          <Link href={commandHref}>← Clinical command</Link>
          <span>Clinical workspace</span>
          <h1>Evidence command · {jurisdiction}</h1>
          <p>{CLINICAL_SCOPE_NOTICE}</p>
        </header>
        <ClinicalEvidenceExplorer commandHref={commandHref} />
      </div>
    </main>
  )
}
