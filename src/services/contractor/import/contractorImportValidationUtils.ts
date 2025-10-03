/**
 * Contractor Import Validation Utilities
 * Helper functions for validation processing and message handling
 */

export class ContractorImportValidationUtils {
  
  /**
   * Remove duplicate messages from arrays
   */
  deduplicateMessages(messages: string[]): string[] {
    return Array.from(new Set(messages));
  }

  /**
   * Clean and normalize string values
   */
  normalizeString(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  /**
   * Check if value is empty or only whitespace
   */
  isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  /**
   * Sanitize input values to prevent common issues
   */
  sanitizeInput(value: string): string {
    if (!value || typeof value !== 'string') return '';
    
    return value
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Format validation errors for display
   */
  formatValidationError(field: string, error: string): string {
    return `${field}: ${error}`;
  }

  /**
   * Create validation summary message
   */
  createValidationSummary(
    totalRows: number,
    validRows: number,
    invalidRows: number,
    totalErrors: number,
    totalWarnings: number
  ): string {
    const errorRate = totalRows > 0 ? ((invalidRows / totalRows) * 100).toFixed(1) : '0.0';
    
    return `Validation Summary: ${validRows}/${totalRows} rows valid (${errorRate}% error rate). ` +
           `Total errors: ${totalErrors}, Total warnings: ${totalWarnings}`;
  }

  /**
   * Validate field length limits
   */
  validateLength(value: string, minLength: number, maxLength: number, fieldName: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (value.length < minLength) {
      errors.push(`${fieldName} too short (minimum ${minLength} characters)`);
    }

    if (value.length > maxLength) {
      errors.push(`${fieldName} too long (maximum ${maxLength} characters)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Extract domain from email address
   */
  extractEmailDomain(email: string): string | null {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1].toLowerCase() : null;
  }

  /**
   * Check if string contains only allowed characters
   */
  containsOnlyAllowedChars(value: string, allowedPattern: RegExp): boolean {
    return allowedPattern.test(value);
  }

  /**
   * Convert validation results to user-friendly messages
   */
  formatValidationResults(results: { errors: string[]; warnings: string[] }): {
    errorMessages: string[];
    warningMessages: string[];
    hasErrors: boolean;
    hasWarnings: boolean;
  } {
    return {
      errorMessages: results.errors,
      warningMessages: results.warnings,
      hasErrors: results.errors.length > 0,
      hasWarnings: results.warnings.length > 0
    };
  }
}