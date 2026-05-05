import { clinicalEducationModules, clinicalEducationCountryReadiness, getClinicalEducationModule } from '@/lib/fixtures/clinical-education'
import { ClinicalEducationHero, ClinicalEducationModuleCard, CountryReadinessTable } from '@/components/clinical-education/ClinicalEducationComponents'

export default function ClinicalEducationHub() {
  const root = getClinicalEducationModule('clinical-education')
  const modules = clinicalEducationModules.filter((m) => m.slug !== 'clinical-education')

  return (
    <>
      <ClinicalEducationHero module={root} />
      <section className="bg-white py-16">
        <div className="page-container grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <ClinicalEducationModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>
      <CountryReadinessTable countries={clinicalEducationCountryReadiness} />
    </>
  )
}
