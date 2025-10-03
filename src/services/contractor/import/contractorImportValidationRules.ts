/**
 * Contractor Import Validation Rules
 * Specific validation rules for contractor fields and business logic
 */

import type { ContractorImportRow, BusinessType, SAProvince } from '@/types/contractor/import.types';
import { 
  BUSINESS_TYPES, 
  SA_PROVINCES, 
  REQUIRED_FIELDS, 
  VALIDATION_PATTERNS, 
  FIELD_LIMITS 
} from '@/constants/contractor/validation';

interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ContractorImportValidationRules {
  private availableServices: string[] = [];

  setAvailableServices(services: string[]): void {
    this.availableServices = services;
  }

  /**
   * Validate required fields
   */
  validateRequiredFields(row: Partial<ContractorImportRow>): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of REQUIRED_FIELDS) {
      const value = (row as any)[field];
      
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${field} is required but missing or empty`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!VALIDATION_PATTERNS.email.test(email.toLowerCase())) {
      errors.push(`Invalid email format: ${email}`);
    }

    // Check email length
    if (email.length > FIELD_LIMITS.email) {
      errors.push(`Email too long (${email.length} chars, max ${FIELD_LIMITS.email})`);
    }

    // Warning for non-business domains
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && personalDomains.includes(domain)) {
      warnings.push(`Personal email domain detected (${domain}), consider using business email`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate phone number format
   */
  validatePhone(phone: string): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Remove spaces and formatting for validation
    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    if (!VALIDATION_PATTERNS.phone.test(cleanPhone)) {
      errors.push(`Invalid phone format: ${phone} (expected +27XXXXXXXXX or 0XXXXXXXXX)`);
    }

    // Check for minimum length (SA numbers)
    if (cleanPhone.length < 10) {
      errors.push(`Phone number too short: ${phone}`);
    }

    if (cleanPhone.length > 15) {
      errors.push(`Phone number too long: ${phone}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate company name
   */
  validateCompanyName(companyName: string): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (companyName.length < 2) {
      errors.push(`Company name too short: ${companyName}`);
    }

    if (companyName.length > FIELD_LIMITS.companyName) {
      errors.push(`Company name too long (${companyName.length} chars, max ${FIELD_LIMITS.companyName})`);
    }

    // Warning for potentially invalid company names
    const suspiciousPatterns = [
      /^test/i,
      /^example/i,
      /^dummy/i,
      /^placeholder/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(companyName))) {
      warnings.push(`Company name appears to be a placeholder: ${companyName}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate services array
   */
  validateServices(services: string[], availableServices: string[]): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(services) || services.length === 0) {
      errors.push('At least one service must be specified');
      return { isValid: false, errors, warnings };
    }

    // Check each service
    for (const service of services) {
      if (!service || service.trim() === '') {
        warnings.push('Empty service found in services list');
        continue;
      }

      // Check if service exists in available services (if we have them)
      if (availableServices.length > 0 && !availableServices.includes(service)) {
        warnings.push(`Unknown service: ${service}. Available services: ${availableServices.join(', ')}`);
      }

      // Check service name length
      if (service.length > FIELD_LIMITS.serviceName) {
        errors.push(`Service name too long: ${service} (${service.length} chars, max ${FIELD_LIMITS.serviceName})`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate business-specific details
   */
  validateBusinessDetails(row: Partial<ContractorImportRow>): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Business type validation
    if (row.businessType && !BUSINESS_TYPES.includes(row.businessType as BusinessType)) {
      errors.push(`Invalid business type: ${row.businessType}. Valid types: ${BUSINESS_TYPES.join(', ')}`);
    }

    // Province validation
    if (row.province && !SA_PROVINCES.includes(row.province as SAProvince)) {
      errors.push(`Invalid province: ${row.province}. Valid provinces: ${SA_PROVINCES.join(', ')}`);
    }

    // Registration number format validation
    if (row.registrationNumber) {
      if (row.registrationNumber.length < 6) {
        warnings.push(`Registration number seems short: ${row.registrationNumber}`);
      }
      if (row.registrationNumber.length > 20) {
        errors.push(`Registration number too long: ${row.registrationNumber}`);
      }
    }

    // Tax number validation (South African format)
    if (row.taxNumber) {
      const cleanTax = row.taxNumber.replace(/\D/g, '');
      if (cleanTax.length !== 10 && cleanTax.length !== 15) {
        warnings.push(`Tax number format unusual: ${row.taxNumber} (expected 10 or 15 digits)`);
      }
    }

    // Address validation
    if (row.address) {
      if (row.address.length < 10) {
        warnings.push(`Address seems incomplete: ${row.address}`);
      }
      if (row.address.length > FIELD_LIMITS.address) {
        errors.push(`Address too long (${row.address.length} chars, max ${FIELD_LIMITS.address})`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate certification details
   */
  validateCertifications(certifications: string[]): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(certifications)) {
      return { isValid: true, errors, warnings }; // Optional field
    }

    for (const cert of certifications) {
      if (cert && cert.length > FIELD_LIMITS.certification) {
        errors.push(`Certification name too long: ${cert} (${cert.length} chars, max ${FIELD_LIMITS.certification})`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}