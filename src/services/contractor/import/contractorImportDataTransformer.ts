/**
 * Contractor Import Data Transformer
 * Handles data transformation, validation and normalization
 * Extracted from contractorImportProcessor.ts for constitutional compliance
 */

import type { 
  ContractorImportRow,
  ContractorImportValidationResult,
  TransformedContractorData
} from '@/types/contractor/import.types';
import { log } from '@/lib/logger';

export class ContractorImportDataTransformer {
  
  /**
   * Transform and validate imported contractor data
   */
  async transformContractorData(
    rows: Partial<ContractorImportRow>[]
  ): Promise<ContractorImportValidationResult> {
    const result: ContractorImportValidationResult = {
      validRows: [],
      invalidRows: [],
      warnings: [],
      statistics: {
        totalRows: rows.length,
        validRows: 0,
        invalidRows: 0,
        duplicateRows: 0,
        emptyRows: 0
      }
    };

    const seenIdentifiers = new Set<string>();

    for (const rawRow of rows) {
      try {
        const transformedRow = await this.transformSingleRow(rawRow);
        
        if (!transformedRow) {
          result.statistics.emptyRows++;
          continue;
        }

        // Check for duplicates
        const identifier = this.generateRowIdentifier(transformedRow);
        if (seenIdentifiers.has(identifier)) {
          result.statistics.duplicateRows++;
          result.invalidRows.push({
            ...transformedRow,
            validationErrors: ['Duplicate contractor entry found in import data'],
            isValid: false
          });
          continue;
        }
        
        seenIdentifiers.add(identifier);

        // Validate the transformed data
        const validation = await this.validateTransformedRow(transformedRow);
        
        if (validation.isValid) {
          result.validRows.push(validation);
          result.statistics.validRows++;
        } else {
          result.invalidRows.push(validation);
          result.statistics.invalidRows++;
        }

        // Add any warnings
        if (validation.warnings && validation.warnings.length > 0) {
          result.warnings.push(...validation.warnings);
        }

      } catch (error) {
        log.error(`Error transforming row ${rawRow.rowNumber}:`, error);
        result.invalidRows.push({
          rowNumber: rawRow.rowNumber || 0,
          originalData: rawRow.originalData || {},
          validationErrors: [`Transformation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          isValid: false
        });
        result.statistics.invalidRows++;
      }
    }

    return result;
  }

  /**
   * Transform a single row of data
   */
  private async transformSingleRow(
    rawRow: Partial<ContractorImportRow>
  ): Promise<TransformedContractorData | null> {
    if (!rawRow || !rawRow.originalData) {
      return null;
    }

    // Extract and normalize basic contractor information
    const transformed: TransformedContractorData = {
      rowNumber: rawRow.rowNumber || 0,
      originalData: rawRow.originalData,
      
      // Basic Information
      companyName: this.normalizeString(rawRow.companyName),
      contactPerson: this.normalizeString(rawRow.contactPerson),
      email: this.normalizeEmail(rawRow.email),
      phone: this.normalizePhone(rawRow.phone),
      
      // Address Information
      address: this.normalizeString(rawRow.address),
      city: this.normalizeString(rawRow.city),
      province: this.normalizeProvince(rawRow.province),
      postalCode: this.normalizePostalCode(rawRow.postalCode),
      
      // Business Information
      businessType: this.normalizeBusinessType(rawRow.businessType),
      registrationNumber: this.normalizeString(rawRow.registrationNumber),
      taxNumber: this.normalizeString(rawRow.taxNumber),
      
      // Service Information
      services: this.normalizeServices(rawRow.services),
      specializations: this.normalizeSpecializations(rawRow.specializations),
      
      // Compliance Information
      bbbeeLevel: this.normalizeBBBEELevel(rawRow.bbbeeLevel),
      certifications: this.normalizeCertifications(rawRow.certifications),
      
      // Financial Information
      hourlyRate: this.normalizeNumeric(rawRow.hourlyRate),
      dailyRate: this.normalizeNumeric(rawRow.dailyRate),
      
      // Additional fields
      notes: this.normalizeString(rawRow.notes),
      status: 'pending' // Default status for new imports
    };

    return transformed;
  }

  /**
   * Validate transformed contractor data
   */
  private async validateTransformedRow(
    data: TransformedContractorData
  ): Promise<ContractorImportRow> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!data.companyName || data.companyName.length < 2) {
      errors.push('Company name is required and must be at least 2 characters');
    }

    if (!data.email) {
      errors.push('Email address is required');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (!data.phone) {
      warnings.push('Phone number is missing');
    } else if (!this.isValidPhone(data.phone)) {
      warnings.push('Phone number format may be invalid');
    }

    // Business validation
    if (!data.businessType) {
      warnings.push('Business type not specified');
    }

    if (!data.services || data.services.length === 0) {
      warnings.push('No services specified');
    }

    // Address validation
    if (!data.address) {
      warnings.push('Address information is incomplete');
    }

    if (!data.province) {
      warnings.push('Province not specified');
    }

    return {
      ...data,
      validationErrors: errors,
      warnings: warnings,
      isValid: errors.length === 0
    };
  }

  /**
   * Generate unique identifier for duplicate detection
   */
  private generateRowIdentifier(data: TransformedContractorData): string {
    const identifiers = [
      data.companyName?.toLowerCase().trim(),
      data.email?.toLowerCase().trim(),
      data.registrationNumber?.toLowerCase().trim()
    ].filter(Boolean);

    return identifiers.join('|') || `row_${data.rowNumber}`;
  }

  // Normalization helper methods
  private normalizeString(value: string | undefined): string {
    return value?.trim() || '';
  }

  private normalizeEmail(value: string | undefined): string {
    return value?.toLowerCase().trim() || '';
  }

  private normalizePhone(value: string | undefined): string {
    if (!value) return '';
    // Remove all non-numeric characters except + at the beginning
    return value.replace(/[^\d+]/g, '').replace(/\+(?!^)/g, '');
  }

  private normalizeProvince(value: string | undefined): string {
    if (!value) return '';
    
    const provinceMap: Record<string, string> = {
      'western cape': 'Western Cape',
      'eastern cape': 'Eastern Cape',
      'northern cape': 'Northern Cape',
      'free state': 'Free State',
      'kwazulu-natal': 'KwaZulu-Natal',
      'kwazulu natal': 'KwaZulu-Natal',
      'north west': 'North West',
      'gauteng': 'Gauteng',
      'mpumalanga': 'Mpumalanga',
      'limpopo': 'Limpopo'
    };

    const normalized = value.toLowerCase().trim();
    return provinceMap[normalized] || value.trim();
  }

  private normalizePostalCode(value: string | undefined): string {
    if (!value) return '';
    return value.replace(/\s/g, '').toUpperCase();
  }

  private normalizeBusinessType(value: string | undefined): string {
    if (!value) return '';
    
    const typeMap: Record<string, string> = {
      'pty ltd': 'Pty Ltd',
      'cc': 'CC', 
      'sole proprietor': 'Sole Proprietor',
      'partnership': 'Partnership',
      'npc': 'NPC',
      'trust': 'Trust'
    };

    const normalized = value.toLowerCase().trim();
    return typeMap[normalized] || value.trim();
  }

  private normalizeServices(value: string | undefined): string[] {
    if (!value) return [];
    
    return value
      .split(/[,;|]/)
      .map(service => service.trim())
      .filter(service => service.length > 0);
  }

  private normalizeSpecializations(value: string | undefined): string[] {
    if (!value) return [];
    
    return value
      .split(/[,;|]/)
      .map(spec => spec.trim())
      .filter(spec => spec.length > 0);
  }

  private normalizeBBBEELevel(value: string | undefined): string {
    if (!value) return '';
    
    const level = value.trim().toLowerCase();
    const levelMap: Record<string, string> = {
      'level 1': 'Level 1',
      'level 2': 'Level 2', 
      'level 3': 'Level 3',
      'level 4': 'Level 4',
      'level 5': 'Level 5',
      'level 6': 'Level 6',
      'level 7': 'Level 7',
      'level 8': 'Level 8',
      'non-compliant': 'Non-Compliant'
    };

    return levelMap[level] || value.trim();
  }

  private normalizeCertifications(value: string | undefined): string[] {
    if (!value) return [];
    
    return value
      .split(/[,;|]/)
      .map(cert => cert.trim())
      .filter(cert => cert.length > 0);
  }

  private normalizeNumeric(value: string | undefined): number | null {
    if (!value || value.trim() === '') return null;
    
    const numericValue = parseFloat(value.replace(/[^\d.]/g, ''));
    return isNaN(numericValue) ? null : numericValue;
  }

  // Validation helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // South African phone number validation (basic)
    const phoneRegex = /^(\+27|0)[0-9]{9}$/;
    return phoneRegex.test(phone);
  }
}

// Export singleton instance
export const contractorImportDataTransformer = new ContractorImportDataTransformer();