/**
 * Excel Processor Template
 * Template code for Excel processing in Web Worker
 */

export function getExcelProcessingCode(): string {
  return `
    async function processExcelInWorker(file, options, id) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
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
              memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, peakUsage: 0 },
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
