type Parser<T> = { parse(value: unknown, path?: string): T; optional(): Parser<T | undefined> }

function parser<T>(parseFn: (value: unknown, path: string) => T): Parser<T> {
  return {
    parse: (value, path = 'value') => parseFn(value, path),
    optional() {
      return parser<T | undefined>((value, path) => (value === undefined ? undefined : parseFn(value, path)))
    }
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export const z = {
  string: () => {
    const base = parser<string>((value, path) => {
      assert(typeof value === 'string', `${path} must be a string`)
      return value
    })
    return Object.assign(base, {
      min(length: number) {
        return parser<string>((value, path) => {
          const parsed = base.parse(value, path)
          assert(parsed.length >= length, `${path} must contain at least ${length} character(s)`)
          return parsed
        })
      }
    })
  },
  number: () => {
    const base = parser<number>((value, path) => {
      assert(typeof value === 'number' && Number.isFinite(value), `${path} must be a finite number`)
      return value
    })
    return Object.assign(base, {
      min(minimum: number) {
        return Object.assign(
          parser<number>((value, path) => {
            const parsed = base.parse(value, path)
            assert(parsed >= minimum, `${path} must be >= ${minimum}`)
            return parsed
          }),
          {
            max: (maximum: number) =>
              parser<number>((value, path) => {
                const parsed = base.parse(value, path)
                assert(parsed >= minimum && parsed <= maximum, `${path} must be between ${minimum} and ${maximum}`)
                return parsed
              })
          }
        )
      }
    })
  },
  enum: <T extends readonly [string, ...string[]]>(values: T) =>
    parser<T[number]>((value, path) => {
      assert(typeof value === 'string' && values.includes(value), `${path} must be one of ${values.join(', ')}`)
      return value as T[number]
    }),
  array: <T>(item: Parser<T>) => {
    const base = parser<T[]>((value, path) => {
      assert(Array.isArray(value), `${path} must be an array`)
      return value.map((entry, index) => item.parse(entry, `${path}[${index}]`))
    })
    return Object.assign(base, {
      min(length: number) {
        return parser<T[]>((value, path) => {
          const parsed = base.parse(value, path)
          assert(parsed.length >= length, `${path} must contain at least ${length} item(s)`)
          return parsed
        })
      }
    })
  },
  object: <Shape extends Record<string, Parser<unknown>>>(shape: Shape) =>
    parser<{ [K in keyof Shape]: ReturnType<Shape[K]['parse']> }>((value, path) => {
      assert(value !== null && typeof value === 'object' && !Array.isArray(value), `${path} must be an object`)
      const input = value as Record<string, unknown>
      const output: Record<string, unknown> = {}
      for (const [key, item] of Object.entries(shape)) {
        output[key] = item.parse(input[key], `${path}.${key}`)
      }
      return output as { [K in keyof Shape]: ReturnType<Shape[K]['parse']> }
    })
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

export const PublicCountryIntelligenceFixtureSchema = z.object({
  slug: z.string().min(1),
  country: z.string().min(1),
  region: z.string().min(1),
  statusLabel: z.string().min(1),
  pathways: z.array(MarketPathwaySchema).min(1),
  publicSummary: z.string().min(1),
  opportunityCategories: z.array(z.string().min(1)),
  tradeRole: z.array(z.string().min(1)),
  regulatorLabel: z.string().min(1).optional(),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
  reviewStatus: ReviewStatusSchema,
  sourcePrototype: z.enum([
    'harbourview_unified_v4_compact_top.html',
    'harbourview_v8_clean_map.html',
    'harbourview_global_cannabis_guidebook_v2_2026.html',
    'Signals - Cannabis Policy South America.html'
  ])
})

export const PublicCountryIntelligenceFixturesSchema = z.array(PublicCountryIntelligenceFixtureSchema)
