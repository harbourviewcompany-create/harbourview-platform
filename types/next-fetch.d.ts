/**
 * Augment the standard fetch RequestInit so TypeScript accepts Next.js's
 * { next: { revalidate, tags } } extension without TS2353 errors.
 * Next.js itself declares this in its own types; this bridges the gap when
 * the project-level tsconfig does not resolve @types/node / next env types.
 */
interface RequestInit {
  next?: {
    revalidate?: number | false
    tags?: string[]
  }
}

/**
 * Augment JSX IntrinsicAttributes so that the React `key` special prop is
 * accepted on any element without triggering TS2322 when @types/react is not
 * visible to the project-level tsc invocation.
 */
declare namespace JSX {
  interface IntrinsicAttributes {
    key?: string | number | null | undefined
  }
}
