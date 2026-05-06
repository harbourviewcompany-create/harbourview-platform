import { clinicalEducationCountryReadiness, clinicalEducationModules, getClinicalEducationModule } from '@/lib/fixtures/clinical-education'
import { ClinicalEducationHero, ClinicalEducationModuleCard, CountryReadinessTable } from '@/components/clinical-education/ClinicalEducationComponents'

export default function ClinicalEducationHub() {
  const root = getClinicalEducationModule('clinical-education')
  const items = clinicalEducationModules.filter((item) => item.slug !== 'clinical-education')

  return (
    <>
      <ClinicalEducationHero item={root} />
      <section className="bg-white py-16">
        <div className="page-container grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ClinicalEducationModuleCard key={item.id} item={item} />
          ))}
        </div>
      </section>
      <CountryReadinessTable countries={clinicalEducationCountryReadiness} />
    </>
  )
}
