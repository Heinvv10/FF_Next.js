/**
 * Web Worker Manager
 * Manages lifecycle and communication with file processing Web Workers
 *
 * This is the main coordinator class that delegates to specialized modules
 */

import type { WorkerMessage, WorkerResponse } from '../types';
import {
  WorkerPool,
  WorkerLifecycle,
  MessageHandler,
  WorkerMessenger,
  WorkerErrorHandler
} from './manager';

export class WorkerManager {
  // Module instances
  private workerPool: WorkerPool;
  private messageHandler: MessageHandler;
  private messenger: WorkerMessenger;
  private errorHandler: WorkerErrorHandler;

  constructor(maxWorkers?: number) {
    // Initialize all modules
    this.workerPool = new WorkerPool(maxWorkers);
    this.messageHandler = new MessageHandler();
    this.messenger = new WorkerMessenger(this.messageHandler);
    this.errorHandler = new WorkerErrorHandler(this.workerPool);
  }

  /**
   * Get available worker or create new one
   */
  public async getWorker(): Promise<Worker> {
    // Check for available worker
    const availableWorker = this.workerPool.getAvailableWorker();
    if (availableWorker) {
      return availableWorker;
    }

    // Create new worker if under limit
    if (this.workerPool.canCreateMore()) {
      const worker = await this.createWorker();
      this.workerPool.addWorker(worker);
      return worker;
    }

    // Wait for worker to become available
    return this.workerPool.waitForAvailableWorker();
  }

  /**
   * Create new Web Worker
   */
  private async createWorker(): Promise<Worker> {
    const worker = await WorkerLifecycle.createWorker(
      (event) => this.messageHandler.handleMessage(event),
      (error) => this.errorHandler.handleError(worker, error)
    );

    return worker;
  }

  /**
   * Release worker back to available pool
   */
  public releaseWorker(worker: Worker): void {
    this.workerPool.releaseWorker(worker);
  }

  /**
   * Send message to worker
   */
  public sendMessage(
    worker: Worker,
    message: WorkerMessage,
    handler: (response: WorkerResponse) => void
  ): void {
    this.messenger.sendMessage(worker, message, handler);
  }

  /**
   * Get worker pool status
   */
  public getStatus(): {
    total: number;
    available: number;
    busy: number;
    maxWorkers: number;
  } {
    return this.workerPool.getStatus();
  }

  /**
   * Shutdown all workers
   */
  public async shutdown(): Promise<void> {
    // Clear message handlers
    this.messageHandler.clearHandlers();

    // Get all workers and terminate them
    const workers = this.workerPool.getAllWorkers();
    WorkerLifecycle.terminateWorkers(workers);

    // Clear pool
    this.workerPool.clear();
  }
}
