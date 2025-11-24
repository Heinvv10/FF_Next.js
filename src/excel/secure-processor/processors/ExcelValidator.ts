/**
 * Excel Validator Processor
 * Handles validation without full processing
 */

import ExcelJS from 'exceljs';
import { SecureExcelOptions, ExcelValidationResult } from '../types/excel.types';
import { MAX_ROWS, MAX_COLUMNS } from '../constants/excelConstants';
import { validateFileSize } from '../validators/securityValidators';

/**
 * Validate Excel file without full processing
 */
export async function validateExcelFile(
  buffer: ArrayBuffer,
  options: SecureExcelOptions = {}
): Promise<ExcelValidationResult> {
  try {
    validateFileSize(buffer, options.maxFileSize);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const errors: string[] = [];

    if (workbook.worksheets.length === 0) {
      errors.push('Excel file contains no worksheets');
    }

    const worksheet = workbook.worksheets[0];
    if (worksheet) {
      if (worksheet.rowCount > (options.maxRows || MAX_ROWS)) {
        errors.push(`Too many rows: ${worksheet.rowCount} > ${options.maxRows || MAX_ROWS}`);
      }

      if (worksheet.columnCount > (options.maxColumns || MAX_COLUMNS)) {
        errors.push(`Too many columns: ${worksheet.columnCount} > ${options.maxColumns || MAX_COLUMNS}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      metadata: {
        worksheetCount: workbook.worksheets.length,
        rowCount: worksheet?.rowCount || 0,
        columnCount: worksheet?.columnCount || 0,
        worksheetName: worksheet?.name || 'Unknown'
      }
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      metadata: {
        worksheetCount: 0,
        rowCount: 0,
        columnCount: 0,
        worksheetName: 'Unknown'
      }
    };
  }
}
