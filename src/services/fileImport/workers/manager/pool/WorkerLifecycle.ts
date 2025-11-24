/**
 * Worker Lifecycle
 * Handles worker creation and termination
 */

import { WorkerCodeGenerator } from '../code/WorkerCodeGenerator';

export class WorkerLifecycle {
  /**
   * Create new Web Worker
   */
  public static async createWorker(
    onMessage: (event: MessageEvent) => void,
    onError: (error: ErrorEvent) => void
  ): Promise<Worker> {
    // Generate worker code
    const workerCode = WorkerCodeGenerator.generateWorkerCode();

    // Create worker from blob to avoid bundling issues
    const worker = WorkerCodeGenerator.createWorkerFromCode(workerCode);

    // Set up message handling
    worker.onmessage = onMessage;
    worker.onerror = onError;

    return worker;
  }

  /**
   * Terminate worker
   */
  public static terminateWorker(worker: Worker): void {
    worker.terminate();
  }

  /**
   * Terminate multiple workers
   */
  public static terminateWorkers(workers: Worker[]): void {
    for (const worker of workers) {
      this.terminateWorker(worker);
    }
  }
}
