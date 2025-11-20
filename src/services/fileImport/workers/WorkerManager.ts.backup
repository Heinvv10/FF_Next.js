/**
 * Web Worker Manager
 * Manages lifecycle and communication with file processing Web Workers
 */

import type { WorkerMessage, WorkerResponse } from '../types';
import { log } from '@/lib/logger';

export class WorkerManager {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private busyWorkers: Set<Worker> = new Set();
  private readonly maxWorkers: number = Math.max(2, Math.floor(navigator.hardwareConcurrency / 2));
  private messageHandlers: Map<string, (response: WorkerResponse) => void> = new Map();

  constructor() {
    this.initializeWorkers();
  }

  /**
   * Initialize Web Workers pool
   */
  private initializeWorkers(): void {
    // For now, we'll create workers on-demand to avoid bundling issues
    // In a production setup, you'd want to pre-create the worker pool
  }

  /**
   * Get available worker or create new one
   */
  public async getWorker(): Promise<Worker> {
    // Check for available worker
    if (this.availableWorkers.length > 0) {
      const worker = this.availableWorkers.pop()!;
      this.busyWorkers.add(worker);
      return worker;
    }

    // Create new worker if under limit
    if (this.workers.length < this.maxWorkers) {
      const worker = await this.createWorker();
      this.workers.push(worker);
      this.busyWorkers.add(worker);
      return worker;
    }

    // Wait for worker to become available
    return this.waitForAvailableWorker();
  }

  /**
   * Create new Web Worker
   */
  private async createWorker(): Promise<Worker> {
    // Create worker from blob to avoid bundling issues
    const workerCode = this.getWorkerCode();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    const worker = new Worker(workerUrl);
    
    // Set up message handling
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const handler = this.messageHandlers.get(response.id);
      if (handler) {
        handler(response);
      }
    };

    worker.onerror = (error: ErrorEvent) => {
      log.error('Worker error:', { data: error }, 'WorkerManager');
      this.handleWorkerError(worker, error);
    };

