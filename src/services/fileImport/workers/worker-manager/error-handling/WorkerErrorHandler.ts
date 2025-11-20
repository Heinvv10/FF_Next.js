/**
 * Worker Error Handler
 * Handles worker errors and cleanup
 */

import { log } from '@/lib/logger';

export class WorkerErrorHandler {
  /**
   * Handle worker error
   * Logs error and returns cleanup actions needed
   */
  public static handleError(worker: Worker, error: ErrorEvent): void {
    log.error('Worker error:', { data: error }, 'WorkerManager');
  }

  /**
   * Log worker termination
   */
  public static logTermination(workerId: string): void {
    log.info(`Worker ${workerId} terminated`, {}, 'WorkerManager');
  }
}
