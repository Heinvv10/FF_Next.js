/**
 * Component Optimization Utilities
 * Story 3.3: Frontend Performance Optimization
 *
 * React performance optimization helpers
 * Modularized for better organization and maintainability
 */

// Memoization utilities
export { deepMemo, shallowMemo } from './memoization';

// Callback utilities
export {
  useStableCallback,
  useDebouncedCallback,
  useThrottledCallback
} from './callbacks';

// State utilities
export {
  useComputedValue,
  usePrevious,
  useChanged,
  useLazyInit
} from './state';

// List optimization
export {
  OptimizedList,
  useVirtualization
} from './list-optimization';

// Lazy loading
export {
  useIntersectionObserver,
  LazyImage
} from './lazy-loading';

// Performance monitoring
export {
  withPerformanceMonitor,
  useRenderCount,
  useWhyDidYouUpdate
} from './performance-monitoring';

// Re-export React's optimization hooks for convenience
export { memo, useMemo, useCallback } from 'react';