    return worker;
  }

  /**
   * Get Web Worker code as string
   */
  private getWorkerCode(): string {
    return `
      // File Processing Web Worker
      import Papa from 'papaparse';
      
      let isProcessing = false;
      
      self.onmessage = async function(event) {
        const { id, type, payload } = event.data;
        
        try {
          switch (type) {
            case 'process':
              if (isProcessing) {
                self.postMessage({
                  id,
                  type: 'error',
                  payload: { message: 'Worker is busy' },
                  timestamp: new Date()
                });
                return;
              }
              
              isProcessing = true;
              await processFile(id, payload);
              isProcessing = false;
              break;
              
            case 'cancel':
              isProcessing = false;
              self.postMessage({
                id,
                type: 'complete',
                timestamp: new Date()
              });
              break;
          }
        } catch (error) {
          isProcessing = false;
          self.postMessage({
            id,
            type: 'error',
            payload: { message: error.message },
            timestamp: new Date()
          });
        }
      };
      
      async function processFile(id, { file, config, context }) {
        const { type } = config;
        
        try {
          let result;
          
          if (type === 'csv') {
            result = await processCSVInWorker(file, config.options, id);
          } else if (type === 'xlsx' || type === 'xls') {
            result = await processExcelInWorker(file, config.options, id);
          } else {
            throw new Error('Unsupported file type in worker');
          }
          
          self.postMessage({
            id,
            type: 'result',
            payload: result,
            timestamp: new Date()
          });
          
        } catch (error) {
          self.postMessage({
            id,
            type: 'error',
            payload: { message: error.message },
            timestamp: new Date()
          });
        }
      }
      
      async function processCSVInWorker(file, options, id) {
        return new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            encoding: options.encoding || 'UTF-8',
            delimiter: options.delimiter || '',
            skipEmptyLines: options.skipEmptyLines ?? true,
            dynamicTyping: options.dynamicTyping ?? true,
            step: (results, parser) => {
              // Send progress updates
              if (results.meta.cursor) {
                const progress = {
                  processedRows: Math.floor(results.meta.cursor / 50), // Rough estimate
                  totalRows: Math.ceil(file.size / 50),
                  percentage: Math.min((results.meta.cursor / file.size) * 100, 100),
                  estimatedTimeRemaining: 0,
                  currentPhase: 'parsing',
                  bytesProcessed: results.meta.cursor,
                  totalBytes: file.size,
                  memoryUsage: {
                    heapUsed: 0,
                    heapTotal: 0,
                    external: 0,
                    peakUsage: 0
                  }
                };
                
                self.postMessage({
                  id,
                  type: 'progress',
                  payload: progress,
                  timestamp: new Date()
                });
              }
            },
            complete: (results) => {
              resolve({
                data: results.data,
                metadata: {
                  filename: file.name,
                  size: file.size,
                  type: 'csv',
                  rowCount: results.data.length,
                  columnCount: results.meta.fields?.length || 0,
                  headers: results.meta.fields || [],
                  detectedFormat: {
                    delimiter: results.meta.delimiter,
                    hasHeaders: true
                  },
                  processingStartTime: new Date(),
                  processingEndTime: new Date()
                },
                errors: results.errors.map(error => ({
                  type: 'parsing',
                  severity: 'medium',
                  message: error.message,
                  row: error.row,
                  code: error.code,
                  timestamp: new Date(),
                  recoverable: true
                })),
                warnings: [],
                processingTime: 0,
                memoryUsage: {
                  heapUsed: 0,
                  heapTotal: 0,
                  external: 0,
                  peakUsage: 0
                },
                rowsProcessed: results.data.length,
                rowsSkipped: 0,
                isPartial: false,
                strategy: 'worker'
              });
            },
            error: (error) => {
              reject(new Error('CSV parsing failed: ' + error.message));
            }
          });
        });
      }
      
      async function processExcelInWorker(file, options, id) {
        // For Excel processing in worker, we'd need to include XLSX library
        // This is a simplified version - in production you'd include the full XLSX processing
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = (e) => {
            try {
              // Mock Excel processing result
              resolve({
                data: [],
                metadata: {
                  filename: file.name,
                  size: file.size,
                  type: 'xlsx',
                  rowCount: 0,
                  columnCount: 0,
                  headers: [],
                  sheets: [],
                  activeSheet: '',
                  formulas: 0,
                  images: 0,
                  charts: 0,
                  processingStartTime: new Date(),
                  processingEndTime: new Date()
                },
                errors: [],
                warnings: [],
                processingTime: 0,
                memoryUsage: {
                  heapUsed: 0,
                  heapTotal: 0,
                  external: 0,
                  peakUsage: 0
                },
                rowsProcessed: 0,
                rowsSkipped: 0,
                isPartial: false,
                strategy: 'worker'
              });
            } catch (error) {
              reject(error);
            }
          };
          
          reader.onerror = () => reject(new Error('Failed to read Excel file'));
          reader.readAsArrayBuffer(file);
        });
      }
    `;
  }

  /**
   * Release worker back to available pool
   */
  public releaseWorker(worker: Worker): void {
    if (this.busyWorkers.has(worker)) {
      this.busyWorkers.delete(worker);
      this.availableWorkers.push(worker);
    }
  }

  /**
   * Wait for available worker
   */
  private async waitForAvailableWorker(): Promise<Worker> {
    return new Promise((resolve) => {
      const checkForWorker = () => {
        if (this.availableWorkers.length > 0) {
          const worker = this.availableWorkers.pop()!;
          this.busyWorkers.add(worker);
          resolve(worker);
        } else {
          setTimeout(checkForWorker, 100);
        }
      };
      checkForWorker();
    });
  }

  /**
   * Send message to worker
   */
  public sendMessage(
    worker: Worker,
    message: WorkerMessage,
    handler: (response: WorkerResponse) => void
  ): void {
    this.messageHandlers.set(message.id, handler);
    worker.postMessage(message);
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(worker: Worker, error: ErrorEvent): void {
    log.error('Worker error:', { data: error }, 'WorkerManager');
    
    // Remove from all collections
    this.busyWorkers.delete(worker);
    const availableIndex = this.availableWorkers.indexOf(worker);
    if (availableIndex > -1) {
      this.availableWorkers.splice(availableIndex, 1);
    }
    
    const workerIndex = this.workers.indexOf(worker);
    if (workerIndex > -1) {
      this.workers.splice(workerIndex, 1);
    }
    
    // Terminate worker
    worker.terminate();
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
    return {
      total: this.workers.length,
      available: this.availableWorkers.length,
      busy: this.busyWorkers.size,
      maxWorkers: this.maxWorkers
    };
  }

  /**
   * Shutdown all workers
   */
  public async shutdown(): Promise<void> {
    // Clear message handlers
    this.messageHandlers.clear();
    
    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }
    
    // Clear collections
    this.workers.length = 0;
    this.availableWorkers.length = 0;
    this.busyWorkers.clear();
  }
}