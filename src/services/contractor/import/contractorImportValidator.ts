/**
 * Contractor Import Validator - Main Export
 * Maintains backward compatibility while using the new modular structure
 */

// Re-export the main validator class and types
export { ContractorImportValidator, type ValidationResult } from './contractorImportValidationCore';

// Export additional classes for direct use if needed
export { ContractorImportValidationRules } from './contractorImportValidationRules';
export { ContractorImportValidationUtils } from './contractorImportValidationUtils';