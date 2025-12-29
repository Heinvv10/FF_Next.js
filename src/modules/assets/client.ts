/**
 * Asset Module - Client-Side Exports
 *
 * This file exports only client-safe code (no database access, no server-only utils).
 * Use this for React components and hooks.
 *
 * Exports:
 * - Types (safe for client)
 * - Constants (safe for client)
 * - Components (React components)
 * - Hooks (React Query hooks)
 *
 * Does NOT export:
 * - Services (contain database code)
 * - Utils (contains db.ts)
 */

// Types - client safe
export * from './types';

// Constants - client safe
export * from './constants';

// Components - client safe
// Uncomment when implemented:
// export * from './components';

// Hooks - client safe (uses API routes, not direct DB)
// Uncomment when implemented:
// export * from './hooks';
