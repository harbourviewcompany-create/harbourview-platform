import { EducationRouteShell } from '@/components/clinical-education/EducationRouteShell'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <EducationRouteShell title={`Education Article: ${slug}`} description="Public article projection with DTO and guardrail boundary." />
}
