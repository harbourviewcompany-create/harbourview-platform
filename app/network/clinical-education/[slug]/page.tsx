import { notFound } from 'next/navigation'
import { clinicalEducationModules } from '@/lib/fixtures/clinical-education'
import { ClinicalEducationHero, ClinicalEducationModuleDetail } from '@/components/clinical-education/ClinicalEducationComponents'

export default async function ClinicalEducationModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const educationItem = clinicalEducationModules.find((item) => item.slug === slug)

  if (!educationItem) return notFound()

  return (
    <>
      <ClinicalEducationHero item={educationItem} />
      <ClinicalEducationModuleDetail item={educationItem} />
    </>
  )
}
