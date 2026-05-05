import { notFound } from 'next/navigation'
import { clinicalEducationModules } from '@/lib/fixtures/clinical-education'
import { ClinicalEducationHero, ClinicalEducationModuleDetail } from '@/components/clinical-education/ClinicalEducationComponents'

export default async function ClinicalEducationModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const educationModule = clinicalEducationModules.find((item) => item.slug === slug)
  if (!educationModule) return notFound()

  return (
    <>
      <ClinicalEducationHero module={educationModule} />
      <ClinicalEducationModuleDetail module={educationModule} />
    </>
  )
}
