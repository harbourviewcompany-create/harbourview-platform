export const educationAudience = [
  'clinician','pharmacist','qa','qp','importer','exporter','distributor','regulator','investor','laboratory','procurement','policymaker','educator',
] as const
export type EducationAudience = (typeof educationAudience)[number]

export const educationSensitivity = ['standard','professional','medical','clinical','regulatory','legal','intelligence','restricted'] as const
export type EducationSensitivity = (typeof educationSensitivity)[number]

export const publicationState = ['draft','source-review','clinical-review','legal-review','approved','request-only','published','archived'] as const
export type PublicationState = (typeof publicationState)[number]

export const sourceBasis = ['official-source','reviewed-public-source','internal-analysis','expert-reviewed','pending-verification','fixture','draft'] as const
export type SourceBasis = (typeof sourceBasis)[number]
