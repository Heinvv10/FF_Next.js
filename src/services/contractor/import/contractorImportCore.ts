/**
 * Contractor Import Core Service
 * Main orchestration and public interface for contractor import operations
 */

import type { 
  ContractorImportData, 
  ContractorImportOptions, 
  ContractorImportResult,
  ContractorImportRow 
} from '@/types/contractor/import.types';
import { ContractorImportValidator } from './contractorImportValidator';
import { ContractorImportProcessor } from './contractorImportProcessor';
import { ContractorImportProgress } from './contractorImportProgress';
import { log } from '@/lib/logger';

export class ContractorImportService {
  private validator = new ContractorImportValidator();
  private processor = new ContractorImportProcessor();
  private progress = new ContractorImportProgress();

  /**
   * Process uploaded file and extract contractor data
   */
  async processFile(
    file: File, 
    options: ContractorImportOptions = { mode: 'skipDuplicates', hasHeaders: true }
  ): Promise<ContractorImportData> {
    try {
      log.info('Starting contractor file processing', { 
        fileName: file.name, 
        fileSize: file.size, 
        options 
      });

      // Initialize validator with service templates
      await this.validator.loadAvailableServices();
      
      // Process the actual file (CSV/Excel)
      const rawData = await this.processor.parseFile(file, options);
      
      // Validate each row
      const processedContractors: ContractorImportRow[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + (options.hasHeaders ? 2 : 1); // Account for headers
        
        // Validate the row
        const validation = this.validator.validateRow(row);
        
        const contractorRow: ContractorImportRow = {
          ...row,
          rowNumber,
          isValid: validation.isValid,
          isDuplicate: false, // TODO: Implement duplicate detection
          errors: validation.errors,
          warnings: validation.warnings,
        };
        
        processedContractors.push(contractorRow);
      }
      
      // Calculate summary statistics
      const validContractors = processedContractors.filter(c => c.isValid);
      const invalidContractors = processedContractors.filter(c => !c.isValid);
      
      const result: ContractorImportData = {
        fileName: file.name,
        totalRows: processedContractors.length,
        validRows: validContractors.length,
        invalidRows: invalidContractors.length,
        contractors: processedContractors,
        summary: {
          totalProcessed: processedContractors.length,
          successfulValidations: validContractors.length,
          failedValidations: invalidContractors.length,
          duplicatesSkipped: 0, // TODO: Implement duplicate detection
          errors: invalidContractors.flatMap(c => c.errors || [])
        }
      };
      
      log.info('Contractor file processing completed', { 
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows
      });
      
      return result;
    } catch (error) {
      log.error('Error processing contractor file', { error, fileName: file.name });
      throw new Error(`Failed to process contractor file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import contractors to the database via API
   */
  async importContractors(
    contractors: ContractorImportRow[], 
    projectId: string,
    options: ContractorImportOptions = { mode: 'skipDuplicates' }
  ): Promise<ContractorImportResult> {
    try {
      log.info('Starting contractor import to database', { 
        contractorCount: contractors.length, 
        projectId, 
        options 
      });

      // Filter only valid contractors for import
      const validContractors = contractors.filter(c => c.isValid);
      
      if (validContractors.length === 0) {
        return {
          success: false,
          message: 'No valid contractors to import',
          importedCount: 0,
          skippedCount: contractors.length,
          errors: ['No valid contractors found in the import data']
        };
      }

      // Import via API endpoint
      const response = await fetch('/api/contractors/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractors: validContractors,
          projectId,
          options
        }),
      });

      if (!response.ok) {
        throw new Error(`Import API failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      log.info('Contractor import completed', { 
        importedCount: result.importedCount,
        skippedCount: result.skippedCount
      });
      
      return result;
    } catch (error) {
      log.error('Error importing contractors', { error, projectId });
      throw new Error(`Failed to import contractors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download contractor import template
   */
  downloadTemplate(): void {
    this.progress.downloadTemplate();
  }

  /**
   * Export contractors to Excel format
   */
  async exportToExcel(): Promise<void> {
    return this.progress.exportToExcel();
  }
}

// Export singleton instance for backward compatibility
export const contractorImportService = new ContractorImportService();