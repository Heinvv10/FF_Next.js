/**
 * File Validator
 * Validates file size and basic file properties
 */

import { log } from '@/lib/logger';
import { MAX_FILE_SIZE } from '../config/limits';

/**
 * Validate file size against maximum allowed
 */
export function validateFileSize(buffer: ArrayBuffer, maxSize: number = MAX_FILE_SIZE): void {
  if (buffer.byteLength > maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  log.info(
    `File size validation passed: ${Math.round(buffer.byteLength / 1024)}KB`,
    { size: buffer.byteLength },
    'secure-excel'
  );
}
