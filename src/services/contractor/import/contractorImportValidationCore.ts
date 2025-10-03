/**
 * Contractor Import Validation Core
 * Main validation orchestration and field-level validation
 */

import type { ContractorImportRow } from '@/types/contractor/import.types';
import { log } from '@/lib/logger';
import { ContractorImportValidationRules } from './contractorImportValidationRules';
import { ContractorImportValidationUtils } from './contractorImportValidationUtils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ContractorImportValidator {
  private availableServices: string[] = [];
  private rules = new ContractorImportValidationRules();
  private utils = new ContractorImportValidationUtils();

  constructor(availableServices: string[] = []) {
    this.availableServices = availableServices;
  }

  /**
   * Set available services from service templates
   */
  setAvailableServices(services: string[]): void {
    this.availableServices = services;
    this.rules.setAvailableServices(services);
  }

  /**
   * Load available services from the service templates API
   */
  async loadAvailableServices(): Promise<void> {
    try {
      // Try to load from API first
      try {
        // Dynamic import to avoid circular dependencies
        const { ServiceTemplateApiService } = await import('@/services/contractor/rateCardApiService');
        
        // Get all active service templates
        const response = await ServiceTemplateApiService.getServiceTemplates({
          isActive: true,
          limit: 1000 // Get all services
        });
        
        if (response.success && response.data && response.data.length > 0) {
          const services = response.data.map((template: any) => template.name);
          this.setAvailableServices(services);
          log.info('Loaded services from API for validation', { serviceCount: services.length });
          return;
        }
      } catch (apiError) {
        log.warn('Failed to load services from API, using fallbacks', { error: apiError });
      }
      
      // Fallback to default service types if API fails
      const defaultServices = [
        'Fiber Installation',
        'Fiber Maintenance',
        'Network Construction',
        'Equipment Installation',
        'Site Survey',
        'Quality Assurance',
        'Project Management',
        'Technical Support'
      ];
      
      this.setAvailableServices(defaultServices);
      log.info('Using default services for validation', { serviceCount: defaultServices.length });
    } catch (error) {
      log.error('Error loading available services for validation', { error });
      // Continue with empty services - validation will warn about unknown services
      this.setAvailableServices([]);
    }
  }

  /**
   * Validate a single contractor row
   */
  validateRow(row: Partial<ContractorImportRow>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Required field validation
      const requiredValidation = this.rules.validateRequiredFields(row);
      errors.push(...requiredValidation.errors);
      warnings.push(...requiredValidation.warnings);

      // Format validation for individual fields
      if (row.email) {
        const emailValidation = this.rules.validateEmail(row.email);
        if (!emailValidation.isValid) {
          errors.push(...emailValidation.errors);
        }
      }

      if (row.phone) {
        const phoneValidation = this.rules.validatePhone(row.phone);
        if (!phoneValidation.isValid) {
          errors.push(...phoneValidation.errors);
        }
      }

      if (row.companyName) {
        const companyValidation = this.rules.validateCompanyName(row.companyName);
        if (!companyValidation.isValid) {
          errors.push(...companyValidation.errors);
        }
        warnings.push(...companyValidation.warnings);
      }

      // Services validation
      if (row.services && Array.isArray(row.services)) {
        const servicesValidation = this.rules.validateServices(row.services, this.availableServices);
        if (!servicesValidation.isValid) {
          errors.push(...servicesValidation.errors);
        }
        warnings.push(...servicesValidation.warnings);
      }

      // Business validation
      const businessValidation = this.rules.validateBusinessDetails(row);
      errors.push(...businessValidation.errors);
      warnings.push(...businessValidation.warnings);

      return {
        isValid: errors.length === 0,
        errors: this.utils.deduplicateMessages(errors),
        warnings: this.utils.deduplicateMessages(warnings)
      };
    } catch (error) {
      log.error('Error during contractor row validation', { error, row });
      return {
        isValid: false,
        errors: ['Validation failed due to internal error'],
        warnings: []
      };
    }
  }

  /**
   * Validate batch of contractor rows
   */
  validateBatch(rows: Partial<ContractorImportRow>[]): {
    results: ValidationResult[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      totalErrors: number;
      totalWarnings: number;
    }
  } {
    const results = rows.map(row => this.validateRow(row));
    
    const summary = {
      total: results.length,
      valid: results.filter(r => r.isValid).length,
      invalid: results.filter(r => !r.isValid).length,
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
    };

    return { results, summary };
  }
}