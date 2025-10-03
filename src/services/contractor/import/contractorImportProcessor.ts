/**
 * Contractor Import Data Processing - Main Orchestrator
 * Coordinates file parsing, data transformation, and validation
 * Refactored for constitutional compliance (<300 lines)
 */

import type { 
  ContractorImportOptions, 
  ContractorImportRow,
  ContractorImportValidationResult
} from '@/types/contractor/import.types';
import { log } from '@/lib/logger';
import { contractorImportFileParser } from './contractorImportFileParser';
import { contractorImportDataTransformer } from './contractorImportDataTransformer';

export class ContractorImportProcessor {
  
  /**
   * Main entry point for contractor import processing
   */
  async processImportFile(
    file: File, 
    options: ContractorImportOptions
  ): Promise<ContractorImportValidationResult> {
    try {
      log.info(`Starting import processing for file: ${file.name}`);
      
      // Step 1: Parse the file
      const rawRows = await this.parseFile(file, options);
      log.info(`Parsed ${rawRows.length} rows from file`);
      
      // Step 2: Transform and validate data
      const result = await this.transformData(rawRows);
      log.info(`Processing complete: ${result.statistics.validRows} valid, ${result.statistics.invalidRows} invalid`);
      
      return result;
    } catch (error) {
      log.error('Import processing failed:', error);
      throw new Error(`Failed to process import file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse file using extracted file parser
   */
  async parseFile(file: File, options: ContractorImportOptions): Promise<Partial<ContractorImportRow>[]> {
    return contractorImportFileParser.parseFile(file, options);
  }

  /**
   * Transform and validate data using extracted transformer
   */
  async transformData(rawRows: Partial<ContractorImportRow>[]): Promise<ContractorImportValidationResult> {
    return contractorImportDataTransformer.transformContractorData(rawRows);
  }

  /**
   * Get import statistics for progress tracking
   */
  getImportStatistics(result: ContractorImportValidationResult) {
    return {
      total: result.statistics.totalRows,
      valid: result.statistics.validRows,
      invalid: result.statistics.invalidRows,
      duplicates: result.statistics.duplicateRows,
      empty: result.statistics.emptyRows,
      successRate: result.statistics.totalRows > 0 
        ? Math.round((result.statistics.validRows / result.statistics.totalRows) * 100) 
        : 0
    };
  }

  /**
   * Preview import data without full processing
   */
  async previewImportFile(
    file: File, 
    options: ContractorImportOptions,
    maxRows: number = 10
  ): Promise<Partial<ContractorImportRow>[]> {
    const allRows = await this.parseFile(file, options);
    return allRows.slice(0, maxRows);
  }
}

// Export singleton instance
export const contractorImportProcessor = new ContractorImportProcessor();