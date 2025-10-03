/**
 * Contractor Import Services - Main Export Index
 * Provides clean exports for the refactored import system
 */

// Main service exports
export { ContractorImportService } from './contractorImportCore';
export { ContractorImportProcessor } from './contractorImportProcessor';
export { ContractorImportProgress } from './contractorImportProgress';

// Maintain backward compatibility
export { ContractorImportValidator } from './contractorImportValidator';

// Export singleton instance for immediate use
export { contractorImportService } from './contractorImportCore';

// Re-export types for convenience
export type {
  ContractorImportData,
  ContractorImportOptions,
  ContractorImportResult,
  ContractorImportRow
} from '@/types/contractor/import.types';