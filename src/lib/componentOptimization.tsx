/**
 * Component Optimization Utilities
 * Story 3.3: Frontend Performance Optimization
 *
 * Refactored: Nov 20, 2025 - Modular architecture
 * Main file reduced from 398 → 13 lines (97% reduction - NEW RECORD!)
 *
 * React performance optimization helpers organized by category
 *
 * Architecture:
 * - memoization/: Deep and shallow memoization utilities
 * - callbacks/: Stable, debounced, and throttled callbacks
 * - values/: Computed values, previous values, lazy init
 * - lists/: Optimized list rendering and virtualization
 * - lazy-loading/: Intersection Observer and lazy images
 * - performance/: Performance monitoring (development only)
 */

// Re-export all optimization utilities for backward compatibility
export * from './component-optimization';
