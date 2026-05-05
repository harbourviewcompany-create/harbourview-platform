import { notFound } from 'next/navigation'
import { clinicalEducationModules } from '@/lib/fixtures/clinical-education'
import { ClinicalEducationHero, ClinicalEducationModuleDetail } from '@/components/clinical-education/ClinicalEducationComponents'

export default function ClinicalEducationModulePage({ params }: { params: { slug: string } }) {
  const educationModule = clinicalEducationModules.find((item) => item.slug === params.slug)
  if (!educationModule) return notFound()

  return (
    <>
      <ClinicalEducationHero module={educationModule} />
      <ClinicalEducationModuleDetail module={educationModule} />
    </>
  )
}
