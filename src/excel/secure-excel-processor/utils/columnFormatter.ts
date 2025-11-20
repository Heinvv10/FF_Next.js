/**
 * Column Formatter Utility
 * Auto-fit column widths based on content
 */

import ExcelJS from 'exceljs';

/**
 * Auto-fit column width based on content sampling
 */
export function autoFitColumn<T = any>(
  column: ExcelJS.Column,
  header: string,
  data: T[],
  sampleSize: number = 100
): void {
  let maxLength = header.length;

  // Sample first N rows to determine column width
  const actualSampleSize = Math.min(sampleSize, data.length);
  for (let i = 0; i < actualSampleSize; i++) {
    const value = String((data[i] as any)[header] || '');
    maxLength = Math.max(maxLength, value.length);
  }

  // Set width with min/max constraints
  column.width = Math.min(Math.max(maxLength + 2, 10), 50);
}

/**
 * Trigger garbage collection if available
 */
export function triggerGarbageCollection(): void {
  if (global.gc) {
    global.gc();
  }
}
