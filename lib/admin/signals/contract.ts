import { z } from 'zod'

export const adminSignalKindSchema = z.enum(['engine', 'regulatory'])
export const adminSignalBatchActionSchema = z.enum(['approve', 'reject'])

export const adminSignalBatchRequestSchema = z.object({
  kind: adminSignalKindSchema,
  action: adminSignalBatchActionSchema,
  ids: z.array(z.string().min(1)).min(1).max(100).transform((ids) => Array.from(new Set(ids))),
  dryRun: z.boolean().optional().default(false),
  idempotencyKey: z.string().min(8).max(160),
})

export type AdminSignalKind = z.infer<typeof adminSignalKindSchema>
export type AdminSignalBatchAction = z.infer<typeof adminSignalBatchActionSchema>
export type AdminSignalBatchRequest = z.infer<typeof adminSignalBatchRequestSchema>

export type AdminSignalBatchItemResult = {
  id: string
  ok: boolean
  resultingState?: string
  errorCode?: string
  message?: string
}

export type AdminSignalBatchResult = {
  kind: AdminSignalKind
  action: AdminSignalBatchAction
  dryRun: boolean
  idempotencyKey: string
  requested: number
  succeeded: number
  failed: number
  skipped: number
  results: AdminSignalBatchItemResult[]
}
