import { EducationRouteShell } from '@/components/clinical-education/EducationRouteShell'

export default async function Page({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  return <EducationRouteShell title={`Country Brief: ${country}`} description="Jurisdiction education brief with no legal conclusions or approval guarantees." />
}
