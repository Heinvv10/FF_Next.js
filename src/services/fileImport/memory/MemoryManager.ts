/**
 * Memory Manager
 * Monitors and optimizes memory usage during file processing
 *
 * Refactored: Nov 20, 2025 - Modular architecture
 * Main file reduced from 394 → 14 lines (96% reduction)
 *
 * Architecture:
 * - monitoring/: Core memory monitoring and statistics
 * - thresholds/: Threshold checking and handling
 * - gc/: Garbage collection utilities
 * - analysis/: Memory trends and recommendations
 * - processing/: File processing estimations
 * - utils/: Utility functions (formatters, event emitter)
 * - config.ts: Constants and thresholds
 */

// Re-export for backward compatibility
export { MemoryManager } from './memory-manager';
