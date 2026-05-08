type Parser<T> = {
  parse(value: unknown, path?: string): T
  optional(): Parser<T | undefined>
}

class Schema<T> implements Parser<T> {
  constructor(private readonly parseValue: (value: unknown, path: string) => T) {}

  parse(value: unknown, path = 'value'): T {
    return this.parseValue(value, path)
  }

  optional(): Parser<T | undefined> {
    return new Schema<T | undefined>((value, path) => {
      if (value === undefined) return undefined
      return this.parse(value, path)
    })
  }
}

function fail(path: string, expected: string): never {
  throw new Error(`${path} expected ${expected}`)
}

function stringSchema() {
  const base = new Schema<string>((value, path) => {
    if (typeof value !== 'string') fail(path, 'string')
    return value
  })

  return Object.assign(base, {
    min(length: number) {
      return new Schema<string>((value, path) => {
        const parsed = base.parse(value, path)
        if (parsed.length < length) fail(path, `string length >= ${length}`)
        return parsed
      })
    }
  })
}

function numberSchema() {
  const checks: Array<(value: number, path: string) => void> = []
  const schema = new Schema<number>((value, path) => {
    if (typeof value !== 'number' || Number.isNaN(value)) fail(path, 'number')
    for (const check of checks) check(value, path)
    return value
  })

  return Object.assign(schema, {
    min(minimum: number) {
      checks.push((value, path) => {
        if (value < minimum) fail(path, `number >= ${minimum}`)
      })
      return this
    },
    max(maximum: number) {
      checks.push((value, path) => {
        if (value > maximum) fail(path, `number <= ${maximum}`)
      })
      return this
    }
  })
}

function enumSchema<const Values extends readonly [string, ...string[]]>(values: Values) {
  const allowed = new Set<string>(values)
  return new Schema<Values[number]>((value, path) => {
    if (typeof value !== 'string' || !allowed.has(value)) {
      fail(path, `one of ${values.join(', ')}`)
    }
    return value as Values[number]
  })
}

function arraySchema<T>(itemSchema: Parser<T>) {
  const checks: Array<(value: T[], path: string) => void> = []
  const schema = new Schema<T[]>((value, path) => {
    if (!Array.isArray(value)) fail(path, 'array')
    const parsed = value.map((item, index) => itemSchema.parse(item, `${path}[${index}]`))
    for (const check of checks) check(parsed, path)
    return parsed
  })

  return Object.assign(schema, {
    min(length: number) {
      checks.push((value, path) => {
        if (value.length < length) fail(path, `array length >= ${length}`)
      })
      return this
    }
  })
}

type Shape = Record<string, Parser<unknown>>
type ParsedShape<T extends Shape> = {
  [K in keyof T]: T[K] extends Parser<infer Value> ? Value : never
}

function objectSchema<T extends Shape>(shape: T) {
  let strict = false
  const schema = new Schema<ParsedShape<T>>((value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'object')
    const input = value as Record<string, unknown>
    const allowedKeys = new Set(Object.keys(shape))

    if (strict) {
      for (const key of Object.keys(input)) {
        if (!allowedKeys.has(key)) fail(`${path}.${key}`, 'known public field')
      }
    }

    const output: Record<string, unknown> = {}
    for (const [key, fieldSchema] of Object.entries(shape)) {
      const parsed = fieldSchema.parse(input[key], `${path}.${key}`)
      if (parsed !== undefined) output[key] = parsed
    }
    return output as ParsedShape<T>
  })

  return Object.assign(schema, {
    strict() {
      strict = true
      return this
    }
  })
}

const z = {
  string: stringSchema,
  number: numberSchema,
  enum: enumSchema,
  array: arraySchema,
  object: objectSchema
}

export const MarketPathwaySchema = z.enum([
  'medical',
  'adultUse',
  'industrialHemp',
  'decriminalized',
  'prohibited',
  'unknown'
])

export const ReviewStatusSchema = z.enum([
  'prototypeExtracted',
  'needsAnalystReview',
  'publicSafeSeed'
])

export const PublicCountryIntelligenceFixtureSchema = z
  .object({
    slug: z.string().min(1),
    country: z.string().min(1),
    region: z.string().min(1),
    statusLabel: z.string().min(1),
    pathways: z.array(MarketPathwaySchema).min(1),
    publicSummary: z.string().min(1),
    opportunityCategories: z.array(z.string().min(1)),
    tradeRole: z.array(z.string().min(1)),
    regulatorLabel: z.string().min(1).optional(),
    coordinates: z
      .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
      .strict()
      .optional(),
    reviewStatus: ReviewStatusSchema,
    sourcePrototype: z.enum([
      'harbourview_unified_v4_compact_top.html',
      'harbourview_v8_clean_map.html',
      'harbourview_global_cannabis_guidebook_v2_2026.html',
      'Signals - Cannabis Policy South America.html'
    ])
  })
  .strict()

export const PublicCountryIntelligenceFixturesSchema = z.array(PublicCountryIntelligenceFixtureSchema)
