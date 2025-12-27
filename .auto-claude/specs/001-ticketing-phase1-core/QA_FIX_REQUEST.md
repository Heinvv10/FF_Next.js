QA Fix Request - vitest.config.ts missing JSX configuration
CRITICAL FIX REQUIRED: Add esbuild jsx config to vitest.config.ts
56 component tests failing - ReferenceError: React is not defined
Add: esbuild: { jsx: 'automatic' } to vitest.config.ts
Expected: All 1,251 tests passing after fix
