/**
 * Worker Manager Configuration
 * Constants and settings for Web Worker pool management
 */

/**
 * Calculate maximum number of workers based on hardware
 * Uses half of available CPU cores (minimum 2)
 */
export function getMaxWorkers(): number {
  if (typeof navigator === 'undefined' || !navigator.hardwareConcurrency) {
    return 2; // Default for SSR or unsupported environments
  }
  return Math.max(2, Math.floor(navigator.hardwareConcurrency / 2));
}

/**
 * Worker pool configuration
 */
export const WORKER_CONFIG = {
  /**
   * Polling interval when waiting for available worker (ms)
   */
  WORKER_POLL_INTERVAL: 100,

  /**
   * Minimum number of workers
   */
  MIN_WORKERS: 2
} as const;
