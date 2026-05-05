import { notFound } from 'next/navigation'
import { clinicalEducationModules } from '@/lib/fixtures/clinical-education'
import { ClinicalEducationHero, ClinicalEducationModuleDetail } from '@/components/clinical-education/ClinicalEducationComponents'

export default function ClinicalEducationModulePage({ params }: { params: { slug: string } }) {
  const module = clinicalEducationModules.find((m) => m.slug === params.slug)
  if (!module) return notFound()

  return (
    <>
      <ClinicalEducationHero module={module} />
      <ClinicalEducationModuleDetail module={module} />
    </>
  )
}
