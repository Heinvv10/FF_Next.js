/**
 * Memory Manager Configuration
 * Constants and thresholds for memory monitoring
 */

export const MEMORY_CONFIG = {
  // Monitoring interval (ms)
  CHECK_INTERVAL: 5000,

  // History tracking
  MAX_HISTORY_LENGTH: 100,
  MIN_HISTORY_FOR_TREND: 5,
  RECENT_HISTORY_COUNT: 5,
  EMERGENCY_HISTORY_COUNT: 10,

  // Memory thresholds
  WARNING_THRESHOLD: 0.8,  // 80% of heap
  CRITICAL_THRESHOLD: 0.9, // 90% of heap
  PEAK_THRESHOLD: 0.95,    // 95% of heap

  // Trend detection
  STABLE_THRESHOLD: 0.05,  // 5% change considered stable

  // File processing multipliers
  FILE_MULTIPLIERS: {
    csv: 3,    // CSV typically expands 3x in memory
    xlsx: 5,   // Excel can expand 5x due to formatting
    xls: 4,    // Legacy Excel format
    json: 2    // JSON is relatively compact
  } as Record<string, number>,

  // Processing thresholds
  HIGH_MEMORY_THRESHOLD: 0.8,
  CANNOT_PROCESS_THRESHOLD: 1.2,

  // Garbage collection
  GC_PRESSURE_ITERATIONS: 10,
  GC_PRESSURE_ARRAY_SIZE: 100000
} as const;

export type MemoryConfig = typeof MEMORY_CONFIG;
