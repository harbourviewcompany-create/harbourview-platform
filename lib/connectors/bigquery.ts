// lib/connectors/bigquery.ts
//
// Skeleton for Google Cloud BigQuery enrichment connector.
// Purpose: offload heavy signal analysis, joins, and enrichment jobs
// (embeddings re-scoring, cluster stats, commercial-impact overlays)
// from Supabase into BigQuery for scale.
//
// Typical flow:
//   1. Export recent/un-enriched signals to a staging GCS bucket or direct load.
//   2. Run SQL / scheduled queries in BigQuery.
//   3. Write results back into public.signals (quality_label, impact, etc.)
//      or a dedicated enrichment table that the promotion logic reads.
//
// Requires GOOGLE_APPLICATION_CREDENTIALS or Workload Identity + BIGQUERY_PROJECT.

import 'server-only'

export interface BigQueryEnrichmentJob {
  jobId: string
  status: 'pending' | 'running' | 'done' | 'failed'
  rowsProcessed?: number
  error?: string
}

export interface BigQueryClient {
  /** Kick off (or enqueue) an enrichment job for the given signal window. */
  runEnrichment(opts: { since: Date; limit?: number }): Promise<BigQueryEnrichmentJob>
  /** Poll job status. */
  getJob(jobId: string): Promise<BigQueryEnrichmentJob | null>
}

function isConfigured(): boolean {
  return Boolean(
    process.env.BIGQUERY_PROJECT?.trim() &&
      (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_SERVICE_ACCOUNT_JSON)
  )
}

export function createBigQueryClient(): BigQueryClient {
  if (!isConfigured()) {
    return {
      async runEnrichment() {
        console.info('bigquery: not configured — skipping enrichment job')
        return { jobId: 'noop', status: 'done', rowsProcessed: 0 }
      },
      async getJob() {
        return null
      },
    }
  }

  return {
    async runEnrichment(opts) {
      // TODO: use @google-cloud/bigquery to create a query job or load job.
      console.info(`bigquery: would run enrichment since ${opts.since.toISOString()}`)
      return {
        jobId: `bq-enrich-${Date.now()}`,
        status: 'pending',
      }
    },
    async getJob(jobId) {
      console.info(`bigquery: poll ${jobId}`)
      return { jobId, status: 'done' }
    },
  }
}
