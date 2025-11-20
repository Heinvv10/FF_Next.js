/**
 * Excel Validator
 * Validates Excel files without full processing
 */

import ExcelJS from 'exceljs';
import { SecureExcelOptions, ExcelValidationResult } from '../types/secureExcel.types';
import { DEFAULT_LIMITS } from '../config/limits';
import { validateFileSize } from '../validators/fileValidator';

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
      const maxRows = options.maxRows || DEFAULT_LIMITS.maxRows;
      const maxColumns = options.maxColumns || DEFAULT_LIMITS.maxColumns;

      if (worksheet.rowCount > maxRows) {
        errors.push(`Too many rows: ${worksheet.rowCount} > ${maxRows}`);
      }

      if (worksheet.columnCount > maxColumns) {
        errors.push(`Too many columns: ${worksheet.columnCount} > ${maxColumns}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      metadata: {
        worksheetCount: workbook.worksheets.length,
        rowCount: worksheet?.rowCount || 0,
        columnCount: worksheet?.columnCount || 0,
        worksheetName: worksheet?.name || 'Unknown',
      },
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      metadata: {},
    };
  }
}
