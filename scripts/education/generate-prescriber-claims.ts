/**
 * Generates structured education_claims records for medical prescribers
 * using Claude Opus 4.8 with live web search for current regulatory content.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... npx ts-node scripts/education/generate-prescriber-claims.ts \
 *     --jurisdiction AU --claim-type drug_interaction_reference --dry-run
 *
 * Output: JSON file at scripts/education/output/<jurisdiction>-<claim-type>.json
 * Review the output before inserting to Supabase — all claims start at
 * review_pending / admin_only and require a human reviewer to publish.
 *
 * Batch mode (all jurisdictions in PRIORITY_JURISDICTIONS):
 *   ANTHROPIC_API_KEY=... npx ts-node scripts/education/generate-prescriber-claims.ts --batch
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'node:fs'
import path from 'node:path'

type ClaimType =
  | 'drug_interaction_reference'
  | 'dosage_reference'
  | 'clinical_workflow'

interface GeneratedClaim {
  claim_key: string
  claim_type: ClaimType
  claim_text: string
  public_safe_summary: string
  jurisdiction_scope: string[]
  audience_roles: string[]
  visibility: 'admin_only'
  evidence_grade: string
  review_status: 'review_pending'
  medical_risk_level: string
  freshness_window_days: number
  source_url?: string
  source_title?: string
  source_authority_tier?: number
  admin_notes: string
}

// Jurisdictions where medical cannabis prescribing is legal and actively regulated
const PRIORITY_JURISDICTIONS: Record<string, string> = {
  AU: 'Australia (TGA)',
  DE: 'Germany (BfArM)',
  NL: 'Netherlands (BPKK)',
  PT: 'Portugal (Infarmed)',
  CA: 'Canada (Health Canada)',
  UK: 'United Kingdom (MHRA)',
  IL: 'Israel (IMCA)',
  NZ: 'New Zealand (Medsafe)',
  IT: 'Italy (AIFA)',
  PL: 'Poland (URPL)',
  CZ: 'Czechia (SÚKL)',
  TH: 'Thailand (FDA Thailand)',
  ZA: 'South Africa (SAHPRA)',
  CO: 'Colombia (INVIMA)',
  CH: 'Switzerland (Swissmedic)',
}

const CLAIM_TYPE_PROMPTS: Record<ClaimType, string> = {
  drug_interaction_reference: `You are a clinical pharmacologist compiling drug interaction references for cannabis-based medicinal products for healthcare prescribers in ${'{jurisdiction}'}.

Search for the current official prescribing guidance, pharmacovigilance bulletins, and medical college guidelines for cannabis-drug interactions in ${'{jurisdiction}'}.

Extract 5-8 specific, evidence-backed drug interaction claims covering:
1. CYP450 enzyme interactions (CYP3A4, CYP2C9 inhibition/induction)
2. CNS depressant combinations (opioids, benzodiazepines, alcohol)
3. Anticoagulant interactions (warfarin, DOACs)
4. Cardiovascular interactions (antihypertensives, sympathomimetics)
5. Any jurisdiction-specific prescribing warnings from ${'{regulator}'}

For each interaction, include: drug class affected, mechanism, clinical significance, monitoring recommendation.`,

  dosage_reference: `You are a clinical pharmacist compiling dosage reference material for cannabis-based medicinal products for prescribers in ${'{jurisdiction}'}.

Search for the current official product monographs, formulary entries, and clinical dosing guidelines from ${'{regulator}'} for cannabis-based medicines.

Extract 5-8 jurisdiction-specific dosage reference claims covering:
1. Starting doses for opioid-naive patients
2. Titration schedules recommended by ${'{regulator}'}
3. Maximum daily doses for CBD and THC products
4. Route-specific dosing (oral, sublingual, inhaled, topical)
5. Special populations (elderly, hepatic/renal impairment)

Cite specific ${'{regulator}'} product information or formulary where available.`,

  clinical_workflow: `You are a clinical specialist compiling prescriber workflow guidance for cannabis-based medicinal products in ${'{jurisdiction}'}.

Search for the current prescribing pathway, patient eligibility criteria, and monitoring requirements from ${'{regulator}'} and relevant medical colleges in ${'{jurisdiction}'}.

Extract 5-8 clinical workflow claims covering:
1. Patient eligibility criteria and approved indications
2. Required prior treatments before cannabis prescribing
3. Prescriber authorisation requirements (specialist only vs GP)
4. Patient consent and documentation requirements
5. Monitoring and review intervals
6. Reporting requirements for adverse events`,
}

const STRUCTURED_OUTPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    claims: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        required: ['claim_key', 'claim_type', 'claim_text', 'public_safe_summary', 'evidence_grade', 'source_title', 'source_url', 'source_authority_tier', 'medical_risk_level', 'admin_notes'],
        properties: {
          claim_key: { type: 'string' as const, description: 'Unique slug e.g. AU-cyp3a4-cannabis-opioid-interaction' },
          claim_type: { type: 'string' as const },
          claim_text: { type: 'string' as const, description: 'Full clinical claim for professional audience, max 400 chars' },
          public_safe_summary: { type: 'string' as const, description: 'Lay-language summary safe for public display, max 200 chars' },
          evidence_grade: {
            type: 'string' as const,
            enum: ['A_primary_binding', 'B_primary_guidance', 'C_professional_guideline', 'D_peer_reviewed', 'E_quality_standard', 'F_secondary_context', 'G_discovery_only', 'X_conflict_or_unverified'],
          },
          source_title: { type: 'string' as const },
          source_url: { type: 'string' as const },
          source_authority_tier: { type: 'number' as const, description: '1=primary law, 2=regulator guidance, 3=professional college, 4=peer-reviewed, 5=secondary, 6=unverified' },
          medical_risk_level: { type: 'string' as const, enum: ['none', 'low', 'medium', 'high', 'critical'] },
          admin_notes: { type: 'string' as const, description: 'Notes for reviewer: what to verify, freshness risk, conflicts' },
        },
      },
    },
  },
  required: ['claims'],
}

async function generateClaims(
  client: Anthropic,
  jurisdiction: string,
  claimType: ClaimType,
): Promise<GeneratedClaim[]> {
  const jurisdictionName = PRIORITY_JURISDICTIONS[jurisdiction] || jurisdiction
  const regulator = jurisdictionName.match(/\(([^)]+)\)/)?.[1] || jurisdiction

  const prompt = CLAIM_TYPE_PROMPTS[claimType]
    .replace(/\$\{'{jurisdiction}'\}/g, jurisdictionName)
    .replace(/\$\{'{regulator}'\}/g, regulator)

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    tools: [
      { type: 'web_search_20260209', name: 'web_search' },
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: STRUCTURED_OUTPUT_SCHEMA,
      },
    },
    messages: [
      {
        role: 'user',
        content: `${prompt}

Return a JSON object with a "claims" array. Each claim must follow the output schema exactly.
All claims start as review_pending and admin_only — they require human clinical review before publication.
Only include claims you found clear source evidence for from ${regulator} or peer-reviewed literature.`,
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in response')
  }

  const parsed = JSON.parse(textBlock.text) as { claims: GeneratedClaim[] }

  return parsed.claims.map((c) => ({
    ...c,
    claim_type: claimType,
    jurisdiction_scope: [jurisdiction],
    audience_roles: ['doctor', 'pharmacist', 'clinic'],
    visibility: 'admin_only' as const,
    review_status: 'review_pending' as const,
    freshness_window_days: claimType === 'dosage_reference' ? 90 : 180,
  }))
}

async function main() {
  const args = process.argv.slice(2)
  const jurisdictionArg = args.find((a) => a.startsWith('--jurisdiction='))?.split('=')[1]
    || (args.indexOf('--jurisdiction') >= 0 ? args[args.indexOf('--jurisdiction') + 1] : undefined)
  const claimTypeArg = (args.find((a) => a.startsWith('--claim-type='))?.split('=')[1]
    || (args.indexOf('--claim-type') >= 0 ? args[args.indexOf('--claim-type') + 1] : undefined)) as ClaimType | undefined
  const dryRun = args.includes('--dry-run')
  const batch = args.includes('--batch')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY env var required')

  const client = new Anthropic({ apiKey })

  const outputDir = path.join(import.meta.dirname, 'output')
  fs.mkdirSync(outputDir, { recursive: true })

  const pairs: Array<{ jurisdiction: string; claimType: ClaimType }> = batch
    ? Object.keys(PRIORITY_JURISDICTIONS).flatMap((j) =>
        (['drug_interaction_reference', 'dosage_reference', 'clinical_workflow'] as ClaimType[]).map(
          (ct) => ({ jurisdiction: j, claimType: ct }),
        ),
      )
    : [{ jurisdiction: jurisdictionArg!, claimType: claimTypeArg! }]

  if (!batch && (!jurisdictionArg || !claimTypeArg)) {
    console.error('Usage: --jurisdiction <code> --claim-type <type> [--dry-run]')
    console.error('  or:  --batch')
    process.exit(1)
  }

  for (const { jurisdiction, claimType } of pairs) {
    console.log(`Generating ${claimType} claims for ${jurisdiction}...`)
    try {
      const claims = await generateClaims(client, jurisdiction, claimType)
      const outFile = path.join(outputDir, `${jurisdiction.toLowerCase()}-${claimType}.json`)

      if (dryRun) {
        console.log(JSON.stringify(claims, null, 2))
      } else {
        fs.writeFileSync(outFile, JSON.stringify(claims, null, 2))
        console.log(`  → ${claims.length} claims written to ${outFile}`)
      }
    } catch (err) {
      console.error(`  ERROR for ${jurisdiction}/${claimType}:`, err)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
