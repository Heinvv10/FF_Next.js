/**
 * Contractor Import File Parser
 * Handles CSV and Excel file parsing logic
 * Extracted from contractorImportProcessor.ts for constitutional compliance
 */

import type { 
  ContractorImportOptions, 
  ContractorImportRow 
} from '@/types/contractor/import.types';
import { CSV_HEADER_MAPPING } from '@/constants/contractor/validation';
import { log } from '@/lib/logger';
import * as XLSX from 'xlsx';

export class ContractorImportFileParser {
  
  /**
   * Parse file based on type (CSV or Excel)
   */
  async parseFile(file: File, options: ContractorImportOptions): Promise<Partial<ContractorImportRow>[]> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    switch (fileExtension) {
      case 'csv':
        return this.parseCsvFile(file, options);
      case 'xlsx':
      case 'xls':
        return this.parseExcelFile(file, options);
      default:
        throw new Error(`Unsupported file type: ${fileExtension}. Please use CSV or Excel files.`);
    }
  }

  /**
   * Parse CSV file content
   */
  async parseCsvFile(file: File, options: ContractorImportOptions): Promise<Partial<ContractorImportRow>[]> {
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }

      let dataStartIndex = 0;
      let headers: string[] = [];

      if (options.hasHeaders && lines.length > 0) {
        headers = this.parseCsvLine(lines[0]);
        dataStartIndex = 1;
      } else {
        // Generate generic headers if not present
        const firstRow = this.parseCsvLine(lines[0]);
        headers = firstRow.map((_, index) => `column_${index + 1}`);
      }

      const rows: Partial<ContractorImportRow>[] = [];
      
      for (let i = dataStartIndex; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Skip empty lines
        
        try {
          const values = this.parseCsvLine(lines[i]);
          const row = this.mapCsvRowToContractorData(headers, values, i + 1);
          if (row) {
            rows.push(row);
          }
        } catch (error) {
          log.warn(`Error parsing CSV line ${i + 1}:`, error);
          // Continue with next line instead of failing entire import
        }
      }

      return rows;
    } catch (error) {
      log.error('CSV parsing error:', error);
      throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse Excel file content
   */
  async parseExcelFile(file: File, options: ContractorImportOptions): Promise<Partial<ContractorImportRow>[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Use first sheet
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Excel file contains no sheets');
      }
      
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false,
        defval: ''
      }) as string[][];

      if (jsonData.length === 0) {
        throw new Error('Excel sheet is empty');
      }

      let dataStartIndex = 0;
      let headers: string[] = [];

      if (options.hasHeaders && jsonData.length > 0) {
        headers = jsonData[0];
        dataStartIndex = 1;
      } else {
        // Generate generic headers if not present
        const firstRow = jsonData[0];
        headers = firstRow.map((_, index) => `column_${index + 1}`);
      }

      const rows: Partial<ContractorImportRow>[] = [];
      
      for (let i = dataStartIndex; i < jsonData.length; i++) {
        if (!jsonData[i] || jsonData[i].every(cell => !cell || cell.toString().trim() === '')) {
          continue; // Skip empty rows
        }
        
        try {
          const row = this.mapCsvRowToContractorData(headers, jsonData[i], i + 1);
          if (row) {
            rows.push(row);
          }
        } catch (error) {
          log.warn(`Error parsing Excel row ${i + 1}:`, error);
          // Continue with next row instead of failing entire import
        }
      }

      return rows;
    } catch (error) {
      log.error('Excel parsing error:', error);
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse a single CSV line handling quoted fields and escaping
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  }

  /**
   * Map CSV row data to contractor import structure
   */
  private mapCsvRowToContractorData(
    headers: string[], 
    values: string[], 
    rowNumber: number
  ): Partial<ContractorImportRow> | null {
    if (values.length === 0 || values.every(val => !val || val.trim() === '')) {
      return null; // Skip empty rows
    }

    const row: Partial<ContractorImportRow> = {
      rowNumber,
      originalData: {}
    };

    // Map each header to its corresponding value
    headers.forEach((header, index) => {
      const value = values[index] || '';
      const mappedField = this.getMappedFieldName(header);
      
      // Store original data
      if (row.originalData) {
        row.originalData[header] = value;
      }

      // Map to contractor fields
      if (mappedField && value.trim() !== '') {
        (row as any)[mappedField] = value.trim();
      }
    });

    return row;
  }

  /**
   * Get mapped field name from CSV header
   */
  private getMappedFieldName(header: string): string | null {
    const normalizedHeader = header.toLowerCase().trim();
    return CSV_HEADER_MAPPING[normalizedHeader] || null;
  }
}

// Export singleton instance
export const contractorImportFileParser = new ContractorImportFileParser();