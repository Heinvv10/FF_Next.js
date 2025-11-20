/**
 * Lodash Replacement Utilities
 * High-performance, tree-shakeable replacements for common lodash functions
 * Eliminates security vulnerabilities and reduces bundle size
 */

// Timing utilities
export { debounce, throttle } from './timing';

// Object utilities
export { cloneDeep, isEqual, pick, omit, merge } from './objects';

// Array utilities
export { flatten, flattenDeep, uniq, uniqBy, chunk, groupBy, keyBy } from './arrays';

// Performance tracking
export { LodashReplacementMetrics } from './metrics';

// Import for tracked versions and default export
import { debounce, throttle } from './timing';
import { cloneDeep, isEqual, pick, omit, merge } from './objects';
import { flatten, flattenDeep, uniq, uniqBy, chunk, groupBy, keyBy } from './arrays';
import { LodashReplacementMetrics } from './metrics';

// Export performance-tracked versions
export const trackedDebounce = LodashReplacementMetrics.trackPerformance('debounce', debounce);
export const trackedThrottle = LodashReplacementMetrics.trackPerformance('throttle', throttle);
export const trackedCloneDeep = LodashReplacementMetrics.trackPerformance('cloneDeep', cloneDeep);
export const trackedIsEqual = LodashReplacementMetrics.trackPerformance('isEqual', isEqual);

// Default export for easy replacement
export default {
  debounce,
  throttle,
  cloneDeep,
  isEqual,
  pick,
  omit,
  merge,
  flatten,
  flattenDeep,
  uniq,
  uniqBy,
  chunk,
  groupBy,
  keyBy,
  // Tracked versions
  trackedDebounce,
  trackedThrottle,
  trackedCloneDeep,
  trackedIsEqual,
  // Metrics
  LodashReplacementMetrics
};
