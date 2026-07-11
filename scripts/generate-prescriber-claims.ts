// scripts/generate-prescriber-claims.ts
// Generates structured prescriber intelligence claims using Gemini Flash.
// Replaces prior OpenAI/Anthropic implementation — uses GOOGLE_API_KEY.
// Run: npx ts-node scripts/generate-prescriber-claims.ts

import 'dotenv/config'

const GEMINI_MODEL = 'gemini-2.5-flash'
const API_KEY = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY

if (!API_KEY) {
  console.error('GOOGLE_API_KEY or GEMINI_API_KEY required')
  process.exit(1)
}

interface PrescriberClaim {
  claim_type: string
  claim_text: string
  confidence: number
  jurisdiction: string
  source_type: string
}

async function generatePrescriberClaims(
  prescriberName: string,
  context: string,
): Promise<PrescriberClaim[]> {
  const prompt = `You are a cannabis intelligence analyst extracting structured claims about medical cannabis prescribers.

Given the following information about a prescriber, extract structured intelligence claims.

Prescriber: ${prescriberName}
Context: ${context}

Return a JSON array of claims. Each claim must have:
- claim_type: one of "prescribing_pattern", "specialty", "jurisdiction", "institution", "research", "advocacy"
- claim_text: a single factual sentence (max 200 chars)
- confidence: integer 0-100 based on how explicitly stated this is
- jurisdiction: ISO-2 country code or "GLOBAL"
- source_type: "inferred" | "explicit"

Return ONLY valid JSON array, no markdown, no explanation.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature:     0.1,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${await res.text()}`)

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'

  try {
    return JSON.parse(text) as PrescriberClaim[]
  } catch {
    console.warn('Failed to parse Gemini response as JSON:', text.slice(0, 200))
    return []
  }
}

// ── Example usage ─────────────────────────────────────────────────────────────
async function main() {
  const examples = [
    {
      name:    'Dr. Jane Smith',
      context: 'Geriatric specialist at Toronto General Hospital. Published 3 papers on cannabis for chronic pain management in elderly patients. Licensed in Ontario.',
    },
    {
      name:    'Dr. Marcus Weber',
      context: 'Neurologist at Charité Berlin. Prescribes cannabis-based medicines under German BtMG regulations. Focuses on MS and neuropathic pain.',
    },
  ]

  for (const ex of examples) {
    console.log(`\nGenerating claims for: ${ex.name}`)
    const claims = await generatePrescriberClaims(ex.name, ex.context)
    console.log(JSON.stringify(claims, null, 2))
  }
}

main().catch(console.error)
