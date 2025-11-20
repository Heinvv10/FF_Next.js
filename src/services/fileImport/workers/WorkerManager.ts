/**
 * Web Worker Manager
 * Manages lifecycle and communication with file processing Web Workers
 *
 * Refactored: Nov 20, 2025 - Modular architecture
 * Main file reduced from 390 → 18 lines (95% reduction)
 *
 * Architecture:
 * - config.ts: Worker configuration and max workers calculation
 * - worker-code/: Worker code template (extracted 232-line inline string)
 * - pool/: Worker pool management (availability, allocation)
 * - lifecycle/: Worker creation and termination
 * - messaging/: Message routing and callbacks
 * - error-handling/: Error handling and cleanup
 * - index.ts: Main orchestrator combining all modules
 */

// Re-export for backward compatibility
export { WorkerManager } from './worker-manager';
