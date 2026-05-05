import Link from 'next/link'
import type { ClinicalEducationCountryReadiness, ClinicalEducationModule } from '@/lib/fixtures/clinical-education'
import {
  dosageBoundaryDisclaimer,
  patientBoundaryDisclaimer,
  standardClinicalEducationDisclaimer,
} from '@/lib/fixtures/clinical-education'

export function ClinicalEducationStatusBadge({
  status,
  riskLevel,
}: {
  status: ClinicalEducationModule['moduleStatus']
  riskLevel?: ClinicalEducationModule['riskLevel']
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex rounded-full border border-gold bg-gold-pale px-3 py-1 text-xs font-semibold uppercase tracking-widest text-navy">
        {status}
      </span>
      {riskLevel ? (
        <span className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gray-600">
          {riskLevel} control
        </span>
      ) : null}
    </div>
  )
}

export function ClinicalEducationDisclaimer({ type }: { type: ClinicalEducationModule['disclaimerType'] }) {
  const copy =
    type === 'dosage'
      ? dosageBoundaryDisclaimer
      : type === 'patient-boundary'
        ? patientBoundaryDisclaimer
        : standardClinicalEducationDisclaimer

  return (
    <section className="border border-gold bg-gold-pale p-6 text-sm leading-relaxed text-navy">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">Education boundary</p>
      <p>{copy}</p>
    </section>
  )
}

export function ClinicalEducationHero({ module }: { module: ClinicalEducationModule }) {
  return (
    <section className="bg-navy py-20 text-white">
      <div className="page-container max-w-5xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold">
          Harbourview Network / Clinical Education
        </p>
        <ClinicalEducationStatusBadge status={module.moduleStatus} riskLevel={module.riskLevel} />
        <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">{module.title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gray-300">{module.publicSummary}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={module.ctaHref} className="btn-primary px-6 py-3 text-sm">
            {module.ctaLabel}
          </Link>
          <Link href="/marketplace/wanted" className="btn-outline border-gold px-6 py-3 text-sm text-gold hover:bg-gold hover:text-navy">
            Submit a Wanted Request
          </Link>
        </div>
      </div>
    </section>
  )
}

export function ClinicalEducationModuleCard({ module }: { module: ClinicalEducationModule }) {
  return (
    <Link href={module.route} className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md">
      <ClinicalEducationStatusBadge status={module.moduleStatus} riskLevel={module.riskLevel} />
      <h2 className="mt-5 text-xl font-bold text-navy">{module.title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">{module.publicSummary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {module.educationThemes.slice(0, 4).map((theme) => (
          <span key={theme} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            {theme}
          </span>
        ))}
      </div>
    </Link>
  )
}

export function ClinicalEducationModuleDetail({ module }: { module: ClinicalEducationModule }) {
  return (
    <section className="bg-white py-16">
      <div className="page-container grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold">Education scope</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Panel title="Audience" items={module.audience} />
            <Panel title="Education themes" items={module.educationThemes} />
            <Panel title="Format relevance" items={module.formatRelevance} />
            <Panel title="Country relevance" items={module.countryRelevance} />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Panel title="Allowed public language" items={module.safeLanguage} />
            <Panel title="Controlled language" items={module.restrictedLanguage} />
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Module controls</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-navy">Research status</dt>
                <dd className="text-gray-500">{module.researchStatus}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy">Professional review</dt>
                <dd className="text-gray-500">{module.professionalReviewRequired ? 'Required before advanced publication' : 'Not required for current public overview'}</dd>
              </div>
            </dl>
          </div>
          <ClinicalEducationDisclaimer type={module.disclaimerType} />
        </aside>
      </div>
    </section>
  )
}

export function CountryReadinessTable({ countries }: { countries: ClinicalEducationCountryReadiness[] }) {
  return (
    <section className="bg-gray-50 py-16">
      <div className="page-container">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold">Country education readiness</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">Country</th>
                <th className="px-4 py-3 font-semibold">Region</th>
                <th className="px-4 py-3 font-semibold">Readiness</th>
                <th className="px-4 py-3 font-semibold">Training gap</th>
                <th className="px-4 py-3 font-semibold">Brief</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {countries.map((country) => (
                <tr key={country.country}>
                  <td className="px-4 py-4 font-semibold text-navy">{country.country}</td>
                  <td className="px-4 py-4 text-gray-500">{country.region}</td>
                  <td className="px-4 py-4 text-gray-500">{country.professionalEducationReadiness}</td>
                  <td className="px-4 py-4 text-gray-500">{country.knownTrainingGap}</td>
                  <td className="px-4 py-4 text-gray-500">{country.briefAvailability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-navy">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm text-gray-500">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  )
}
