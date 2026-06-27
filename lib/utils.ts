export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

type CVAVariantMap = Record<string, Record<string, string>>
type CVAConfig = { variants?: CVAVariantMap; defaultVariants?: Record<string, string> }
type CVAInput<C extends CVAConfig> = {
  [K in keyof NonNullable<C['variants']>]?: keyof NonNullable<C['variants']>[K] | null
} & { className?: string }

export function cva<C extends CVAConfig>(base: string, config?: C) {
  return function(props?: CVAInput<C>): string {
    const { className, ...rest } = (props ?? {}) as Record<string, string | null | undefined>
    let cls = base
    if (config?.variants) {
      for (const [key, map] of Object.entries(config.variants)) {
        const val = rest[key] ?? config.defaultVariants?.[key]
        if (val != null && map[val as string]) cls += ' ' + map[val as string]
      }
    }
    return [cls, className].filter(Boolean).join(' ')
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariantProps<T extends (...args: any) => any> = NonNullable<Parameters<T>[0]>
