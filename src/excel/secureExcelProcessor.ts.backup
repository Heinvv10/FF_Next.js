/**
 * Secure Excel Processor
 * High-performance, security-focused Excel processing using ExcelJS
 * Replaces vulnerable xlsx library with streaming support and better performance
 */

import ExcelJS from 'exceljs';
import { log } from '@/lib/logger';

// Performance and security limits
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ROWS = 100000;
const MAX_COLUMNS = 1000;
const MAX_CELL_LENGTH = 10000;
const CHUNK_SIZE = 1000; // Process rows in chunks for better memory management

// Security patterns to detect and block
const DANGEROUS_PATTERNS = [
  /javascript:/i,
  /vbscript:/i,
  /data:text\/html/i,
  /<script/i,
  /eval\(/i,
  /Function\(/i,
  /document\./i,
  /window\./i
];

export interface SecureExcelOptions {
  maxFileSize?: number;
  maxRows?: number;
  maxColumns?: number;
  maxCellLength?: number;
  allowFormulas?: boolean;
  allowHTML?: boolean;
  chunkSize?: number;
  useStreaming?: boolean;
}

export interface ExcelReadResult<T = any> {
  data: T[];
  errors: Array<{ row: number; column?: string; message: string }>;
  metadata: {
    totalRows: number;
    totalColumns: number;
    worksheetName: string;
    processingTime: number;
    memoryUsed: number;
  };
}

export class SecureExcelProcessor {
  private static validateFileSize(buffer: ArrayBuffer, maxSize: number = MAX_FILE_SIZE): void {
    if (buffer.byteLength > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    log.info(`File size validation passed: ${Math.round(buffer.byteLength / 1024)}KB`, 
      { size: buffer.byteLength }, 'secure-excel');
  }

  private static sanitizeCellValue(
    value: any, 
    maxLength: number = MAX_CELL_LENGTH, 
    allowHTML: boolean = false
  ): string {
    if (value == null || value === undefined) return '';
    
    let stringValue = String(value).trim();
    
    // Length validation
    if (stringValue.length > maxLength) {
      log.warn(`Cell content truncated: ${stringValue.length} > ${maxLength} chars`, undefined, 'secure-excel');
      stringValue = stringValue.substring(0, maxLength);
    }
    
    // Security pattern detection
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(stringValue)) {
        log.warn(`Dangerous pattern blocked: ${pattern.source}`, { value: stringValue.substring(0, 100) }, 'secure-excel');
        throw new Error(`Content contains potentially dangerous pattern: ${pattern.source}`);
      }
    }
    
    // HTML removal if not allowed
    if (!allowHTML && /<[^>]*>/.test(stringValue)) {
      const htmlStripped = stringValue.replace(/<[^>]*>/g, '');
      log.info('HTML content removed from cell', undefined, 'secure-excel');
      stringValue = htmlStripped;
    }
    
    return stringValue;
  }

  /**
   * Read Excel file with streaming support for better performance
   */
  static async readExcelFile<T = any>(
    buffer: ArrayBuffer, 
    options: SecureExcelOptions = {}
  ): Promise<ExcelReadResult<T>> {
    const startTime = performance.now();
    const initialMemory = process.memoryUsage?.()?.heapUsed || 0;
    
    const {
      maxFileSize = MAX_FILE_SIZE,
      maxRows = MAX_ROWS,
      maxColumns = MAX_COLUMNS,
      maxCellLength = MAX_CELL_LENGTH,
      allowFormulas = false,
      allowHTML = false,
      chunkSize = CHUNK_SIZE,
      useStreaming = true
    } = options;

    try {
      // Security validation
      this.validateFileSize(buffer, maxFileSize);
      
      // Create workbook instance
      const workbook = new ExcelJS.Workbook();
      
      // Load workbook from buffer
      await workbook.xlsx.load(buffer);
      
      if (workbook.worksheets.length === 0) {
        throw new Error('Excel file contains no worksheets');
      }
      
      // Use first worksheet
      const worksheet = workbook.worksheets[0];
      const worksheetName = worksheet.name;
      
      // Validate worksheet dimensions
      if (worksheet.rowCount > maxRows) {
        throw new Error(`Worksheet exceeds maximum rows: ${worksheet.rowCount} > ${maxRows}`);
      }
      
      if (worksheet.columnCount > maxColumns) {
        throw new Error(`Worksheet exceeds maximum columns: ${worksheet.columnCount} > ${maxColumns}`);
      }
      
      const data: T[] = [];
      const errors: Array<{ row: number; column?: string; message: string }> = [];
      
      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      
      headerRow.eachCell((cell, colNumber) => {
        try {
          const headerValue = this.sanitizeCellValue(cell.value, maxCellLength, allowHTML);
          headers[colNumber - 1] = headerValue;
        } catch (error) {
          errors.push({
            row: 1,
            column: String.fromCharCode(64 + colNumber),
            message: `Header error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      });
      
      // Process data rows in chunks for better memory management
      if (useStreaming && worksheet.rowCount > chunkSize) {
        // Streaming processing for large files
        for (let startRow = 2; startRow <= worksheet.rowCount; startRow += chunkSize) {
          const endRow = Math.min(startRow + chunkSize - 1, worksheet.rowCount);
          
          for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
            try {
              const row = worksheet.getRow(rowIndex);
              const rowData: any = {};
              
              row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                  try {
                    // Block formulas if not allowed
                    if (!allowFormulas && cell.type === ExcelJS.ValueType.Formula) {
                      throw new Error(`Formula detected in cell ${String.fromCharCode(64 + colNumber)}${rowIndex}. Formulas are not allowed.`);
                    }
                    
                    rowData[header] = this.sanitizeCellValue(cell.value, maxCellLength, allowHTML);
                  } catch (cellError) {
                    errors.push({
                      row: rowIndex,
                      column: String.fromCharCode(64 + colNumber),
                      message: `Cell error: ${cellError instanceof Error ? cellError.message : 'Unknown error'}`
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
                message: `Row error: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`
              });
            }
          }
          
          // Memory management - force garbage collection opportunity
          if (global.gc && (startRow % (chunkSize * 5)) === 0) {
            global.gc();
          }
        }
      } else {
        // Standard processing for smaller files
        worksheet.eachRow((row, rowIndex) => {
          if (rowIndex === 1) return; // Skip header row
          
          try {
            const rowData: any = {};
            
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber - 1];
              if (header) {
                try {
                  // Block formulas if not allowed
                  if (!allowFormulas && cell.type === ExcelJS.ValueType.Formula) {
                    throw new Error(`Formula detected in cell ${String.fromCharCode(64 + colNumber)}${rowIndex}. Formulas are not allowed.`);
                  }
                  
                  rowData[header] = this.sanitizeCellValue(cell.value, maxCellLength, allowHTML);
                } catch (cellError) {
                  errors.push({
                    row: rowIndex,
                    column: String.fromCharCode(64 + colNumber),
                    message: `Cell error: ${cellError instanceof Error ? cellError.message : 'Unknown error'}`
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
              message: `Row error: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`
            });
          }
        });
      }
      
      const endTime = performance.now();
      const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
      const processingTime = Math.round(endTime - startTime);
      const memoryUsed = Math.max(0, finalMemory - initialMemory);
      
      log.info('Excel file processed successfully', {
        rows: data.length,
        errors: errors.length,
        processingTime,
        memoryUsed: Math.round(memoryUsed / 1024),
        useStreaming
      }, 'secure-excel');
      
      return {
        data,
        errors,
        metadata: {
          totalRows: worksheet.rowCount,
          totalColumns: worksheet.columnCount,
          worksheetName,
          processingTime,
          memoryUsed
        }
      };
      
    } catch (error) {
      log.error('Excel processing failed:', { data: error }, 'secure-excel');
      throw new Error(`Excel processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create Excel file with optimized performance
   */
  static async createExcelFile<T = any>(
    data: T[],
    worksheetName: string = 'Data',
    options: SecureExcelOptions = {}
  ): Promise<ArrayBuffer> {
    const startTime = performance.now();
    
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(worksheetName);
      
      if (data.length === 0) {
        throw new Error('No data provided for Excel export');
      }
      
      // Get headers from first data item
      const headers = Object.keys(data[0] as Record<string, any>);
      
      // Add header row with styling
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add data rows in chunks for better memory management
      const chunkSize = options.chunkSize || CHUNK_SIZE;
      
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        
        for (const item of chunk) {
          const rowData = headers.map(header => {
            const value = (item as any)[header];
            return this.sanitizeCellValue(value, options.maxCellLength, options.allowHTML);
          });
          worksheet.addRow(rowData);
        }
        
        // Memory management
        if (global.gc && i % (chunkSize * 5) === 0) {
          global.gc();
        }
      }
      
      // Auto-fit columns for better readability
      worksheet.columns.forEach((column, index) => {
        const header = headers[index];
        let maxLength = header.length;
        
        // Sample first 100 rows to determine column width
        const sampleSize = Math.min(100, data.length);
        for (let i = 0; i < sampleSize; i++) {
          const value = String((data[i] as any)[header] || '');
          maxLength = Math.max(maxLength, value.length);
        }
        
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });
      
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      const endTime = performance.now();
      log.info('Excel file created successfully', {
        rows: data.length,
        columns: headers.length,
        processingTime: Math.round(endTime - startTime),
        bufferSize: Math.round(buffer.byteLength / 1024)
      }, 'secure-excel');
      
      return buffer as ArrayBuffer;
      
    } catch (error) {
      log.error('Excel creation failed:', { data: error }, 'secure-excel');
      throw new Error(`Excel creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Excel file without full processing
   */
  static async validateExcelFile(
    buffer: ArrayBuffer, 
    options: SecureExcelOptions = {}
  ): Promise<{ isValid: boolean; errors: string[]; metadata: any }> {
    try {
      this.validateFileSize(buffer, options.maxFileSize);
      
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
        metadata: {}
      };
    }
  }
}

// Convenience functions for common use cases
export const readExcelFile = SecureExcelProcessor.readExcelFile.bind(SecureExcelProcessor);
export const createExcelFile = SecureExcelProcessor.createExcelFile.bind(SecureExcelProcessor);
export const validateExcelFile = SecureExcelProcessor.validateExcelFile.bind(SecureExcelProcessor);

export default SecureExcelProcessor;
