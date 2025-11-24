/**
 * CSV Processor Template
 * Template code for CSV processing in Web Worker
 */

export function getCSVProcessingCode(): string {
  return `
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
                processedRows: Math.floor(results.meta.cursor / 50),
                totalRows: Math.ceil(file.size / 50),
                percentage: Math.min((results.meta.cursor / file.size) * 100, 100),
                estimatedTimeRemaining: 0,
                currentPhase: 'parsing',
                bytesProcessed: results.meta.cursor,
                totalBytes: file.size,
                memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, peakUsage: 0 }
              };

              self.postMessage({ id, type: 'progress', payload: progress, timestamp: new Date() });
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
                detectedFormat: { delimiter: results.meta.delimiter, hasHeaders: true },
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
              memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, peakUsage: 0 },
              rowsProcessed: results.data.length,
              rowsSkipped: 0,
              isPartial: false,
              strategy: 'worker'
            });
          },
          error: (error) => { reject(new Error('CSV parsing failed: ' + error.message)); }
        });
      });
    }
  `;
}
