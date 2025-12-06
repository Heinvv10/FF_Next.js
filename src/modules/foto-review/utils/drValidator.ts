/**
 * DR Number Validation Utilities
 * Validates DR (Drop Reference) numbers for security and format correctness
 */

/**
 * Valid DR number format: DR followed by 7-10 digits
 * Examples: DR1234567, DR7654321, DR1765044553029
 */
export const DR_NUMBER_REGEX = /^DR\d{7,10}$/;

/**
 * Validation result interface
 */
export interface DrValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validates a DR number format
 *
 * @param drNumber - The DR number to validate
 * @returns Validation result with valid flag and optional error message
 *
 * @example
 * ```ts
 * const result = validateDrNumber('DR1234567');
 * if (result.valid) {
 *   console.log('Valid DR:', result.sanitized);
 * } else {
 *   console.error('Invalid DR:', result.error);
 * }
 * ```
 */
export function validateDrNumber(drNumber: string | undefined | null): DrValidationResult {
  // Check if DR number is provided
  if (!drNumber) {
    return {
      valid: false,
      error: 'DR number is required',
    };
  }

  // Check type
  if (typeof drNumber !== 'string') {
    return {
      valid: false,
      error: 'DR number must be a string',
    };
  }

  // Trim whitespace
  const trimmed = drNumber.trim();

  // Check if empty after trimming
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'DR number cannot be empty',
    };
  }

  // Detect SQL injection attempts
  const sqlPatterns = [
    /['";]/,           // SQL string delimiters
    /--/,              // SQL comments
    /\/\*/,            // Block comments
    /union/i,          // UNION attacks
    /select/i,         // SELECT statements
    /insert/i,         // INSERT statements
    /update/i,         // UPDATE statements
    /delete/i,         // DELETE statements
    /drop/i,           // DROP statements (except 'drop' in DR context)
    /;/,               // Statement terminators
    /xp_/i,            // Extended stored procedures
  ];

  // Check for SQL injection patterns (excluding 'drop' in DR prefix)
  for (const pattern of sqlPatterns) {
    if (pattern.test(trimmed) && !/^DR\d/.test(trimmed)) {
      return {
        valid: false,
        error: 'Invalid characters detected in DR number. DR numbers should contain only alphanumeric characters.',
      };
    }
  }

  // Validate format: DR followed by 7-10 digits
  if (!DR_NUMBER_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid DR number format. Expected format: DR followed by 7-10 digits (e.g., DR1234567)',
    };
  }

  // Convert to uppercase to ensure consistency
  const sanitized = trimmed.toUpperCase();

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Throws an error if DR number is invalid
 * Useful for function guards
 *
 * @param drNumber - The DR number to validate
 * @returns The sanitized DR number if valid
 * @throws Error if DR number is invalid
 */
export function assertValidDrNumber(drNumber: string | undefined | null): string {
  const result = validateDrNumber(drNumber);

  if (!result.valid) {
    throw new Error(result.error || 'Invalid DR number');
  }

  return result.sanitized!;
}

/**
 * Sanitizes a DR number by trimming and converting to uppercase
 * Does NOT validate - use validateDrNumber for validation
 *
 * @param drNumber - The DR number to sanitize
 * @returns Sanitized DR number
 */
export function sanitizeDrNumber(drNumber: string): string {
  return drNumber.trim().toUpperCase();
}
