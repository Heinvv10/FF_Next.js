/**
 * Worker Code Template
 * Generates the Web Worker code as a string for blob creation
 */

/**
 * Get Web Worker code as string
 * This code will run inside the Web Worker context
 */
export function getWorkerCode(): string {
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
