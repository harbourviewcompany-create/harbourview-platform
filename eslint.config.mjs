import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  {
    // Separate sub-projects / generated output — not part of the root app lint.
    // node_modules and .claude use `**/` prefixes since nested copies exist
    // inside git worktrees (e.g. .claude/worktrees/*/node_modules), which a
    // root-only glob doesn't reach and which previously caused `eslint .` to
    // recurse into third-party library code and report thousands of false
    // positives.
    ignores: [
      'tools/**',
      '.next/**',
      '**/node_modules/**',
      'supabase/functions/**',
      '.claude/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Admin routes and internal lib files use `as any` to work around TypeScript's
    // inability to narrow AdminResult<T> generics past noreturn functions (redirect).
    // These are internal-only paths — no public API surface is affected.
    files: [
      'app/actions/**/*.ts',
      'app/admin/**/*.ts',
      'app/admin/**/*.tsx',
      'app/api/admin/**/*.ts',
      'app/api/marketplace/listing-submission/route.ts',
      'lib/marketplace/candidates.ts',
      'lib/marketplace/liveSources.ts',
      'lib/regulatory-signals/admin.ts',
      'lib/regulatory-signals/evidence.ts',
      'lib/intelligence-automation/db.ts',
      'lib/network/serverAccess.ts',
      'lib/supabase/adminDataClient.ts',
      'lib/supabase/server.ts',
      'lib/supabase/serviceCandidatesAdmin.ts',
      'lib/auth/adminGuard.ts',
      'components/harbourview/MobileCountrySelection.tsx',
      'components/dashboard/HarbourviewDashboard.tsx',
      'components/globe/GlobeSameScreenRouterLanding.tsx',
      'components/globe/r3f/CameraFlyToController.tsx',
      'lib/dashboard/countries.ts',
      'app/api/marketplace/capture/route.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    // Build scripts, design-token tooling, e2e specs and Playwright config use
    // require() and are plain Node scripts — not part of the app bundle.
    files: [
      '*.config.js',
      'scripts/**/*.js',
      'scripts/**/*.ts',
      'style-dictionary.config.js',
      'playwright.config.js',
      'tests/e2e/**/*.js',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Intelligence-engine internals + tests: `any` is used at untyped queue/
    // worker boundaries, consistent with the existing lib exemptions above.
    files: [
      'lib/intelligence-engine/**/*.ts',
      'lib/intelligence/**/*.ts',
      'lib/hf/**/*.ts',
      'tests/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // shadcn/ui primitives: empty interfaces extending a base props type is the
    // upstream shadcn pattern (kept for forward-compatible prop extension).
    files: ['components/ui/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    // eslint-config-next 16 ships the React Compiler's stricter react-hooks rules
    // (set-state-in-effect, refs, purity, immutability). They flag many existing,
    // working patterns across the globe + dashboard. Surfaced as warnings so they
    // remain visible and can be resolved deliberately per-component, rather than
    // hard-failing CI or forcing a blind mass rewrite of correct code.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
]

export default eslintConfig
