/**
 * Excel Reader
 * Reads and processes Excel files with streaming support
 */

import ExcelJS from 'exceljs';
import { log } from '@/lib/logger';
import { ExcelReadResult, SecureExcelOptions, ExcelError } from '../types/secureExcel.types';
import { CHUNK_SIZE, DEFAULT_LIMITS } from '../config/limits';
import { validateFileSize } from '../validators/fileValidator';
import { sanitizeCellValue } from '../validators/cellValidator';
import { validateWorkbookHasWorksheets, validateWorksheetDimensions } from '../validators/worksheetValidator';
import { triggerGarbageCollection } from '../utils/columnFormatter';

/**
 * Read Excel file with streaming support for better performance
 */
export async function readExcelFile<T = any>(
  buffer: ArrayBuffer,
  options: SecureExcelOptions = {}
): Promise<ExcelReadResult<T>> {
  const startTime = performance.now();
  const initialMemory = process.memoryUsage?.()?.heapUsed || 0;

  const {
    maxFileSize = DEFAULT_LIMITS.maxFileSize,
    maxRows = DEFAULT_LIMITS.maxRows,
    maxColumns = DEFAULT_LIMITS.maxColumns,
    maxCellLength = DEFAULT_LIMITS.maxCellLength,
    allowFormulas = false,
    allowHTML = false,
    chunkSize = CHUNK_SIZE,
    useStreaming = true,
  } = options;

  try {
    // Security validation
    validateFileSize(buffer, maxFileSize);

    // Create and load workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    validateWorkbookHasWorksheets(workbook);

    // Use first worksheet
    const worksheet = workbook.worksheets[0];
    const worksheetName = worksheet.name;

    // Validate worksheet dimensions
    validateWorksheetDimensions(worksheet, maxRows, maxColumns);

    const data: T[] = [];
    const errors: ExcelError[] = [];

    // Get headers from first row
    const headers = extractHeaders(worksheet, maxCellLength, allowHTML, errors);

    // Process data rows
    if (useStreaming && worksheet.rowCount > chunkSize) {
      processStreamingRows(worksheet, headers, data, errors, {
        maxCellLength,
        allowFormulas,
        allowHTML,
        chunkSize,
      });
    } else {
      processStandardRows(worksheet, headers, data, errors, {
        maxCellLength,
        allowFormulas,
        allowHTML,
      });
    }

    const endTime = performance.now();
    const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
    const processingTime = Math.round(endTime - startTime);
    const memoryUsed = Math.max(0, finalMemory - initialMemory);

    log.info(
      'Excel file processed successfully',
      {
        rows: data.length,
        errors: errors.length,
        processingTime,
        memoryUsed: Math.round(memoryUsed / 1024),
        useStreaming,
      },
      'secure-excel'
    );

    return {
      data,
      errors,
      metadata: {
        totalRows: worksheet.rowCount,
        totalColumns: worksheet.columnCount,
        worksheetName,
        processingTime,
        memoryUsed,
      },
    };
  } catch (error) {
    log.error('Excel processing failed:', { data: error }, 'secure-excel');
    throw new Error(
      `Excel processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract headers from first row
 */
function extractHeaders(
  worksheet: ExcelJS.Worksheet,
  maxCellLength: number,
  allowHTML: boolean,
  errors: ExcelError[]
): string[] {
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];

  headerRow.eachCell((cell, colNumber) => {
    try {
      const headerValue = sanitizeCellValue(cell.value, maxCellLength, allowHTML);
      headers[colNumber - 1] = headerValue;
    } catch (error) {
      errors.push({
        row: 1,
        column: String.fromCharCode(64 + colNumber),
        message: `Header error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  return headers;
}

/**
 * Process rows with streaming (chunked processing)
 */
function processStreamingRows<T>(
  worksheet: ExcelJS.Worksheet,
  headers: string[],
  data: T[],
  errors: ExcelError[],
  options: { maxCellLength: number; allowFormulas: boolean; allowHTML: boolean; chunkSize: number }
): void {
  for (let startRow = 2; startRow <= worksheet.rowCount; startRow += options.chunkSize) {
    const endRow = Math.min(startRow + options.chunkSize - 1, worksheet.rowCount);

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      processRow(worksheet.getRow(rowIndex), rowIndex, headers, data, errors, options);
    }

    // Memory management - trigger garbage collection
    if (global.gc && startRow % (options.chunkSize * 5) === 0) {
      triggerGarbageCollection();
    }
  }
}

/**
 * Process rows with standard (non-streaming) approach
 */
function processStandardRows<T>(
  worksheet: ExcelJS.Worksheet,
  headers: string[],
  data: T[],
  errors: ExcelError[],
  options: { maxCellLength: number; allowFormulas: boolean; allowHTML: boolean }
): void {
  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return; // Skip header row
    processRow(row, rowIndex, headers, data, errors, options);
  });
}

/**
 * Process a single row
 */
function processRow<T>(
  row: ExcelJS.Row,
  rowIndex: number,
  headers: string[],
  data: T[],
  errors: ExcelError[],
  options: { maxCellLength: number; allowFormulas: boolean; allowHTML: boolean }
): void {
  try {
    const rowData: any = {};

    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        try {
          // Block formulas if not allowed
          if (!options.allowFormulas && cell.type === ExcelJS.ValueType.Formula) {
            throw new Error(
              `Formula detected in cell ${String.fromCharCode(64 + colNumber)}${rowIndex}. Formulas are not allowed.`
            );
          }

          rowData[header] = sanitizeCellValue(cell.value, options.maxCellLength, options.allowHTML);
        } catch (cellError) {
          errors.push({
            row: rowIndex,
            column: String.fromCharCode(64 + colNumber),
            message: `Cell error: ${cellError instanceof Error ? cellError.message : 'Unknown error'}`,
          });
        }
      }
    });

    if (Object.keys(rowData).length > 0) {
      data.push(rowData as T);
    }
  } catch (rowError) {
    errors.push({
      row: rowIndex,
      message: `Row error: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`,
    });
  }
}
