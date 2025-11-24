/**
 * Security Validators for Excel Processing
 */

import { log } from '@/lib/logger';
import { DANGEROUS_PATTERNS, MAX_FILE_SIZE } from '../constants/excelConstants';

/**
 * Validate file size against maximum allowed
 */
export function validateFileSize(buffer: ArrayBuffer, maxSize: number = MAX_FILE_SIZE): void {
  if (buffer.byteLength > maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  log.info(`File size validation passed: ${Math.round(buffer.byteLength / 1024)}KB`,
    { size: buffer.byteLength }, 'secure-excel');
}

/**
 * Check for dangerous patterns in cell content
 */
export function containsDangerousPattern(value: string): { isDangerous: boolean; pattern?: RegExp } {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(value)) {
      return { isDangerous: true, pattern };
    }
  }
  return { isDangerous: false };
}

/**
 * Remove HTML tags from content
 */
export function stripHTML(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}
