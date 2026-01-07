/**
 * CSV Processor
 * Handles CSV file parsing and processing
 */

import { StaffImportRow, StaffImportResult } from '@/types/staff.types';
import { DEFAULT_HEADER_MAPPING } from './types';
import { processImportRows } from './rowProcessor';
import { log } from '@/lib/logger';

/**
 * Import staff from CSV file
 */
export async function importFromCSV(file: File, overwriteExisting: boolean = true): Promise<StaffImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        const headerLine = lines[0];
        if (!headerLine) {
          reject(new Error('CSV file has no header row'));
          return;
        }

        const headers = headerLine.split(',').map(h => h.trim());

        log.info('Header mapping will be:', { data: headers.map(h => `${h} -> ${DEFAULT_HEADER_MAPPING[h] || 'unmapped'}`) }, 'csvProcessor');

        const rows: StaffImportRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          
          headers.forEach((header, index) => {
            // Use mapped header name if available, otherwise convert to lowercase
            const fieldName = DEFAULT_HEADER_MAPPING[header] || header.toLowerCase().replace(/\s+/g, '');
            row[fieldName] = values[index] || '';
          });
          
          // Debug logging for first few rows
          if (i <= 3) {





          }
          
          rows.push(row as StaffImportRow);
        }
        
        const result = await processImportRows(rows, overwriteExisting);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
}