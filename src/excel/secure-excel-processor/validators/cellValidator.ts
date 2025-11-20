/**
 * Cell Validator
 * Validates and sanitizes cell content for security
 */

import { log } from '@/lib/logger';
import { MAX_CELL_LENGTH } from '../config/limits';
import { containsDangerousPattern } from '../config/securityPatterns';

/**
 * Sanitize cell value with security checks
 */
export function sanitizeCellValue(
  value: any,
  maxLength: number = MAX_CELL_LENGTH,
  allowHTML: boolean = false
): string {
  if (value == null || value === undefined) return '';

  let stringValue = String(value).trim();

  // Length validation
  if (stringValue.length > maxLength) {
    log.warn(
      `Cell content truncated: ${stringValue.length} > ${maxLength} chars`,
      undefined,
      'secure-excel'
    );
    stringValue = stringValue.substring(0, maxLength);
  }

  // Security pattern detection
  const dangerCheck = containsDangerousPattern(stringValue);
  if (dangerCheck.matches) {
    log.warn(
      `Dangerous pattern blocked: ${dangerCheck.pattern?.source}`,
      { value: stringValue.substring(0, 100) },
      'secure-excel'
    );
    throw new Error(
      `Content contains potentially dangerous pattern: ${dangerCheck.pattern?.source}`
    );
  }

  // HTML removal if not allowed
  if (!allowHTML && /<[^>]*>/.test(stringValue)) {
    const htmlStripped = stringValue.replace(/<[^>]*>/g, '');
    log.info('HTML content removed from cell', undefined, 'secure-excel');
    stringValue = htmlStripped;
  }

  return stringValue;
}
