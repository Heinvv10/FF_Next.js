/**
 * Component Optimization Utilities - Modular Architecture
 * React performance optimization helpers organized by category
 *
 * Modules:
 * - memoization: Deep and shallow memoization
 * - callbacks: Stable, debounced, and throttled callbacks
 * - values: Computed values, previous values, lazy init
 * - lists: Optimized list rendering and virtualization
 * - lazy-loading: Intersection Observer and lazy images
 * - performance: Performance monitoring (development only)
 */

// Memoization utilities
export * from './memoization';

// Callback optimization hooks
export * from './callbacks';

// Value optimization hooks
export * from './values';

// List optimization
export * from './lists';

// Lazy loading utilities
export * from './lazy-loading';

// Performance monitoring (development only)
export * from './performance';

// Re-export React's optimization hooks for convenience
export { memo, useMemo, useCallback } from 'react';
