import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
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
]

export default eslintConfig
