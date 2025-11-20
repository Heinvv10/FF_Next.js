/**
 * Secure Excel Processor
 * High-performance, security-focused Excel processing using ExcelJS
 * Replaces vulnerable xlsx library with streaming support and better performance
 *
 * Refactored: Nov 20, 2025 - Modular architecture
 * Main file reduced from 422 → ~60 lines (86% reduction)
 *
 * Architecture:
 * - types/: Type definitions and interfaces
 * - config/: Security limits and patterns
 * - validators/: File, cell, and worksheet validation
 * - processors/: ExcelReader, ExcelWriter, ExcelValidator
 * - utils/: Column formatting and memory management
 */

import {
  SecureExcelOptions,
  ExcelReadResult,
  ExcelValidationResult,
} from './secure-excel-processor/types/secureExcel.types';
import { readExcelFile } from './secure-excel-processor/processors/ExcelReader';
import { createExcelFile } from './secure-excel-processor/processors/ExcelWriter';
import { validateExcelFile } from './secure-excel-processor/processors/ExcelValidator';

/**
 * SecureExcelProcessor - Main class wrapper for backward compatibility
 * Delegates to modular processors for actual implementation
 */
export class SecureExcelProcessor {
  /**
   * Read Excel file with streaming support for better performance
   */
  static async readExcelFile<T = any>(
    buffer: ArrayBuffer,
    options: SecureExcelOptions = {}
  ): Promise<ExcelReadResult<T>> {
    return readExcelFile<T>(buffer, options);
  }

  /**
   * Create Excel file with optimized performance
   */
  static async createExcelFile<T = any>(
    data: T[],
    worksheetName: string = 'Data',
    options: SecureExcelOptions = {}
  ): Promise<ArrayBuffer> {
    return createExcelFile<T>(data, worksheetName, options);
  }

  /**
   * Validate Excel file without full processing
   */
  static async validateExcelFile(
    buffer: ArrayBuffer,
    options: SecureExcelOptions = {}
  ): Promise<ExcelValidationResult> {
    return validateExcelFile(buffer, options);
  }
}

// Re-export types for convenience
export type { SecureExcelOptions, ExcelReadResult, ExcelValidationResult };

// Convenience function exports (bind not needed since functions are standalone)
export { readExcelFile, createExcelFile, validateExcelFile };

// Default export
export default SecureExcelProcessor;
