/**
 * Worker Code Generator
 * Generates the Web Worker script code
 */

import { getCSVProcessingCode } from './templates/CSVProcessorTemplate';
import { getExcelProcessingCode } from './templates/ExcelProcessorTemplate';

export class WorkerCodeGenerator {
  /**
   * Generate complete worker code as string
   */
  public static generateWorkerCode(): string {
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

      ${this.getFileProcessingCode()}
      ${getCSVProcessingCode()}
      ${getExcelProcessingCode()}
    `;
  }

  /**
   * File processing dispatcher code
   */
  private static getFileProcessingCode(): string {
    return `
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
    `;
  }

  /**
   * Create worker from blob
   */
  public static createWorkerFromCode(code: string): Worker {
    const blob = new Blob([code], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    return new Worker(workerUrl);
  }
}
