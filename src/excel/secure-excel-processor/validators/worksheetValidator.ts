/**
 * Worksheet Validator
 * Validates worksheet dimensions and structure
 */

import ExcelJS from 'exceljs';
import { MAX_ROWS, MAX_COLUMNS } from '../config/limits';

/**
 * Validate worksheet dimensions
 */
export function validateWorksheetDimensions(
  worksheet: ExcelJS.Worksheet,
  maxRows: number = MAX_ROWS,
  maxColumns: number = MAX_COLUMNS
): void {
  if (worksheet.rowCount > maxRows) {
    throw new Error(
      `Worksheet exceeds maximum rows: ${worksheet.rowCount} > ${maxRows}`
    );
  }

  if (worksheet.columnCount > maxColumns) {
    throw new Error(
      `Worksheet exceeds maximum columns: ${worksheet.columnCount} > ${maxColumns}`
    );
  }
}

/**
 * Validate workbook has worksheets
 */
export function validateWorkbookHasWorksheets(workbook: ExcelJS.Workbook): void {
  if (workbook.worksheets.length === 0) {
    throw new Error('Excel file contains no worksheets');
  }
}
