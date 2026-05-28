export const educationAudience = ['clinician','pharmacist','qa','qp','importer','exporter','distributor','regulator','investor','laboratory','procurement','policymaker','educator'] as const
export const educationSensitivity = ['standard','professional','medical','clinical','regulatory','legal','intelligence','restricted'] as const
export const educationPublicationStates = ['draft','source-review','clinical-review','legal-review','approved','request-only','published','archived'] as const
export const educationSourceBasis = ['official-source','reviewed-public-source','internal-analysis','expert-reviewed','pending-verification','fixture','draft'] as const

export type EducationAudience = (typeof educationAudience)[number]
export type EducationSensitivity = (typeof educationSensitivity)[number]
export type EducationPublicationState = (typeof educationPublicationStates)[number]
export type EducationSourceBasis = (typeof educationSourceBasis)[number]
